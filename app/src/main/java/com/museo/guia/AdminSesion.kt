package com.museo.guia

import android.content.Context
import android.content.SharedPreferences
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Locale

/**
 * Cuenta y sesión del administrador del museo.
 *
 * Se guarda en sus propias preferencias para no mezclarse con la sesión del
 * visitante ([Sesion]). La contraseña nunca se almacena en texto plano: se
 * guarda un hash SHA-256 con una sal aleatoria distinta para cada cuenta.
 */
class AdminSesion(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("museo_admin_cuenta", Context.MODE_PRIVATE)

    private companion object {
        const val NOMBRE = "nombre"
        const val CORREO = "correo"
        const val HASH = "hash"
        const val SAL = "sal"
        const val ALTA = "alta"
        const val ABIERTA = "sesion_abierta"
    }

    /** Ya existe una cuenta de administrador en este dispositivo. */
    val registrado: Boolean
        get() = (prefs.getString(HASH, "") ?: "").isNotEmpty()

    /** Hay una cuenta creada y la sesión está abierta. */
    val sesionActiva: Boolean
        get() = registrado && prefs.getBoolean(ABIERTA, false)

    val nombre: String get() = prefs.getString(NOMBRE, "") ?: ""

    val correo: String get() = prefs.getString(CORREO, "") ?: ""

    /** Fecha de creación de la cuenta (milisegundos). */
    val desde: Long get() = prefs.getLong(ALTA, 0L)

    /** Crea la cuenta del administrador y abre la sesión. */
    fun registrar(nombre: String, correo: String, clave: String) {
        val sal = nuevaSal()
        prefs.edit()
            .putString(NOMBRE, nombre.trim())
            .putString(CORREO, correo.trim().lowercase(Locale.ROOT))
            .putString(SAL, sal)
            .putString(HASH, hash(sal, clave))
            .putLong(ALTA, System.currentTimeMillis())
            .putBoolean(ABIERTA, true)
            .apply()
    }

    /** Comprueba el correo y la contraseña de la cuenta guardada. */
    fun validar(correo: String, clave: String): Boolean {
        if (!registrado) return false
        val guardado = prefs.getString(CORREO, "") ?: ""
        val sal = prefs.getString(SAL, "") ?: ""
        val esperado = prefs.getString(HASH, "") ?: ""
        val mismoCorreo = guardado.equals(correo.trim(), ignoreCase = true)
        return mismoCorreo && esperado == hash(sal, clave)
    }

    fun abrirSesion() {
        if (registrado) prefs.edit().putBoolean(ABIERTA, true).apply()
    }

    fun cerrarSesion() {
        prefs.edit().putBoolean(ABIERTA, false).apply()
    }

    /**
     * Elimina por completo la cuenta de administrador de este dispositivo.
     *
     * Solo borra el nombre, el correo y la contraseña; las estadísticas de
     * visitas ([Visitas]) se conservan. Así otra persona puede crear una
     * cuenta nueva desde cero.
     */
    fun borrar() {
        prefs.edit().clear().apply()
    }

    private fun nuevaSal(): String {
        val bytes = ByteArray(16)
        SecureRandom().nextBytes(bytes)
        return bytes.aHex()
    }

    private fun hash(sal: String, clave: String): String =
        MessageDigest.getInstance("SHA-256")
            .digest((sal + ":" + clave).toByteArray(Charsets.UTF_8))
            .aHex()

    private fun ByteArray.aHex(): String =
        joinToString("") { "%02x".format(it) }
}
