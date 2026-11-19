package com.museo.guia.compose.ui.tour

import android.webkit.WebView
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.museo.guia.JoystickView
import com.museo.guia.Sesion
import com.museo.guia.compose.ui.theme.MuseoTheme
import com.museo.guia.compose.ui.tour.components.TourWebView

@Composable
fun Tour3DScreen(onBack: () -> Unit) {
    MuseoTheme {
        val context = LocalContext.current
        val sesion = remember { Sesion(context) }
        var webView by remember { mutableStateOf<WebView?>(null) }

        Box(modifier = Modifier.fillMaxSize()) {
            TourWebView(
                context = context,
                modifier = Modifier.fillMaxSize(),
                nombre = if (sesion.haySesion) sesion.nombre else "",
                correo = if (sesion.haySesion) sesion.correo else "",
                sala = 0,
                onReady = { webView = it }
            )

            AndroidView(
                factory = { ctx ->
                    JoystickView(ctx).apply {
                        listener = object : JoystickView.Listener {
                            override fun onMover(x: Float, y: Float) {
                                webView?.evaluateJavascript(
                                    "window.Juego && window.Juego.setEntrada && " +
                                        "window.Juego.setEntrada(" + x + "," + y + ");",
                                    null
                                )
                            }

                            override fun onSoltar() {
                                webView?.evaluateJavascript(
                                    "window.Juego && window.Juego.setEntrada && " +
                                        "window.Juego.setEntrada(0,0);",
                                    null
                                )
                            }
                        }
                    }
                },
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(16.dp)
                    .size(140.dp)
            )

            IconButton(
                onClick = onBack,
                modifier = Modifier.align(Alignment.TopStart).padding(8.dp)
            ) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Atrás")
            }
        }
    }
}
