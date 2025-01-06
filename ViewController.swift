//
//  ViewController.swift
//  WebView
//
//  Created by MacBook on 01/01/2025.
//

import UIKit
import WebKit
import AVFoundation

/// ViewController that manages WebView and native-web communication with permission handling
class ViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate {
    // MARK: - Properties
    private var webView: WKWebView!
    private var logTextView: UITextView!
    private var logs: [String] = []

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
        setupWebViewLayout()
    }

    private func setupLogView() {
        logTextView = UITextView()
        logTextView.isEditable = false
        logTextView.font = .monospacedSystemFont(ofSize: 12, weight: .regular)
        logTextView.backgroundColor = .black
        logTextView.textColor = .green
        logTextView.layer.cornerRadius = 8

        view.addSubview(logTextView)

        logTextView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            logTextView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            logTextView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            logTextView.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -20),
            logTextView.heightAnchor.constraint(equalToConstant: 200)
        ])
    }

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
            webView.bottomAnchor.constraint(equalTo: logTextView.topAnchor, constant: -20)
        ])

        webView.layer.borderWidth = 1
        webView.layer.borderColor = UIColor.systemBlue.cgColor
        webView.layer.cornerRadius = 8
    }

    // MARK: - WebView Setup
    private func setupWebView() {
        let configuration = WKWebViewConfiguration()
        let contentController = WKUserContentController()

        // Register message handlers
        addLog("📱 Setting up message handlers...")
        contentController.add(self, name: "postMessageHandler")

        // Configure media settings for native permission handling
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.allowsInlineMediaPlayback = true

        if #available(iOS 15.0, *) {
            // Enable camera and microphone access without user gesture
            configuration.mediaTypesRequiringUserActionForPlayback = []
            // Enable device orientation access
            configuration.allowsAirPlayForMediaPlayback = true
        }

        configuration.userContentController = contentController

        // Create and configure WebView
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self

        // Enable debugging
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }

        // Add to view hierarchy
        view.addSubview(webView)

        addLog("✅ WebView setup complete with native permission handling")
    }

    private func loadWebContent() {
        guard let url = URL(string: "https://edge-cdb-sit.techcombank.com.vn/origination/en/sign-up") else {
            addLog("❌ Invalid URL")
            return
        }

        let request = URLRequest(url: url)
        webView.load(request)
        addLog("🌐 Loading web content from: \(url)")
    }

    // MARK: - WKUIDelegate Methods
    func webView(
        _ webView: WKWebView,
        requestMediaCapturePermissionFor origin: WKSecurityOrigin,
        initiatedByFrame frame: WKFrameInfo,
        type: WKMediaCaptureType,
        decisionHandler: @escaping (WKPermissionDecision) -> Void
    ) {
        addLog("🎥 Native permission request from \(origin.host) for \(type.rawValue)")

        let mediaType: AVMediaType = type == .microphone ? .audio : .video

        switch AVCaptureDevice.authorizationStatus(for: mediaType) {
        case .notDetermined:
            addLog("⏳ Requesting system permission for \(mediaType.rawValue)...")
            AVCaptureDevice.requestAccess(for: mediaType) { granted in
                DispatchQueue.main.async {
                    let decision: WKPermissionDecision = granted ? .grant : .deny
                    decisionHandler(decision)
                    self.addLog(granted ? "✅ System permission granted" : "❌ System permission denied")

                    if !granted {
                        self.handleDeniedPermission(for: mediaType)
                    }
                }
            }

        case .restricted:
            addLog("🚫 System permission restricted")
            decisionHandler(.deny)
            self.handleRestrictedPermission(for: mediaType)

        case .denied:
            addLog("❌ System permission denied")
            decisionHandler(.deny)
            self.handleDeniedPermission(for: mediaType)

        case .authorized:
            addLog("✅ System permission already granted")
            decisionHandler(.grant)

        @unknown default:
            addLog("⚠️ Unknown permission status")
            decisionHandler(.prompt)
        }
    }

    func webView(
        _ webView: WKWebView,
        requestDeviceOrientationAndMotionPermissionFor origin: WKSecurityOrigin,
        initiatedByFrame frame: WKFrameInfo,
        decisionHandler: @escaping (WKPermissionDecision) -> Void
    ) {
        addLog("🧭 Device orientation permission request from \(origin.host)")
        decisionHandler(.prompt)
    }

    // MARK: - Permission Helpers
    private func handleDeniedPermission(for mediaType: AVMediaType) {
        let type = mediaType == .video ? "Camera" : "Microphone"
        let alert = UIAlertController(
            title: "\(type) Access Required",
            message: "Please enable \(type.lowercased()) access in Settings to use this feature.",
            preferredStyle: .alert
        )

        alert.addAction(UIAlertAction(title: "Open Settings", style: .default) { _ in
            if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
                UIApplication.shared.open(settingsUrl)
            }
        })

        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))

        present(alert, animated: true)
    }

    private func handleRestrictedPermission(for mediaType: AVMediaType) {
        let type = mediaType == .video ? "Camera" : "Microphone"
        let alert = UIAlertController(
            title: "\(type) Access Restricted",
            message: "Access to the \(type.lowercased()) is restricted. This may be due to parental controls or other system settings.",
            preferredStyle: .alert
        )

        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }

    // MARK: - WKScriptMessageHandler
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        addLog("📥 Received message from WebView: \(message.name)")

        guard let data = message.body as? [String: Any] else {
            addLog("❌ Invalid message format")
            return
        }

        // Log received message
        if let jsonData = try? JSONSerialization.data(withJSONObject: data),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            addLog("📦 Message content: \(jsonString)")
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
}
