package app.bluepremium

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.net.Uri
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.animation.DecelerateInterpolator
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature
import ir.cafebazaar.poolakey.Connection
import ir.cafebazaar.poolakey.ConnectionState
import ir.cafebazaar.poolakey.Payment
import ir.cafebazaar.poolakey.config.PaymentConfiguration
import ir.cafebazaar.poolakey.config.SecurityCheck
import ir.cafebazaar.poolakey.entity.PurchaseInfo
import ir.cafebazaar.poolakey.entity.PurchaseState
import ir.cafebazaar.poolakey.request.PurchaseRequest
import org.json.JSONArray
import org.json.JSONObject

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var loading: View

    private var bazaarPayment: Payment? = null
    private var bazaarConnection: Connection? = null
    private var bazaarRsaKey: String = ""
    private var pendingBazaarPurchase: PendingBazaarPurchase? = null
    private var pendingBazaarQuery: Boolean = false

    private data class PendingBazaarPurchase(
        val productId: String,
        val orderCode: String,
        val orderToken: String,
    )

    companion object {
        private const val APP_URL = "https://bluepremium.hazhanhasani4268-0f9.workers.dev/?ui=8&app=1.6.0"
        private const val APP_HOST = "bluepremium.hazhanhasani4268-0f9.workers.dev"
        private const val BG = "#050912"
    }

    @SuppressLint("SetJavaScriptEnabled", "JavascriptInterface")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.parseColor(BG)

        val root = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor(BG))
        }

        webView = WebView(this).apply {
            setBackgroundColor(Color.parseColor(BG))
            alpha = 0f
            overScrollMode = View.OVER_SCROLL_NEVER
        }
        root.addView(
            webView,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )

        loading = buildLoadingView()
        root.addView(
            loading,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )
        setContentView(root)

        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(0, bars.top, 0, bars.bottom)
            insets
        }

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW
            mediaPlaybackRequiresUserGesture = true
            setSupportZoom(false)
            cacheMode = android.webkit.WebSettings.LOAD_NO_CACHE
            val appVersion = runCatching {
                packageManager.getPackageInfo(packageName, 0).versionName ?: "1.6"
            }.getOrDefault("1.6")
            userAgentString = userAgentString + " BluePremiumAndroid/" + appVersion
        }

        webView.addJavascriptInterface(BazaarBridge(), "BluePremiumNative")

        if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK_STRATEGY)) {
            WebSettingsCompat.setForceDarkStrategy(
                webView.settings,
                WebSettingsCompat.DARK_STRATEGY_WEB_THEME_DARKENING_ONLY
            )
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                return if (uri.scheme == "https" && uri.host == APP_HOST) {
                    false
                } else {
                    openExternal(uri)
                    true
                }
            }

            override fun onPageFinished(view: WebView, url: String) {
                webView.animate()
                    .alpha(1f)
                    .setDuration(260)
                    .setInterpolator(DecelerateInterpolator())
                    .start()

                loading.animate()
                    .alpha(0f)
                    .setDuration(220)
                    .withEndAction { loading.visibility = View.GONE }
                    .start()
            }
        }

        webView.clearCache(true)
        webView.loadUrl(APP_URL)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })
    }

    private inner class BazaarBridge {
        @JavascriptInterface
        fun isCafeBazaarBillingAvailable(): Boolean = true

        @JavascriptInterface
        fun purchaseCafeBazaar(
            productId: String,
            orderCode: String,
            orderToken: String,
            rsaPublicKey: String,
        ) {
            val product = productId.trim()
            val code = orderCode.trim()
            val token = orderToken.trim()
            val rsa = rsaPublicKey.trim()

            if (!product.matches(Regex("^[A-Za-z0-9_.-]{1,160}$")) ||
                !code.matches(Regex("^BP-[A-Z0-9]{6,40}$")) ||
                !token.matches(Regex("^[A-Za-z0-9_.-]{10,128}$")) ||
                rsa.length !in 100..8192
            ) {
                emitBazaarError("اطلاعات پرداخت کافه‌بازار معتبر نیست.")
                return
            }

            runOnUiThread {
                pendingBazaarPurchase = PendingBazaarPurchase(product, code, token)
                ensureBazaarPayment(rsa)
            }
        }

        @JavascriptInterface
        fun restoreCafeBazaarPurchases(rsaPublicKey: String) {
            val rsa = rsaPublicKey.trim()
            if (rsa.length !in 100..8192) return
            runOnUiThread {
                pendingBazaarQuery = true
                ensureBazaarPayment(rsa)
            }
        }

        @JavascriptInterface
        fun consumeCafeBazaar(purchaseToken: String, orderCode: String, orderToken: String) {
            val purchase = purchaseToken.trim()
            val code = orderCode.trim()
            val token = orderToken.trim()
            if (purchase.isBlank() || code.isBlank() || token.isBlank()) return

            runOnUiThread {
                val payment = bazaarPayment
                if (payment == null || bazaarConnection?.getState() != ConnectionState.Connected) {
                    emitBazaarEvent(
                        "onConsumeFailed",
                        JSONObject()
                            .put("orderCode", code)
                            .put("message", "اتصال به کافه‌بازار برقرار نیست.")
                    )
                    return@runOnUiThread
                }
                payment.consumeProduct(purchaseToken = purchase) {
                    consumeSucceed {
                        emitBazaarEvent(
                            "onConsumeSuccess",
                            JSONObject()
                                .put("orderCode", code)
                                .put("token", token)
                                .put("purchaseToken", purchase)
                        )
                    }
                    consumeFailed { throwable ->
                        emitBazaarEvent(
                            "onConsumeFailed",
                            JSONObject()
                                .put("orderCode", code)
                                .put("message", throwable.message ?: "مصرف خرید انجام نشد.")
                        )
                    }
                }
            }
        }
    }

    private fun ensureBazaarPayment(rsaPublicKey: String) {
        val sameConfiguration = bazaarPayment != null && bazaarRsaKey == rsaPublicKey
        if (sameConfiguration && bazaarConnection?.getState() == ConnectionState.Connected) {
            drainBazaarTasks()
            return
        }

        bazaarConnection?.disconnect()
        bazaarConnection = null
        bazaarPayment = null
        bazaarRsaKey = rsaPublicKey

        try {
            val securityCheck = SecurityCheck.Enable(rsaPublicKey = rsaPublicKey)
            val config = PaymentConfiguration(localSecurityCheck = securityCheck)
            val payment = Payment(context = this, config = config)
            bazaarPayment = payment
            bazaarConnection = payment.connect {
                connectionSucceed {
                    drainBazaarTasks()
                }
                connectionFailed { throwable ->
                    pendingBazaarPurchase = null
                    pendingBazaarQuery = false
                    emitBazaarError(throwable.message ?: "اتصال به کافه‌بازار ناموفق بود.")
                }
                disconnected {
                    emitBazaarEvent(
                        "onConnectionState",
                        JSONObject().put("connected", false)
                    )
                }
            }
        } catch (throwable: Throwable) {
            pendingBazaarPurchase = null
            pendingBazaarQuery = false
            emitBazaarError(throwable.message ?: "راه‌اندازی پرداخت کافه‌بازار ناموفق بود.")
        }
    }

    private fun drainBazaarTasks() {
        if (pendingBazaarQuery) {
            pendingBazaarQuery = false
            queryBazaarPurchases()
        }

        val pending = pendingBazaarPurchase ?: return
        pendingBazaarPurchase = null
        launchBazaarPurchase(pending)
    }

    private fun launchBazaarPurchase(pending: PendingBazaarPurchase) {
        val payment = bazaarPayment
        if (payment == null || bazaarConnection?.getState() != ConnectionState.Connected) {
            emitBazaarError("اتصال به کافه‌بازار برقرار نیست.")
            return
        }

        payment.purchaseProduct(
            registry = activityResultRegistry,
            request = PurchaseRequest(
                productId = pending.productId,
                payload = pending.orderCode,
            ),
        ) {
            purchaseFlowBegan {
                emitBazaarEvent(
                    "onPurchaseFlowBegan",
                    JSONObject().put("orderCode", pending.orderCode)
                )
            }
            failedToBeginFlow { throwable ->
                emitBazaarEvent(
                    "onPurchaseFailed",
                    JSONObject()
                        .put("orderCode", pending.orderCode)
                        .put("message", throwable.message ?: "باز کردن صفحه پرداخت بازار ناموفق بود.")
                )
            }
            purchaseSucceed { purchaseInfo ->
                emitBazaarEvent(
                    "onPurchaseSuccess",
                    purchaseToJson(purchaseInfo)
                        .put("orderCode", pending.orderCode)
                        .put("token", pending.orderToken)
                )
            }
            purchaseCanceled {
                emitBazaarEvent(
                    "onPurchaseCanceled",
                    JSONObject().put("orderCode", pending.orderCode)
                )
            }
            purchaseFailed { throwable ->
                emitBazaarEvent(
                    "onPurchaseFailed",
                    JSONObject()
                        .put("orderCode", pending.orderCode)
                        .put("message", throwable.message ?: "پرداخت کافه‌بازار ناموفق بود.")
                )
            }
        }
    }

    private fun queryBazaarPurchases() {
        val payment = bazaarPayment ?: return
        if (bazaarConnection?.getState() != ConnectionState.Connected) return

        payment.getPurchasedProducts {
            querySucceed { purchases ->
                val array = JSONArray()
                purchases.forEach { array.put(purchaseToJson(it)) }
                emitBazaarEvent(
                    "onRestorePurchases",
                    JSONObject().put("purchases", array)
                )
            }
            queryFailed { throwable ->
                emitBazaarEvent(
                    "onRestoreFailed",
                    JSONObject().put("message", throwable.message ?: "بازیابی خریدهای بازار ناموفق بود.")
                )
            }
        }
    }

    private fun purchaseToJson(purchase: PurchaseInfo): JSONObject =
        JSONObject()
            .put("order_id", purchase.orderId)
            .put("purchase_token", purchase.purchaseToken)
            .put("payload", purchase.payload)
            .put("package_name", purchase.packageName)
            .put("purchase_state", if (purchase.purchaseState == PurchaseState.PURCHASED) 0 else 1)
            .put("purchase_time", purchase.purchaseTime)
            .put("product_id", purchase.productId)
            .put("original_json", purchase.originalJson)
            .put("data_signature", purchase.dataSignature)

    private fun emitBazaarError(message: String) {
        emitBazaarEvent(
            "onPurchaseFailed",
            JSONObject().put("message", message)
        )
    }

    private fun emitBazaarEvent(functionName: String, payload: JSONObject) {
        if (!::webView.isInitialized) return
        val script = "window.BluePremiumBazaar && window.BluePremiumBazaar." +
            functionName + "(" + payload.toString() + ");"
        webView.post {
            webView.evaluateJavascript(script, null)
        }
    }

    private fun buildLoadingView(): View {
        val wrap = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor(BG))
        }

        val logo = ImageView(this).apply {
            setImageResource(R.drawable.bluepremium_brandmark)
            scaleType = ImageView.ScaleType.FIT_CENTER
            contentDescription = "Blue Premium"
        }
        wrap.addView(logo, LinearLayout.LayoutParams(dp(96), dp(96)))

        val title = TextView(this).apply {
            text = "بلوپرمیوم"
            textSize = 19f
            setTextColor(Color.WHITE)
            setTypeface(typeface, Typeface.BOLD)
            gravity = Gravity.CENTER
        }
        wrap.addView(
            title,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dp(18) }
        )

        val caption = TextView(this).apply {
            text = "Blue Premium"
            textSize = 11f
            setTextColor(Color.parseColor("#8298B3"))
            gravity = Gravity.CENTER
            letterSpacing = 0.12f
        }
        wrap.addView(caption)

        val spinner = ProgressBar(this).apply {
            isIndeterminate = true
        }
        wrap.addView(
            spinner,
            LinearLayout.LayoutParams(dp(34), dp(34)).apply {
                topMargin = dp(24)
            }
        )

        return wrap
    }

    private fun openExternal(uri: Uri) {
        runCatching {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
        }
    }

    private fun dp(value: Int): Int =
        (value * resources.displayMetrics.density).toInt()

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        if (intent.data?.scheme == "bluepremium" && intent.data?.host == "payment-return") {
            if (::webView.isInitialized) {
                webView.loadUrl(APP_URL)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        if (::webView.isInitialized) {
            val currentHost = runCatching { Uri.parse(webView.url ?: "").host }.getOrNull()
            if (currentHost == APP_HOST) {
                webView.evaluateJavascript("if(typeof check==='function'){check()}", null)
            }
        }
    }

    override fun onDestroy() {
        bazaarConnection?.disconnect()
        bazaarConnection = null
        bazaarPayment = null
        webView.removeJavascriptInterface("BluePremiumNative")
        super.onDestroy()
    }
}
