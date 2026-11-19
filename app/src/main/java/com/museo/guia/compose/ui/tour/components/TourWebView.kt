package com.museo.guia.compose.ui.tour.components

import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.ApplicationInfo
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun TourWebView(
    context: Context,
    modifier: Modifier = Modifier,
    nombre: String = "",
    correo: String = "",
    sala: Int = 0,
    onReady: (WebView) -> Unit = {}
) {
    AndroidView(
        modifier = modifier,
        factory = { ctx ->
            WebView(ctx).apply {
                val depurable = (ctx.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
                if (depurable) {
                    WebView.setWebContentsDebuggingEnabled(true)
                }
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.allowFileAccess = true
                settings.allowFileAccessFromFileURLs = true
                settings.allowUniversalAccessFromFileURLs = true
                settings.cacheMode = WebSettings.LOAD_NO_CACHE
                settings.setSupportZoom(false)
                settings.mediaPlaybackRequiresUserGesture = false
                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView, url: String) {
                        super.onPageFinished(view, url)
                        val nombreJs = nombre.replace("\\", "\\\\").replace("'", "\\'")
                        val correoJs = correo.replace("\\", "\\\\").replace("'", "\\'")
                        view.evaluateJavascript(
                            "window.Juego && window.Juego.iniciarPartida && " +
                                "window.Juego.iniciarPartida('" + nombreJs + "','" + correoJs + "'," + sala + ");",
                            null
                        )
                    }
                }
                loadUrl("file:///android_asset/web/index.html")
            }.also { onReady(it) }
        }
    )
}
