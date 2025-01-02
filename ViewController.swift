//
//  ViewController.swift
//  WebView
//
//  Created by MacBook on 01/01/2025.
//

import UIKit
import WebKit

/// ViewController that manages WebView and native-web communication
/// Communication Flow:
/// 1. iOS to WebView: Using WKWebView.evaluateJavaScript() to dispatch custom events
/// 2. WebView to iOS: Using window.webkit.messageHandlers.postMessageHandler.postMessage()
class ViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate {
    // MARK: - Properties
    private var webView: WKWebView!          // WebView instance for displaying web content
    private var logTextView: UITextView!     // Text view for displaying debug logs
    private var sendMessageButton: UIButton! // Button to trigger test messages
    private var logs: [String] = []          // Array to store debug logs
    
    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        setupUI()
        loadWebContent()
    }
    
    // MARK: - UI Setup
    private func setupUI() {
        setupLogView()
        setupSendMessageButton()
        setupWebViewLayout()
    }
    
    private func setupLogView() {
        // Create and configure log text view
        logTextView = UITextView()
        logTextView.isEditable = false
        logTextView.font = .monospacedSystemFont(ofSize: 12, weight: .regular)
        logTextView.backgroundColor = .black
        logTextView.textColor = .green
        logTextView.layer.cornerRadius = 8
        
        // Add to view
        view.addSubview(logTextView)
        
        // Setup constraints
        logTextView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            logTextView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            logTextView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            logTextView.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -20),
            logTextView.heightAnchor.constraint(equalToConstant: 200)
        ])
    }
    
    private func setupSendMessageButton() {
        // Create and configure send message button
        sendMessageButton = UIButton(type: .system)
        sendMessageButton.setTitle("Send Test Message", for: .normal)
        sendMessageButton.backgroundColor = .systemBlue
        sendMessageButton.setTitleColor(.white, for: .normal)
        sendMessageButton.layer.cornerRadius = 8
        sendMessageButton.addTarget(self, action: #selector(sendTestMessage), for: .touchUpInside)
        
        // Add to view
        view.addSubview(sendMessageButton)
        
        // Setup constraints
        sendMessageButton.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            sendMessageButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            sendMessageButton.bottomAnchor.constraint(equalTo: logTextView.topAnchor, constant: -20),
            sendMessageButton.widthAnchor.constraint(equalToConstant: 200),
            sendMessageButton.heightAnchor.constraint(equalToConstant: 44)
        ])
    }
    
    // MARK: - WebView Setup
    private func setupWebView() {
        // Create configuration with message handler
        let configuration = WKWebViewConfiguration()
        let contentController = WKUserContentController()
        
        // Register message handler for communication from WebView
        addLog("📱 Setting up message handler...")
        contentController.add(self, name: "postMessageHandler")
        
        // Inject script to listen for postMessage events and relay to native
        let messageHandlerScript = WKUserScript(
            source: """
            // Safely store original postMessage if it exists
            const originalPostMessage = window.postMessage ? window.postMessage.bind(window) : null;
            
            // Override window.postMessage with safety checks
            window.postMessage = function(message, targetOrigin, transfer) {
                try {
                    // Call original postMessage if it exists
                    if (originalPostMessage) {
                        originalPostMessage(message, targetOrigin || '*', transfer);
                    }
                    
                    // Only forward messages from webview to native
                    // Avoid forwarding messages that originated from native
                    if (message && message.source !== 'ios') {
                        // Add source if not present
                        if (!message.source) {
                            message.source = 'webview';
                        }
                        // Safely send to native if bridge exists
                        if (window.webkit && 
                            window.webkit.messageHandlers && 
                            window.webkit.messageHandlers.postMessageHandler) {
                            window.webkit.messageHandlers.postMessageHandler.postMessage(message);
                        } else {
                            console.warn('Native message bridge not found');
                        }
                    }
                } catch (error) {
                    console.error('Error in postMessage:', error);
                }
            };
            
            console.log('🔌 Message bridge initialized: postMessage overridden safely');
            """,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: false
        )
        
        contentController.addUserScript(messageHandlerScript)
        configuration.userContentController = contentController
        
        // Enable JavaScript and debugging
        configuration.preferences.javaScriptEnabled = true
        if #available(iOS 16.4, *) {
            configuration.preferences.isElementFullscreenEnabled = true
        }
        
        // Create and configure WebView
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        
        // Enable web inspector for debugging (iOS 16.4+)
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }
        
        // Add to view hierarchy
        view.addSubview(webView)
        
        addLog("✅ WebView setup complete")
    }
    
    // MARK: - Layout Setup
    private func setupWebViewLayout() {
        guard let webView = self.webView else {
            addLog("❌ WebView not initialized")
            return
        }
        
        webView.translatesAutoresizingMaskIntoConstraints = false
        
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            webView.bottomAnchor.constraint(equalTo: sendMessageButton.topAnchor, constant: -20)
        ])
        
        // Add styling
        webView.layer.borderWidth = 1
        webView.layer.borderColor = UIColor.systemBlue.cgColor
        webView.layer.cornerRadius = 8
    }
    
    private func loadWebContent() {
        guard let url = URL(string: "http://localhost:4200") else {
            addLog("❌ Invalid URL")
            return
        }
        
        let request = URLRequest(url: url)
        webView.load(request)
        addLog("🌐 Loading web content from: \(url)")
    }
    
    // MARK: - Message Handling
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        addLog("📥 Received message from WebView")
        
        guard let data = message.body as? [String: Any],
              let jsonData = try? JSONSerialization.data(withJSONObject: data),
              let webViewMessage = try? JSONDecoder().decode(WebViewMessage<[String: AnyCodable]>.self, from: jsonData) else {
            addLog("❌ Invalid message format")
            return
        }
        
        // Log received message
        if let jsonString = String(data: jsonData, encoding: .utf8) {
            addLog("📦 Message content: \(jsonString)")
        }
        
        // Process message
        handleMessage(webViewMessage)
    }
    
    private func handleMessage(_ message: WebViewMessage<[String: AnyCodable]>) {
        // Handle message based on type
        switch message.type {
        case "TEST_MESSAGE":
            if let payload = message.payload {
                let dictionary = payload.mapValues { $0.value }
                handleTestMessage(dictionary)
            }
        default:
            addLog("ℹ️ Received message: \(message.type)")
            // Echo back the message to confirm receipt
            sendMessageToWebView(type: "RECEIVED", payload: [
                "originalType": message.type,
                "timestamp": Date().timeIntervalSince1970 * 1000
            ])
        }
    }
    
    private func handleTestMessage(_ payload: [String: Any]) {
        addLog("📝 Handling test message: \(payload)")
        
        // Send acknowledgment
        sendMessageToWebView(type: "TEST_RESPONSE", payload: [
            "received": true,
            "timestamp": Date().timeIntervalSince1970 * 1000,
            "echo": payload
        ])
    }
    
    // MARK: - Message Sending (iOS to WebView)
    /// Sends a message to WebView by dispatching a custom event
    private func sendMessageToWebView(type: String, payload: [String: Any]) {
        let message: [String: Any] = [
            "type": type,
            "payload": payload,
            "source": "ios",
            "timestamp": Date().timeIntervalSince1970 * 1000
        ]
        
        guard let jsonData = try? JSONSerialization.data(withJSONObject: message),
              let jsonString = String(data: jsonData, encoding: .utf8) else {
            addLog("❌ Failed to serialize message")
            return
        }
        
        // Use postMessage
        let script = """
        window.postMessage(\(jsonString), '*');
        """
        
        webView.evaluateJavaScript(script) { [weak self] _, error in
            if let error = error {
                self?.addLog("❌ Failed to send message: \(error.localizedDescription)")
            } else {
                self?.addLog("✅ Message sent successfully")
            }
        }
    }
    
    // MARK: - Message Sending
    private func sendResponseToWebView(type: String, payload: [String: Any]) {
        addLog("📤 Sending response to WebView")
        
        let response: [String: Any] = [
            "type": type,
            "payload": payload,
            "source": "ios",
            "timestamp": Date().timeIntervalSince1970 * 1000
        ]
        
        guard let jsonData = try? JSONSerialization.data(withJSONObject: response),
              let jsonString = String(data: jsonData, encoding: .utf8) else {
            addLog("❌ Failed to create response JSON")
            return
        }
        
        let script = """
        window.dispatchEvent(new MessageEvent('message', {
            data: \(jsonString),
            origin: 'ios'
        }));
        """
        
        webView.evaluateJavaScript(script) { [weak self] _, error in
            if let error = error {
                self?.addLog("❌ Failed to send response: \(error.localizedDescription)")
            } else {
                self?.addLog("✅ Response sent successfully")
            }
        }
    }
    
    // MARK: - Logging
    private func addLog(_ message: String) {
        let timestamp = DateFormatter.localizedString(from: Date(), dateStyle: .none, timeStyle: .medium)
        logs.append("[\(timestamp)] \(message)")
        
        // Keep only last 100 logs
        if logs.count > 100 {
            logs.removeFirst(logs.count - 100)
        }
        
        // Update UI on main thread
        DispatchQueue.main.async { [weak self] in
            self?.logTextView.text = self?.logs.joined(separator: "\n")
            // Scroll to bottom
            let bottom = NSRange(location: self?.logTextView.text.count ?? 0, length: 0)
            self?.logTextView.scrollRangeToVisible(bottom)
        }
    }
    
    // MARK: - Test Message Action
    /// Sends a test message when the button is tapped
    @objc private func sendTestMessage() {
        addLog("📤 Sending test message to WebView")
        
        // Create test message payload
        let testPayload: [String: Any] = [
            "text": "Hello from iOS!",
            "timestamp": Date().timeIntervalSince1970 * 1000
        ]
        
        // Send message to WebView
        sendMessageToWebView(type: "TEST_FROM_IOS", payload: testPayload)
    }
}

// Message structures
struct WebViewMessage<T>: Codable where T: Codable {
    let type: String
    let payload: T?
    let source: MessageSource?
    let timestamp: TimeInterval?
    
    enum MessageSource: String, Codable {
        case webview
        case ios
        case android
    }
}

// Helper for handling dynamic JSON values
struct AnyCodable: Codable {
    let value: Any
    
    init(_ value: Any) {
        self.value = value
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if let string = try? container.decode(String.self) {
            value = string
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map(\.value)
        } else if let dictionary = try? container.decode([String: AnyCodable].self) {
            value = dictionary.mapValues(\.value)
        } else {
            value = NSNull()
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        
        switch value {
        case let string as String:
            try container.encode(string)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let bool as Bool:
            try container.encode(bool)
        case let array as [Any]:
            try container.encode(array.map(AnyCodable.init))
        case let dictionary as [String: Any]:
            try container.encode(dictionary.mapValues(AnyCodable.init))
        default:
            try container.encodeNil()
        }
    }
}


