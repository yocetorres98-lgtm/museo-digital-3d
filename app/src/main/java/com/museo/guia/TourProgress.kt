package com.museo.guia

import android.content.Context

/**
 * Guarda el avance del recorrido (salas visitadas) y los logros del juego.
 */
class TourProgress(context: Context) {    private val prefs = context.getSharedPreferences("museo_guia", Context.MODE_PRIVATE)

    val salasCompletadas: Int
        get() = prefs.getInt("salas", 0)

    val mejorProgreso: Int
        get() = prefs.getInt("mejor_salas", 0)

    /** Guarda el avance y conserva la mejor marca del jugador. */
    fun registrarAvance(completadas: Int) {
        val mejor = if (completadas > mejorProgreso) completadas else mejorProgreso
        prefs.edit()
            .putInt("salas", completadas)
            .putInt("mejor_salas", mejor)
            .apply()
    }

    fun registrarObra(municipioId: String, indice: Int) {
        prefs.edit().putBoolean("obra_" + municipioId + "_" + indice, true).apply()
    }

    fun obrasDe(municipioId: String): Int {
        var total = 0
        for (i in 0..2) {
            if (prefs.getBoolean("obra_" + municipioId + "_" + i, false)) {
                total = total + 1
            }
        }
        return total
    }

    fun guardarLogro(nombre: String) {
        prefs.edit().putBoolean("logro_" + nombre, true).apply()
    }

    /** Logros del juego de guía. */
    fun logros(): List<String> {
        val lista = ArrayList<String>()
        if (obrasDe("chalco") >= 3) {
            lista.add("Descubriste el Mapa de Chalco de 1651")
        }
        if (obrasDe("nepantla") >= 1) {
            lista.add("Llegaste donde nació la Décima Musa")
        }
        if (mejorProgreso >= 6) {
            lista.add("Medio recorrido: seis salas")
        }
        if (mejorProgreso >= 13) {
            lista.add("Guion completo: las 13 salas")
        }
        return lista
    }

    fun reiniciar() {
        prefs.edit().clear().apply()
    }
}