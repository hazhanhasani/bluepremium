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
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
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

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var loading: View

    companion object {
        private const val APP_URL = "https://bluepremium.hazhanhasani4268-0f9.workers.dev/?ui=4&app=1.3.0"
        private const val APP_HOST = "bluepremium.hazhanhasani4268-0f9.workers.dev"
        private const val BG = "#050912"
    }

    @SuppressLint("SetJavaScriptEnabled")
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
            setSupportZoom(false)\n            cacheMode = android.webkit.WebSettings.LOAD_NO_CACHE
            val appVersion = runCatching {
                packageManager.getPackageInfo(packageName, 0).versionName ?: "1.1"
            }.getOrDefault("1.1")
            userAgentString = userAgentString + " BluePremiumAndroid/" + appVersion
        }

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

        webView.clearCache(true)\n        webView.loadUrl(APP_URL)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })
    }

    private fun buildLoadingView(): View {
        val wrap = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor(BG))
        }

        val logo = TextView(this).apply {
            text = "B"
            gravity = Gravity.CENTER
            textSize = 30f
            setTextColor(Color.WHITE)
            setTypeface(typeface, Typeface.BOLD)
            setBackgroundResource(R.drawable.ic_launcher)
        }
        wrap.addView(logo, LinearLayout.LayoutParams(dp(76), dp(76)))

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

    override fun onResume() {
        super.onResume()
        if (::webView.isInitialized && webView.url?.startsWith(APP_URL) == true) {
            webView.evaluateJavascript("if(typeof check==='function'){check()}", null)
        }
    }
}
