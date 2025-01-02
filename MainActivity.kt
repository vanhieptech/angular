import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject
import java.util.*

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var logTextView: TextView
    private lateinit var sendMessageButton: Button
    private val logs = mutableListOf<String>()

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        setupWebView()
        setupUI()
        loadWebContent()
    }

    private fun setupWebView() {
        webView = findViewById(R.id.webView)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
        }

        // Add JavaScript Interface
        webView.addJavascriptInterface(WebAppInterface(), "Android")

        // Inject the message handler script
        val messageHandlerScript = """
            // Store original postMessage
            const originalPostMessage = window.postMessage ? window.postMessage.bind(window) : null;

            // Override window.postMessage
            window.postMessage = function(message, targetOrigin, transfer) {
                try {
                    // Call original postMessage if it exists
                    if (originalPostMessage) {
                        originalPostMessage(message, targetOrigin || '*', transfer);
                    }

                    // Only forward messages from webview to native
                    // Avoid forwarding messages that originated from native
                    if (message && message.source !== 'android') {
                        // Add source if not present
                        if (!message.source) {
                            message.source = 'webview';
                        }
                        // Send to native
                        if (window.Android && typeof window.Android.postMessage === 'function') {
                            window.Android.postMessage(JSON.stringify(message));
                        } else {
                            console.warn('Native message bridge not found');
                        }
                    }
                } catch (error) {
                    console.error('Error in postMessage:', error);
                }
            };

            console.log('🔌 Message bridge initialized: postMessage overridden safely');
        """.trimIndent()

        webView.evaluateJavascript(messageHandlerScript, null)
        addLog("✅ WebView setup complete")
    }

    private fun sendMessageToWebView(type: String, payload: Map<String, Any>) {
        val message = JSONObject().apply {
            put("type", type)
            put("payload", JSONObject(payload))
            put("source", "android")
            put("timestamp", System.currentTimeMillis())
        }

        val script = "window.postMessage(${message}, '*');"

        webView.post {
            webView.evaluateJavascript(script) { result ->
                addLog("✅ Message sent successfully")
            }
        }
    }

    inner class WebAppInterface {
        @JavascriptInterface
        fun postMessage(messageJson: String) {
            try {
                val message = JSONObject(messageJson)
                val type = message.getString("type")
                val payload = message.optJSONObject("payload") ?: JSONObject()

                when (type) {
                    "TEST_MESSAGE" -> handleTestMessage(payload)
                    else -> {
                        addLog("ℹ️ Received message: $type")
                        sendMessageToWebView("RECEIVED", mapOf(
                            "originalType" to type,
                            "timestamp" to System.currentTimeMillis()
                        ))
                    }
                }
            } catch (e: Exception) {
                addLog("❌ Error handling message: ${e.message}")
            }
        }
    }

    private fun handleTestMessage(payload: JSONObject) {
        addLog("📝 Handling test message: $payload")

        sendMessageToWebView("TEST_RESPONSE", mapOf(
            "received" to true,
            "timestamp" to System.currentTimeMillis(),
            "echo" to payload.toString()
        ))
    }

    private fun addLog(message: String) {
        val timestamp = Date().toString()
        logs.add("[$timestamp] $message")

        if (logs.size > 100) {
            logs.removeFirst()
        }

        runOnUiThread {
            logTextView.text = logs.joinToString("\n")
        }
    }
}
