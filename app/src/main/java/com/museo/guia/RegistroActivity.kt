package com.museo.guia

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

/**
 * Pantalla de acceso. Permite crear una cuenta o iniciar sesión, y también
 * entrar como invitado. Al terminar arranca el recorrido (MainActivity).
 */
class RegistroActivity : AppCompatActivity() {

    private lateinit var sesion: Sesion

    private lateinit var pestanaRegistro: TextView
    private lateinit var pestanaLogin: TextView
    private lateinit var etiquetaNombre: TextView
    private lateinit var etiquetaRepetir: TextView
    private lateinit var campoNombre: EditText
    private lateinit var campoCorreo: EditText
    private lateinit var campoClave: EditText
    private lateinit var campoRepetir: EditText
    private lateinit var aviso: TextView
    private lateinit var botonPrincipal: TextView

    private var modoRegistro = true

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        sesion = Sesion(this)
        setContentView(R.layout.activity_registro)
        pantallaCompleta()

        pestanaRegistro = findViewById(R.id.pestanaRegistro)
        pestanaLogin = findViewById(R.id.pestanaLogin)
        etiquetaNombre = findViewById(R.id.etiquetaNombre)
        etiquetaRepetir = findViewById(R.id.etiquetaRepetir)
        campoNombre = findViewById(R.id.campoNombre)
        campoCorreo = findViewById(R.id.campoCorreo)
        campoClave = findViewById(R.id.campoClave)
        campoRepetir = findViewById(R.id.campoRepetir)
        aviso = findViewById(R.id.avisoRegistro)
        botonPrincipal = findViewById(R.id.btnEntrar)

        if (sesion.registrado) {
            campoNombre.setText(sesion.nombre)
            campoCorreo.setText(sesion.correo)
            aplicarModo(false)
        } else {
            aplicarModo(true)
        }

        campoRepetir.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                onEnviar(botonPrincipal)
                true
            } else {
                false
            }
        }
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

    // ---------------- Modo registro / login ----------------

    private fun aplicarModo(registro: Boolean) {
        modoRegistro = registro
        pestanaRegistro.setBackgroundResource(
            if (registro) R.drawable.login_pestana_activa else R.drawable.login_pestana_inactiva
        )
        pestanaRegistro.typeface = if (registro) TIPO_NEGRITA else TIPO_NORMAL
        pestanaLogin.setBackgroundResource(
            if (registro) R.drawable.login_pestana_inactiva else R.drawable.login_pestana_activa
        )
        pestanaLogin.typeface = if (registro) TIPO_NORMAL else TIPO_NEGRITA

        campoNombre.visibility = if (registro) View.VISIBLE else View.GONE
        etiquetaNombre.visibility = if (registro) View.VISIBLE else View.GONE
        campoRepetir.visibility = if (registro) View.VISIBLE else View.GONE
        etiquetaRepetir.visibility = if (registro) View.VISIBLE else View.GONE

        botonPrincipal.text = getString(
            if (registro) R.string.btn_registrarme else R.string.btn_entrar
        )
        ocultarAviso()
    }

    @Suppress("UNUSED_PARAMETER")
    fun onPestanaRegistro(view: View) {
        aplicarModo(true)
    }

    @Suppress("UNUSED_PARAMETER")
    fun onPestanaLogin(view: View) {
        aplicarModo(false)
    }

    // ---------------- Acciones ----------------

    @Suppress("UNUSED_PARAMETER")
    fun onInvitado(view: View) {
        sesion.entrarComoInvitado()
        abrirMuseo()
    }

    @Suppress("UNUSED_PARAMETER")
    fun onEnviar(view: View) {
        val nombre = campoNombre.text.toString().trim()
        val correo = campoCorreo.text.toString().trim()
        val clave = campoClave.text.toString()

        if (modoRegistro) {
            if (nombre.length < 3) return fallar(R.string.err_nombre)
            if (!correoValido(correo)) return fallar(R.string.err_correo)
            if (clave.length != 8) return fallar(R.string.err_password)
            if (clave != campoRepetir.text.toString()) return fallar(R.string.err_repetir)

            // registro remoto en un hilo aparte
            botonPrincipal.isEnabled = false
            aviso.visibility = View.GONE
            Thread {
                val r = MuseoApi.registrar(nombre, correo, clave)
                runOnUiThread {
                    botonPrincipal.isEnabled = true
                    when (r.codigo) {
                        MuseoApi.OK -> {
                            sesion.registrar(nombre, correo, clave)
                            abrirMuseo()
                        }
                        MuseoApi.ERROR_YA_EXISTE -> fallar(R.string.err_ya_existe)
                        MuseoApi.ERROR_RED ->
                            // sin servidor: guarda local para no bloquear al usuario
                            if (!sesion.existeCorreo(correo)) {
                                sesion.registrar(nombre, correo, clave)
                                abrirMuseo()
                            } else fallar(R.string.err_ya_existe)
                        else -> fallarTexto(r.mensaje.ifEmpty { getString(R.string.err_servidor) })
                    }
                }
            }.start()
        } else {
            if (!correoValido(correo)) return fallar(R.string.err_correo)
            if (clave.length != 8) return fallar(R.string.err_password)

            botonPrincipal.isEnabled = false
            aviso.visibility = View.GONE
            Thread {
                val r = MuseoApi.iniciarSesion(correo, clave)
                runOnUiThread {
                    botonPrincipal.isEnabled = true
                    when (r.codigo) {
                        MuseoApi.OK -> {
                            sesion.guardarToken(r.token)
                            val n = if (nombre.length >= 3) nombre else sesion.nombre
                            sesion.registrar(n, correo, clave)
                            abrirMuseo()
                        }
                        MuseoApi.ERROR_CREDENCIALES -> fallar(R.string.err_credenciales)
                        MuseoApi.ERROR_RED ->
                            // sin servidor: valida contra lo guardado localmente
                            if (sesion.validar(correo, clave)) abrirMuseo()
                            else fallar(R.string.err_no_existe)
                        else -> fallarTexto(r.mensaje.ifEmpty { getString(R.string.err_servidor) })
                    }
                }
            }.start()
        }
    }

    private fun fallar(mensaje: Int) {
        aviso.setText(mensaje)
        aviso.visibility = View.VISIBLE
    }

    private fun fallarTexto(mensaje: String) {
        aviso.text = mensaje
        aviso.visibility = View.VISIBLE
    }

    private fun ocultarAviso() {
        aviso.visibility = View.GONE
    }

    private fun correoValido(correo: String): Boolean {
        if (correo.isEmpty() || !correo.contains("@")) return false
        val partes = correo.split("@")
        if (partes.size != 2) return false
        val dominio = partes[1]
        return dominio.contains(".") && !dominio.startsWith(".") && !dominio.endsWith(".")
    }

    private fun abrirMuseo() {
        // vuelve al menú principal ya con la sesión iniciada
        startActivity(
            Intent(this, MenuActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        )
        finish()
    }

    private companion object {
        val TIPO_NEGRITA = android.graphics.Typeface.create("sans-serif-medium", 0)
        val TIPO_NORMAL = android.graphics.Typeface.create("sans-serif", 0)
    }
}