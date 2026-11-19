package com.museo.guia

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

/**
 * Menú principal de la app. Punto de entrada desde el ícono del launcher.
 * Ofrece los apartados: iniciar sesión (visitante), administrador,
 * mapa interactivo, recorrido 3D y cerrar sesión.
 */
class MenuActivity : AppCompatActivity() {

    private lateinit var sesion: Sesion
    private lateinit var textoMenuSesion: TextView
    private lateinit var menuCerrarSesion: View

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        sesion = Sesion(this)
        setContentView(R.layout.activity_menu)
        pantallaCompleta()

        textoMenuSesion = findViewById(R.id.textoMenuSesion)
        menuCerrarSesion = findViewById(R.id.menuCerrarSesion)
    }

    override fun onResume() {
        super.onResume()
        actualizarSesion()
    }

    private fun actualizarSesion() {
        if (sesion.haySesion) {
            textoMenuSesion.text = getString(R.string.menu_chip_sesion, sesion.nombre)
            menuCerrarSesion.visibility = View.VISIBLE
        } else {
            textoMenuSesion.text = getString(R.string.menu_chip_sin)
            menuCerrarSesion.visibility = View.GONE
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

    // ---------------- Acciones del menú ----------------

    @Suppress("UNUSED_PARAMETER")
    fun onLogin(view: View) {
        startActivity(Intent(this, RegistroActivity::class.java))
    }

    @Suppress("UNUSED_PARAMETER")
    fun onAdmin(view: View) {
        startActivity(Intent(this, AdminActivity::class.java))
    }

    @Suppress("UNUSED_PARAMETER")
    fun onMapa(view: View) {
        abrirProtegido(MapaActivity::class.java)
    }

    @Suppress("UNUSED_PARAMETER")
    fun onRecorrido(view: View) {
        abrirProtegido(MainActivity::class.java)
    }

    /**
     * Seguridad: si no hay sesión activa no se permite entrar al museo.
     * Tras cerrar sesión hay que volver a identificarse para acceder.
     */
    private fun abrirProtegido(destino: Class<*>) {
        if (!sesion.haySesion) {
            Toast.makeText(this, R.string.menu_requiere_sesion, Toast.LENGTH_LONG).show()
            startActivity(Intent(this, RegistroActivity::class.java))
            return
        }
        startActivity(Intent(this, destino))
    }

    @Suppress("UNUSED_PARAMETER")
    fun onCerrarSesion(view: View) {
        if (!sesion.haySesion) return
        AlertDialog.Builder(this)
            .setTitle(R.string.cerrar_sesion)
            .setMessage(R.string.menu_cerrar_confirm)
            .setPositiveButton(R.string.cerrar_sesion) { _, _ ->
                sesion.cerrarSesion()
                Toast.makeText(this, R.string.menu_sesion_cerrada, Toast.LENGTH_SHORT).show()
                actualizarSesion()
            }
            .setNegativeButton(android.R.string.cancel, null)
            .show()
    }
}