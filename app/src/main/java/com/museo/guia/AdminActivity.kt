package com.museo.guia

import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

/**
 * Acceso y panel del administrador del museo.
 * La primera vez pide CREAR la cuenta con nombre, correo y contraseña;
 * a partir de ahí solo hay que iniciar sesión con el correo y la contraseña.
 * Las credenciales se guardan con hash y sal en las preferencias del
 * dispositivo (ver [AdminSesion]).
 */
class AdminActivity : AppCompatActivity() {

    private lateinit var visitas: Visitas
    private lateinit var admin: AdminSesion

    private lateinit var loginAdmin: View
    private lateinit var panelAdmin: View
    private lateinit var etiquetaNombre: TextView
    private lateinit var campoNombre: EditText
    private lateinit var campoCorreo: EditText
    private lateinit var campoClave: EditText
    private lateinit var campoRepetir: EditText
    private lateinit var etiquetaRepetir: TextView
    private lateinit var textoSubtitulo: TextView
    private lateinit var botonPrincipal: TextView
    private lateinit var aviso: TextView
    private lateinit var adminCuenta: TextView
    private lateinit var adminTotal: TextView
    private lateinit var adminHoy: TextView
    private lateinit var adminLista: TextView
    private lateinit var adminUsuariosEstado: TextView
    private lateinit var adminUsuariosLista: TextView

    private var modoRegistro = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_admin)
        pantallaCompleta()

        visitas = Visitas(this)
        admin = AdminSesion(this)

        loginAdmin = findViewById(R.id.loginAdmin)
        panelAdmin = findViewById(R.id.panelAdmin)
        etiquetaNombre = findViewById(R.id.etiquetaAdminNombre)
        campoNombre = findViewById(R.id.campoAdminNombre)
        campoCorreo = findViewById(R.id.campoAdminCorreo)
        campoClave = findViewById(R.id.campoAdminClave)
        campoRepetir = findViewById(R.id.campoAdminRepetir)
        etiquetaRepetir = findViewById(R.id.etiquetaAdminRepetir)
        textoSubtitulo = findViewById(R.id.textoAdminSubtitulo)
        botonPrincipal = findViewById(R.id.botonAdminPrincipal)
        aviso = findViewById(R.id.avisoAdmin)
        adminCuenta = findViewById(R.id.adminCuenta)
        adminTotal = findViewById(R.id.adminTotal)
        adminHoy = findViewById(R.id.adminHoy)
        adminLista = findViewById(R.id.adminLista)
        adminUsuariosEstado = findViewById(R.id.adminUsuariosEstado)
        adminUsuariosLista = findViewById(R.id.adminUsuariosLista)

        campoClave.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                onEntrarAdmin(campoClave)
                true
            } else {
                false
            }
        }

        if (admin.sesionActiva) {
            mostrarPanel()
        } else {
            // primera vez: no existe cuenta -> modo registro
            modoRegistro = !admin.registrado
            campoCorreo.setText(admin.correo)
            aplicarModoLogin()
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

    // ---------------- Sesión de administrador ----------------

    private fun aplicarModoLogin() {
        val visibilidad = if (modoRegistro) View.VISIBLE else View.GONE
        etiquetaNombre.visibility = visibilidad
        campoNombre.visibility = visibilidad
        etiquetaRepetir.visibility = visibilidad
        campoRepetir.visibility = visibilidad
        textoSubtitulo.setText(if (modoRegistro) R.string.admin_registrar_subtitulo else R.string.admin_subtitulo)
        botonPrincipal.setText(if (modoRegistro) R.string.admin_crear else R.string.admin_entrar)
    }

    @Suppress("UNUSED_PARAMETER")
    fun onEntrarAdmin(view: View) {
        val nombre = campoNombre.text.toString().trim()
        val correo = campoCorreo.text.toString().trim()
        val clave = campoClave.text.toString()

        if (modoRegistro) {
            // ---------- Crear cuenta de administrador ----------
            val repetir = campoRepetir.text.toString()
            if (nombre.length < 3) return mostrarAviso(R.string.admin_err_nombre)
            if (!RE_CORREO.matches(correo)) return mostrarAviso(R.string.admin_err_correo)
            if (clave.length != 8) return mostrarAviso(R.string.admin_err_clave)
            if (clave != repetir) return mostrarAviso(R.string.admin_err_repetir)

            admin.registrar(nombre, correo, clave)
            campoNombre.setText("")
            campoClave.setText("")
            campoRepetir.setText("")
            aviso.visibility = View.GONE
            mostrarPanel()
        } else {
            // ---------- Iniciar sesión ----------
            if (admin.validar(correo, clave)) {
                admin.abrirSesion()
                campoClave.setText("")
                aviso.visibility = View.GONE
                mostrarPanel()
            } else {
                mostrarAviso(R.string.admin_error)
            }
        }
    }

    @Suppress("UNUSED_PARAMETER")
    fun onSalirAdmin(view: View) {
        admin.cerrarSesion()
        campoNombre.setText("")
        campoCorreo.setText(admin.correo)
        campoClave.setText("")
        campoRepetir.setText("")
        modoRegistro = false
        aplicarModoLogin()
        mostrarLogin()
    }

    @Suppress("UNUSED_PARAMETER")
    fun onVolver(view: View) {
        finish()
    }

    @Suppress("UNUSED_PARAMETER")
    fun onBorrarCuenta(view: View) {
        AlertDialog.Builder(this)
            .setTitle(R.string.admin_borrar_titulo)
            .setMessage(R.string.admin_borrar_confirm)
            .setPositiveButton(R.string.admin_borrar) { _, _ ->
                admin.borrar()
                campoNombre.setText("")
                campoCorreo.setText("")
                campoClave.setText("")
                campoRepetir.setText("")
                modoRegistro = true
                aplicarModoLogin()
                mostrarLogin()
            }
            .setNegativeButton(android.R.string.cancel, null)
            .show()
    }

    private fun mostrarLogin() {
        aviso.visibility = View.GONE
        panelAdmin.visibility = View.GONE
        loginAdmin.visibility = View.VISIBLE
    }

    private fun mostrarAviso(msg: Int) {
        aviso.setText(msg)
        aviso.visibility = View.VISIBLE
    }

    private fun mostrarPanel() {
        loginAdmin.visibility = View.GONE
        panelAdmin.visibility = View.VISIBLE
        cargarDatos()
    }

    // ---------------- Datos de visitas ----------------

    private fun cargarDatos() {
        adminCuenta.text = if (admin.correo.isBlank()) {
            admin.nombre
        } else {
            "${admin.nombre} · ${admin.correo}"
        }
        adminTotal.text = visitas.total.toString()
        adminHoy.text = getString(R.string.admin_hoy, visitas.hoy)

        val entradas = visitas.entradas
        adminLista.text = if (entradas.isEmpty()) {
            getString(R.string.admin_sin_registros)
        } else {
            entradas.joinToString("\n")
        }

        cargarUsuariosBaseDatos()
    }

    /**
     * Consulta las personas registradas en MySQL.
     * Es solo lectura: nunca modifica ni borra registros.
     */
    private fun cargarUsuariosBaseDatos() {
        adminUsuariosEstado.setText(R.string.admin_usuarios_cargando)
        adminUsuariosLista.setText(R.string.admin_usuarios_cargando)

        Thread {
            val r = MuseoApi.listarUsuarios()
            runOnUiThread {
                if (isFinishing || isDestroyed) return@runOnUiThread
                if (r.codigo == MuseoApi.OK) {
                    adminUsuariosEstado.text =
                        getString(R.string.admin_usuarios_conteo, r.total, r.base)
                    adminUsuariosLista.text = if (r.usuarios.isEmpty()) {
                        getString(R.string.admin_usuarios_vacio)
                    } else {
                        r.usuarios.joinToString("\n\n") { u ->
                            val tipo = if (u.rol == "admin") "  ·  Admin" else ""
                            "${u.nombre}\n${u.correo}\n${u.fecha}$tipo"
                        }
                    }
                } else {
                    adminUsuariosEstado.setText(R.string.admin_usuarios_offline)
                    adminUsuariosLista.text = "—"
                }
            }
        }.start()
    }

    @Suppress("UNUSED_PARAMETER")
    fun onReiniciarContador(view: View) {
        AlertDialog.Builder(this)
            .setTitle(R.string.admin_reiniciar)
            .setMessage(R.string.admin_reiniciar_confirm)
            .setPositiveButton(android.R.string.ok) { _, _ ->
                visitas.reiniciar()
                cargarDatos()
            }
            .setNegativeButton(android.R.string.cancel, null)
            .show()
    }

    private companion object {
        /** Comprobación sencilla del formato del correo. */
        val RE_CORREO = Regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")
    }
}
