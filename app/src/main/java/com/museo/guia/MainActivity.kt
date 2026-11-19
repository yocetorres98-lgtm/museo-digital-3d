package com.museo.guia

import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : AppCompatActivity(), JoystickView.Listener {

    private lateinit var web: WebView
    private lateinit var hud: android.view.View
    private lateinit var portada: android.view.View
    private lateinit var joystick: JoystickView
    private lateinit var textoObjetivo: TextView
    private lateinit var textoPista: TextView
    private lateinit var textoProgreso: TextView
    private lateinit var textoSaludo: TextView
    private lateinit var barraProgreso: ProgressBar
    private lateinit var aviso: TextView
    private lateinit var brujula: TextView
    private lateinit var progreso: TourProgress
    private lateinit var sesion: Sesion
    private lateinit var visitas: Visitas

    private var totalSalas = 12
    private var iniciado = false
    private var visorAbierto = false
    private var totalImagenes = 0
    private var imagenesOk = 0

    /** Sala elegida en el mapa; -1 si no se eligió ninguna. */
    private var salaPendiente = -1

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        sesion = Sesion(this)
        visitas = Visitas(this)

        // Seguridad: sin sesión activa no se entra al museo.
        if (!sesion.haySesion) {
            irAlLogin()
            return
        }

        setContentView(R.layout.activity_main)
        progreso = TourProgress(this)
        salaPendiente = intent.getIntExtra(EXTRA_SALA, -1)

        web = findViewById(R.id.webView)
        hud = findViewById(R.id.hud)
        portada = findViewById(R.id.portada)
        joystick = findViewById(R.id.joystick)
        textoObjetivo = findViewById(R.id.textoObjetivo)
        textoPista = findViewById(R.id.textoPista)
        textoProgreso = findViewById(R.id.textoProgreso)
        textoSaludo = findViewById(R.id.textoSaludo)
        barraProgreso = findViewById(R.id.barraProgreso)
        aviso = findViewById(R.id.aviso)
        brujula = findViewById(R.id.brujula)

        joystick.listener = this

        textoSaludo.text = if (sesion.registrado) {
            getString(R.string.bienvenida, sesion.nombre)
        } else {
            getString(R.string.bienvenida, getString(R.string.invitado))
        }

        configurarWeb()
        pantallaCompleta()
        mostrarProgresoGuardado()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        val sala = intent.getIntExtra(EXTRA_SALA, -1)
        if (sala < 0) return
        salaPendiente = sala
        aplicarSalaPendiente()
    }

    /** Si la partida ya corre, salta a la sala elegida en el mapa. */
    private fun aplicarSalaPendiente() {
        if (salaPendiente < 0 || !iniciado) return
        val sala = salaPendiente
        salaPendiente = -1
        mostrarAviso("Entrando en " + nombreSala(sala))
        ejecutar("window.Juego && window.Juego.irASala && window.Juego.irASala($sala);")
    }

    private fun nombreSala(indice: Int): String =
        SALAS.getOrNull(indice)?.second ?: "el museo"

    private fun irAlMenu() {
        startActivity(
            Intent(this, MenuActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        )
        finish()
    }

    private fun irAlLogin() {
        startActivity(
            Intent(this, RegistroActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        )
        finish()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configurarWeb() {
        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            @Suppress("DEPRECATION")
            allowFileAccessFromFileURLs = true
            @Suppress("DEPRECATION")
            allowUniversalAccessFromFileURLs = true
            loadWithOverviewMode = false
            useWideViewPort = false
            builtInZoomControls = false
            displayZoomControls = false
            mediaPlaybackRequiresUserGesture = false
            cacheMode = android.webkit.WebSettings.LOAD_NO_CACHE
        }
        web.setBackgroundColor(Color.parseColor("#241A12"))
        web.overScrollMode = View.OVER_SCROLL_NEVER
        web.isVerticalScrollBarEnabled = false
        web.isHorizontalScrollBarEnabled = false
        web.addJavascriptInterface(Puente(this), "Android")
        web.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                findViewById<TextView>(R.id.textoCargando).text =
                    getString(R.string.listo)
            }
        }
        web.loadUrl("file:///android_asset/web/index.html")
    }

    private fun pantallaCompleta() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.hide(WindowInsetsCompat.Type.systemBars())
        controller.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.attributes.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
    }

    private fun mostrarProgresoGuardado() {
        val mejor = progreso.mejorProgreso
        if (mejor > 0) {
            textoProgreso.text = "Progreso guardado $mejor/$totalSalas"
            barraProgreso.progress = (mejor * 100) / totalSalas
        }
    }

    // ---------------- Controles del HUD ----------------

    @Suppress("UNUSED_PARAMETER")
    fun onComenzar(view: View) {
        if (iniciado) return
        iniciado = true
        val sala = if (salaPendiente >= 0) salaPendiente else 0
        salaPendiente = -1
        // cuenta a la persona que ingresa al museo
        visitas.registrar(if (sesion.haySesion) sesion.nombre else "")
        portada.animate().alpha(0f).setDuration(350)
            .withEndAction { portada.visibility = View.GONE }.start()
        hud.visibility = View.VISIBLE
        val saludo = if (sesion.registrado) escapeJs(sesion.nombre) else ""
        ejecutar(
            "window.Juego && window.Juego.iniciarPartida && " +
                "window.Juego.iniciarPartida('$saludo','${escapeJs(sesion.correo)}',$sala);"
        )
        if (sala > 0) mostrarAviso("Entrando en " + nombreSala(sala))
    }

    @Suppress("UNUSED_PARAMETER")
    fun onAccion(view: View) {
        if (visorAbierto) return
        ejecutar("window.Accion && window.Accion.ver();")
    }

    /** Escapa comillas para poder pasar texto a JavaScript. */
    private fun escapeJs(texto: String): String =
        texto.replace("\\", "\\\\").replace("'", "\\'")

    @Suppress("UNUSED_PARAMETER")
    fun onMapa(view: View) {
        startActivity(Intent(this, MapaActivity::class.java))
    }

    /** Salir de la sala al pasillo para entrar a otra. */
    @Suppress("UNUSED_PARAMETER")
    fun onPasillo(view: View) {
        ejecutar("window.Juego && window.Juego.salirAlPasillo && window.Juego.salirAlPasillo();")
    }

    @Suppress("UNUSED_PARAMETER")
    fun onInfo(view: View) {
        val logros = progreso.logros()
        val msg = StringBuilder()
        msg.append("VISITA\n\n")
        if (sesion.registrado) {
            msg.append("• ${sesion.nombre}\n• ${sesion.correo}\n\n")
        } else {
            msg.append("• Entrando como invitado\n\n")
        }
        msg.append("CÓMO JUGAR\n\n")
        msg.append("• Muévete con el joystick (abajo izquierda).\n")
        msg.append("• Mira alrededor arrastrando el dedo en la pantalla.\n")
        msg.append("• Acércate a la marca dorada y pulsa VER.\n")
        msg.append("• La foto se abre ampliada; ciérrala para seguir.\n")
        msg.append("• La guía te lleva de sala en sala: complétalas todas.\n\n")
        msg.append("CONTROLES EN ORDENADOR\n\n")
        msg.append("WASD o flechas para caminar, ratón para mirar.\n\n")
        if (logros.isEmpty()) {
            msg.append("LOGROS\n\nTodavía no tienes logros. ¡Empieza el recorrido!")
        } else {
            msg.append("LOGROS\n\n• " + logros.joinToString("\n• "))
        }

        AlertDialog.Builder(this)
            .setTitle("Museo Guía 3D")
            .setMessage(msg.toString())
            .setPositiveButton("Seguir jugando", null)
            .setNeutralButton("Reiniciar recorrido") { _, _ ->
                progreso.reiniciar()
                reiniciarJS()
            }
            .setNegativeButton(getString(R.string.cerrar_sesion)) { _, _ ->
                confirmarCierreSesion()
            }
            .show()
    }

    private fun confirmarCierreSesion() {
        AlertDialog.Builder(this)
            .setTitle(R.string.cerrar_sesion)
            .setMessage(R.string.salir_confirmacion)
            .setPositiveButton(R.string.cerrar_sesion) { _, _ ->
                sesion.cerrarSesion()
                irAlMenu()
            }
            .setNegativeButton(android.R.string.cancel, null)
            .show()
    }

    private fun reiniciarJS() {
        iniciado = false
        portada.visibility = View.VISIBLE
        portada.alpha = 1f
        hud.visibility = View.GONE
        hud.alpha = 1f
        joystick.isEnabled = true
        visorAbierto = false
        textoObjetivo.text = "Habla con la guía"
        textoPista.text = "Acércate a la marca dorada y pulsa VER"
        textoProgreso.text = "Progreso 0/$totalSalas"
        barraProgreso.progress = 0
        ejecutar("window.Juego && window.Juego.reiniciar && window.Juego.reiniciar();")
    }

    // ---------------- Joystick ----------------

    override fun onMover(x: Float, y: Float) {
        ejecutar("window.Juego && window.Juego.setEntrada($x,$y);")
    }

    override fun onSoltar() {
        ejecutar("window.Juego && window.Juego.setEntrada(0,0);")
    }

    // ---------------- Salida ----------------

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (visorAbierto) {
            ejecutar("window.Juego && window.Juego.cerrarVisor && window.Juego.cerrarVisor();")
            return
        }
        if (iniciado) {
            mostrarDialogoSalida()
        } else {
            @Suppress("DEPRECATION")
            super.onBackPressed()
        }
    }

    /** Esconde el HUD mientras la foto ampliada está en pantalla. */
    fun mostrarVisor(abierto: Boolean) {
        visorAbierto = abierto
        if (abierto) {
            hud.animate().alpha(0f).setDuration(150).start()
            joystick.isEnabled = false
        } else {
            hud.animate().alpha(1f).setDuration(180).start()
            joystick.isEnabled = true
        }
    }

    private fun mostrarDialogoSalida() {
        AlertDialog.Builder(this)
            .setTitle("Salir del recorrido")
            .setMessage("¿Quieres cerrar el museo?")
            .setPositiveButton("Salir") { _, _ -> finish() }
            .setNegativeButton("Seguir", null)
            .show()
    }

    private fun ejecutar(js: String) {
        web.post { web.evaluateJavascript(js, null) }
    }

    fun mostrarAviso(texto: String) {
        runOnUiThread {
            aviso.text = texto
            aviso.visibility = View.VISIBLE
            aviso.animate().alpha(1f).setDuration(140).start()
            aviso.postDelayed({
                aviso.animate().alpha(0f).setDuration(320)
                    .withEndAction { aviso.visibility = View.GONE }.start()
            }, 1500)
        }
    }

    fun mostrarLogro(texto: String) {
        runOnUiThread {
            progreso.guardarLogro(texto)
            Toast.makeText(this, "🏆 Logro: $texto", Toast.LENGTH_LONG).show()
            mostrarAviso("🏆 Logro desbloqueado")
        }
    }

    fun alTerminar(salas: Int, total: Int) {
        runOnUiThread {
            mostrarAviso("🏁 Recorrido completo: $salas/$total")
            mostrarLogro("Guion completo: las 13 salas")
        }
    }

    // ---------------- Puente JS -> Kotlin ----------------

    inner class Puente(private val activity: MainActivity) {

        @JavascriptInterface
        fun escenaLista(total: Int) {
            activity.runOnUiThread {
                activity.totalSalas = total
                activity.textoProgreso.text = "Progreso ${activity.progreso.salasCompletadas}/$total"
            }
        }

        /** El visor de imagen cubre la pantalla: se aparta el HUD. */
        @JavascriptInterface
        fun visorAbierto(abierto: Boolean) {
            activity.runOnUiThread { activity.mostrarVisor(abierto) }
        }

        /** Cuántas fotos del museo se pudieron cargar. */
        @JavascriptInterface
        fun imagenesCargadas(ok: Int, fallos: Int) {
            activity.runOnUiThread {
                activity.totalImagenes = ok + fallos
                activity.imagenesOk = ok
                if (fallos > 0) {
                    activity.mostrarAviso("⚠ $fallos imágenes no se pudieron cargar")
                }
            }
        }

        @JavascriptInterface
        fun setObjetivo(objetivo: String?, pista: String?) {
            activity.runOnUiThread {
                activity.textoObjetivo.text = objetivo ?: ""
                activity.textoPista.text = pista ?: ""
            }
        }

        @JavascriptInterface
        fun setProgreso(completadas: Int, total: Int) {
            activity.runOnUiThread {
                activity.totalSalas = total
                activity.progreso.registrarAvance(completadas)
                activity.textoProgreso.text = "Progreso $completadas/$total"
                activity.barraProgreso.progress =
                        if (total > 0) (completadas * 100) / total else 0
            }
        }

        @JavascriptInterface
        fun obraVista(municipioId: String?, indice: Int) {
            if (municipioId != null) {
                activity.progreso.registrarObra(municipioId, indice)
                if (activity.progreso.obrasDe(municipioId) >= 3) {
                    activity.mostrarLogro("Sala completa: " + nombreDe(municipioId))
                }
            }
        }

        @JavascriptInterface
        fun salaDescubierta(municipioId: String?) {
            activity.mostrarAviso("Sala de ${nombreDe(municipioId ?: "")} desbloqueada")
        }

        @JavascriptInterface
        fun juegoTerminado(salas: Int, total: Int) {
            activity.alTerminar(salas, total)
        }

        @JavascriptInterface
        fun aviso(texto: String?) {
            activity.mostrarAviso(texto ?: "")
        }

        @JavascriptInterface
        fun brujula(angulo: Double) {
            val a = Math.toDegrees(angulo)
            val flechas = when {
                kotlin.math.abs(a) < 25 -> "▲  ·  ·  ·"
                kotlin.math.abs(a) < 70 -> "▲  ·  ·  ▶"
                kotlin.math.abs(a) < 115 -> "·  ·  ▶  ·"
                kotlin.math.abs(a) < 160 -> "▼  ·  ·  ▶"
                kotlin.math.abs(a) < 205 -> "▼  ·  ·  ·"
                kotlin.math.abs(a) < 250 -> "▼  ·  ·  ◀"
                kotlin.math.abs(a) < 295 -> "·  ·  ◀  ·"
                kotlin.math.abs(a) < 335 -> "▲  ·  ·  ◀"
                else -> "▲  ·  ·  ·"
            }
            activity.runOnUiThread { activity.brujula.text = flechas }
        }
    }

    /** Traduce el id de data.js al nombre del municipio. */
    private fun nombreDe(id: String): String =
        SALAS.firstOrNull { it.first == id }?.second ?: id

    companion object {
        const val EXTRA_SALA = "sala"

        /** id de data.js + nombre visible, en el orden del recorrido. */
        val SALAS = listOf(
            "amecameca" to "Amecameca",
            "chalco" to "Chalco",
            "ozumba" to "Ozumba",
            "tlalmanalco" to "Tlalmanalco",
            "ayapango" to "Ayapango",
            "tepetlixpa" to "Tepetlixpa",
            "cocotitla" to "Cocotitla",
            "atlautla" to "Atlautla",
            "tenango-del-aire" to "Tenango del Aire",
            "temamatla" to "Temamatla",
            "nepantla" to "San Miguel Nepantla",
            "ecatzingo" to "Ecatzingo de Hidalgo",
            "estadisticas" to "Sala de estadísticas"
        )
    }
}