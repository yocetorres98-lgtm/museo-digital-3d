package com.museo.guia

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject

/**
 * Guarda la sesión del visitante (cuenta creada o acceso como invitado).
 * Usa sus propias preferencias para que reiniciar el recorrido
 * (TourProgress) no borre al usuario.
 */
class Sesion(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("museo_sesion", Context.MODE_PRIVATE)

    private companion object {
        const val MODO = "modo"          // "registrado" | "invitado"
        const val NOMBRE = "nombre"
        const val CORREO = "correo"
        const val CLAVE = "clave"
        const val ALTA = "alta"
        const val TOKEN = "token"
        const val MODO_REGISTRADO = "registrado"
        const val MODO_INVITADO = "invitado"
    }

    /** "" si todavía no ha entrado nadie. */
    private val modo: String get() = prefs.getString(MODO, "") ?: ""

    /** Hay una cuenta creada con correo y contraseña. */
    val registrado: Boolean get() = modo == MODO_REGISTRADO

    /** Entró sin crear cuenta. */
    val invitado: Boolean get() = modo == MODO_INVITADO

    /** Ya hay alguien dentro: cuenta o invitado. */
    val haySesion: Boolean get() = modo.isNotEmpty()

    val nombre: String get() = prefs.getString(NOMBRE, "") ?: "Invitado"

    val correo: String get() = prefs.getString(CORREO, "") ?: ""

    val desde: Long get() = prefs.getLong(ALTA, 0L)

    /** Crea la cuenta y abre sesión. */
    fun registrar(nombre: String, correo: String, clave: String) {
        prefs.edit()
            .putString(MODO, MODO_REGISTRADO)
            .putString(NOMBRE, nombre)
            .putString(CORREO, correo)
            .putString(CLAVE, clave)
            .putLong(ALTA, System.currentTimeMillis())
            .apply()
    }

    /** Guarda el token de sesión devuelto por el servidor. */
    fun guardarToken(token: String) {
        prefs.edit().putString(TOKEN, token).apply()
    }

    /** Token de sesión del servidor ("", si no hay). */
    val token: String get() = prefs.getString(TOKEN, "") ?: ""

    /** Entra sin cuenta. */
    fun entrarComoInvitado() {
        if (invitado) return
        prefs.edit()
            .putString(MODO, MODO_INVITADO)
            .putString(NOMBRE, "Invitado")
            .putString(CORREO, "")
            .remove(CLAVE)
            .putLong(ALTA, System.currentTimeMillis())
            .apply()
    }

    fun cerrarSesion() {
        prefs.edit().clear().apply()
    }

    /** Comprueba las credenciales de la cuenta guardada. */
    fun validar(correo: String, clave: String): Boolean {
        if (!registrado) return false
        val guardado = prefs.getString(CORREO, "") ?: ""
        val guardada = prefs.getString(CLAVE, "") ?: ""
        return guardado.equals(correo.trim(), ignoreCase = true) && guardada == clave
    }

    /** ¿Ya existe una cuenta con ese correo? */
    fun existeCorreo(correo: String): Boolean {
        if (!registrado) return false
        val guardado = prefs.getString(CORREO, "") ?: ""
        return guardado.equals(correo.trim(), ignoreCase = true)
    }

    /** Perfil resumido en JSON, por si el WebView lo necesita. */
    fun aJson(): String = JSONObject().apply {
        put("nombre", nombre)
        put("correo", correo)
        put("registrado", registrado)
        put("invitado", invitado)
    }.toString()
}