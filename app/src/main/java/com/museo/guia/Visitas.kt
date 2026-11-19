package com.museo.guia

import android.content.Context
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Registra cuántas personas han ingresado al museo y guarda una bitácora
 * con el nombre del visitante y la fecha/hora de cada ingreso.
 * Se usa desde MainActivity (al comenzar el recorrido) y se consulta
 * desde el panel del administrador.
 */
class Visitas(context: Context) {

    private val prefs = context.getSharedPreferences("museo_visitas", Context.MODE_PRIVATE)

    private val formato = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())

    /** Total histórico de ingresos al museo. */
    val total: Int
        get() = prefs.getInt("total", 0)

    /** Ingresos del día de hoy. */
    val hoy: Int
        get() {
            val prefijo = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault()).format(Date())
            return entradas.count { it.contains("· $prefijo") }
        }

    /** Lista de ingresos, del más reciente al más antiguo. */
    val entradas: List<String>
        get() = (prefs.getString("log", "") ?: "")
            .split("\n")
            .filter { it.isNotBlank() }
            .reversed()

    /** Suma un ingreso y lo anota en la bitácora. */
    fun registrar(nombre: String) {
        val quien = if (nombre.isBlank()) "Invitado" else nombre.trim()
        val linea = "$quien · ${formato.format(Date())}"
        val lista = ArrayList(entradas.reversed())
        lista.add(linea)
        // conserva las últimas 300 entradas para no crecer sin control
        while (lista.size > 300) lista.removeAt(0)
        prefs.edit()
            .putInt("total", total + 1)
            .putString("log", lista.joinToString("\n"))
            .apply()
    }

    /** Borra el contador y la bitácora. */
    fun reiniciar() {
        prefs.edit().clear().apply()
    }
}