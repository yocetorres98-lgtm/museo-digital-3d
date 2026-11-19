 package com.museo.guia

import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * Cliente HTTP mínimo contra el backend PHP del museo.
 * Cada llamada es síncrona: ejecútala en un hilo aparte (Thread / Dispatchers.IO).
 */
object MuseoApi {

    /**
     * Direcciones del servidor PHP del museo, en orden de preferencia.
     *
     *  - 127.0.0.1:8080  -> teléfono conectado por USB con "adb reverse tcp:8080 tcp:80"
     *  - 192.168.1.219   -> PC en la red Wi-Fi local (si no hay aislamiento de clientes)
     *  - 192.168.137.1   -> punto de acceso móvil de Windows
     *  - 10.0.2.2        -> PC visto desde el emulador de Android
     *
     * La app prueba una por una hasta que alguna responda y recuerda la que
     * funcionó, así no hay que recompilar cuando cambia la red.
     */
    private val BASES = listOf(
        "http://127.0.0.1:8080/servidor",
        "http://192.168.1.219/servidor",
        "http://192.168.137.1/servidor",
        "http://10.0.2.2/servidor"
    )

    /** Última dirección que respondió (se usa primero en las siguientes llamadas). */
    @Volatile
    private var baseActiva: String? = null

    /** Dirección base actual; se conserva por compatibilidad con el resto de la app. */
    @Volatile
    var BASE = "http://192.168.1.219/servidor"

    const val OK = 0
    const val ERROR_RED = -1
    const val ERROR_DATOS = -2
    const val ERROR_CREDENCIALES = -3
    const val ERROR_YA_EXISTE = -4
    const val ERROR_SERVIDOR = -5

    data class Respuesta(val codigo: Int, val mensaje: String, val token: String = "")

    // ---------------- Registro ----------------

    fun registrar(nombre: String, correo: String, clave: String): Respuesta {
        val cuerpo = JSONObject()
            .put("nombre", nombre)
            .put("correo", correo)
            .put("password", clave)
        return enviar("registro.php", "POST", cuerpo)
    }

    // ---------------- Inicio de sesión ----------------

    fun iniciarSesion(correo: String, clave: String): Respuesta {
        val cuerpo = JSONObject()
            .put("correo", correo)
            .put("password", clave)
        return enviar("login.php", "POST", cuerpo)
    }

    // ---------------- Cerrar sesión (en el servidor) ----------------

    fun cerrarSesion(token: String): Respuesta {
        return enviar("cerrar_sesion.php", "POST", null, token)
    }

    // ---------------- Usuarios registrados (solo lectura) ----------------

    /** Una persona registrada en la base de datos del museo. */
    data class UsuarioRemoto(
        val id: Int,
        val nombre: String,
        val correo: String,
        val rol: String,
        val activo: Boolean,
        val fecha: String
    )

    /** Resultado de consultar la lista de usuarios. */
    data class ResumenUsuarios(
        val codigo: Int,
        val total: Int = 0,
        val usuarios: List<UsuarioRemoto> = emptyList(),
        val base: String = "",
        val mensaje: String = ""
    )

    /** Dirección del servidor que respondió por última vez ("" si ninguna). */
    val direccionActiva: String
        get() = baseActiva ?: ""

    /**
     * Lee la lista de personas registradas en MySQL.
     * Es una consulta de solo lectura: el servidor nunca modifica ni borra nada.
     */
    fun listarUsuarios(limite: Int = 200): ResumenUsuarios {
        val orden = mutableListOf<String>()
        baseActiva?.let { orden.add(it) }
        for (b in BASES) {
            if (b != baseActiva) orden.add(b)
        }

        for (base in orden) {
            val json = leerJson("$base/resumen.php?limite=$limite") ?: continue
            val lista = json.optJSONArray("usuarios")
            val usuarios = ArrayList<UsuarioRemoto>()
            if (lista != null) {
                for (i in 0 until lista.length()) {
                    val o = lista.optJSONObject(i) ?: continue
                    usuarios.add(
                        UsuarioRemoto(
                            id = o.optInt("id", 0),
                            nombre = o.optString("nombre", ""),
                            correo = o.optString("correo", ""),
                            rol = o.optString("rol", "usuario"),
                            activo = o.optInt("activo", 1) == 1,
                            fecha = o.optString("fecha_registro", "")
                        )
                    )
                }
            }
            baseActiva = base
            BASE = base
            return ResumenUsuarios(
                codigo = OK,
                total = json.optInt("total", usuarios.size),
                usuarios = usuarios,
                base = base
            )
        }

        baseActiva = null
        return ResumenUsuarios(
            ERROR_RED,
            mensaje = "No se pudo conectar con el servidor. Revisa la conexión."
        )
    }

    /** GET que devuelve el JSON del servidor, o null si esa dirección no responde. */
    private fun leerJson(urlTexto: String): JSONObject? {
        var conexion: HttpURLConnection? = null
        return try {
            conexion = URL(urlTexto).openConnection() as HttpURLConnection
            conexion.requestMethod = "GET"
            conexion.connectTimeout = 2500
            conexion.readTimeout = 8000
            if (conexion.responseCode !in 200..299) return null
            val texto = conexion.inputStream.use {
                BufferedReader(InputStreamReader(it, Charsets.UTF_8)).readText()
            }
            if (texto.isBlank()) null else JSONObject(texto)
        } catch (e: Exception) {
            null
        } finally {
            conexion?.disconnect()
        }
    }

    // ---------------- Utilidades internas ----------------

    private fun enviar(ruta: String, metodo: String, cuerpo: JSONObject?, token: String? = null): Respuesta {
        val orden = mutableListOf<String>()
        baseActiva?.let { orden.add(it) }
        for (b in BASES) {
            if (b != baseActiva) orden.add(b)
        }

        var ultima = Respuesta(ERROR_RED, "No se pudo conectar con el servidor. Revisa tu conexión.")
        for (base in orden) {
            val respuesta = intentar(base, ruta, metodo, cuerpo, token)
            if (respuesta.codigo != ERROR_RED) {
                baseActiva = base
                BASE = base
                return respuesta
            }
            ultima = respuesta
        }
        baseActiva = null
        return ultima
    }

    private fun intentar(
        base: String,
        ruta: String,
        metodo: String,
        cuerpo: JSONObject?,
        token: String?
    ): Respuesta {
        var conexion: HttpURLConnection? = null
        return try {
            val url = URL("$base/$ruta")
            conexion = url.openConnection() as HttpURLConnection
            conexion.requestMethod = metodo
            conexion.connectTimeout = 2500
            conexion.readTimeout = 8000
            conexion.setRequestProperty("Content-Type", "application/json; charset=utf-8")
            if (!token.isNullOrEmpty()) {
                conexion.setRequestProperty("Authorization", "Bearer $token")
            }

            if (cuerpo != null) {
                conexion.doOutput = true
                OutputStreamWriter(conexion.outputStream, Charsets.UTF_8).use { it.write(cuerpo.toString()) }
            }

            val codigo = conexion.responseCode
            val entrada = if (codigo in 200..299) conexion.inputStream else conexion.errorStream
            val texto = entrada?.let {
                BufferedReader(InputStreamReader(it, Charsets.UTF_8)).use(BufferedReader::readText)
            } ?: ""

            if (texto.isBlank()) {
                return if (codigo in 200..299) Respuesta(OK, "") else Respuesta(ERROR_SERVIDOR, "")
            }

            val json = JSONObject(texto)
            val mensaje = json.optString("error", json.optString("mensaje", ""))
            val tok = json.optString("token", "")

            when {
                codigo == 200 || codigo == 201 -> Respuesta(OK, mensaje, tok)
                codigo == 401 -> Respuesta(ERROR_CREDENCIALES, mensaje)
                codigo == 409 -> Respuesta(ERROR_YA_EXISTE, mensaje)
                codigo >= 500 -> Respuesta(ERROR_SERVIDOR, mensaje)
                else -> Respuesta(ERROR_DATOS, mensaje)
            }
        } catch (e: Exception) {
            Respuesta(ERROR_RED, "No se pudo conectar con el servidor. Revisa tu conexión.")
        } finally {
            conexion?.disconnect()
        }
    }
}
