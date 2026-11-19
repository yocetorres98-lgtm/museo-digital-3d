package com.museo.guia

import android.app.AlertDialog
import android.app.Dialog
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.os.Bundle
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import kotlin.math.ceil
import kotlin.math.hypot

/**
 * Mapa interactivo de la región: muestra mapa_region.jpg con un marcador por
 * municipio. Los marcadores se arrastran para ponerlos en su lugar y quedan
 * guardados. Tocar un marcador abre la ficha con "ENTRAR A ESTA SALA".
 */
class MapaActivity : AppCompatActivity() {

    private lateinit var contenedor: LinearLayout
    private lateinit var textoAvance: TextView
    private lateinit var mapaZona: FrameLayout
    private lateinit var progreso: TourProgress
    private lateinit var pinPrefs: SharedPreferences

    private val pines = ArrayList<TextView>()
    private var pinArrastrado = -1
    private var tocadoX = 0f
    private var tocadoY = 0f
    private var arrastrado = false
    private val slop = 24f

    private val salas
        get() = SALAS_MAPA

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Seguridad temporalmente desactivada para debug: se quita requerimiento de sesión
        // if (!Sesion(this).haySesion) {
        //     startActivity(
        //         Intent(this, RegistroActivity::class.java)
        //             .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        //     )
        //     finish()
        //     return
        // }

        setContentView(R.layout.activity_mapa)
        pantallaCompleta()

        // Reduce carga de memoria del mapa (downsampling)
        try {
            val mapaImg = findViewById<ImageView>(R.id.mapaRegion)
            val opciones = android.graphics.BitmapFactory.Options().apply {
                inJustDecodeBounds = true
            }
            android.graphics.BitmapFactory.decodeResource(resources, R.drawable.mapa_region, opciones)
            val anchoMax = 1024
            var muestra = 1
            while (opciones.outWidth / muestra > anchoMax) {
                muestra *= 2
            }
            val opciones2 = android.graphics.BitmapFactory.Options().apply {
                inSampleSize = muestra
                inPreferredConfig = android.graphics.Bitmap.Config.RGB_565
            }
            val bmp = android.graphics.BitmapFactory.decodeResource(
                resources,
                R.drawable.mapa_region,
                opciones2
            )
            mapaImg.setImageBitmap(bmp)
        } catch (_: Exception) {
        }

        progreso = TourProgress(this)
        pinPrefs = getSharedPreferences("museo_mapa", Context.MODE_PRIVATE)
        contenedor = findViewById(R.id.contenedorSalas)
        textoAvance = findViewById(R.id.textoAvanceMapa)
        mapaZona = findViewById(R.id.mapaZona)

        construirTarjetas()
        crearPines()
        configurarArrastre()
        actualizarAvance()

        // coloca los pines cuando ya se conoce el tamaño del mapa
        mapaZona.post { reposicionarPines() }
        mapaZona.viewTreeObserver.addOnGlobalLayoutListener {
            reposicionarPines()
            if (pinArrastrado < 0) pintarPines()
        }
    }

    override fun onResume() {
        super.onResume()
        actualizarAvance()
        marcarTarjetas()
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

    // ============================================================
    // Pines sobre el mapa
    // ============================================================

    private fun posicionInicial(indice: Int): IntArray {
        // Posiciones aproximadas sobre la geografía real (x%, y%).
        // El usuario puede arrastrarlas y quedan guardadas.
        val mapa = arrayOf(
            intArrayOf(45, 7),   // chalco
            intArrayOf(33, 14),  // tlalmanalco
            intArrayOf(61, 16),  // amecameca
            intArrayOf(24, 30),  // cocotitla
            intArrayOf(70, 28),  // ayapango
            intArrayOf(40, 44),  // tepetlixpa
            intArrayOf(16, 40),  // tenango del aire
            intArrayOf(75, 48),  // atlautla
            intArrayOf(52, 60),  // ozumba
            intArrayOf(31, 61),  // temamatla
            intArrayOf(66, 40),  // san miguel nepantla
            intArrayOf(54, 80)   // ecatzingo
        )
        return pinPrefs.let {
            val px = it.getInt("pin_x$indice", mapa[indice][0])
            val py = it.getInt("pin_y$indice", mapa[indice][1])
            intArrayOf(px, py)
        }
    }

    private fun crearPines() {
        val tam = (34 * resources.displayMetrics.density).toInt()
        for (i in salas.indices) {
            val pin = TextView(this).apply {
                text = "${i + 1}"
                textSize = 11f
                isClickable = false
                isFocusable = false
                gravity = android.view.Gravity.CENTER
                setTextColor(getColor(R.color.verde_profundo))
                typeface = android.graphics.Typeface.DEFAULT_BOLD
                layoutParams = FrameLayout.LayoutParams(tam, tam)
            }
            pines.add(pin)
            mapaZona.addView(pin)
        }
    }

    /** Pinta cada pin con su color según haya salas completadas. */
    private fun pintarPines() {
        for (i in salas.indices) {
            val hecho = progreso.obrasDe(salas[i].id) >= 3
            pines[i].setBackgroundResource(
                if (hecho) R.drawable.mapa_pin_done else R.drawable.mapa_pin
            )
        }
    }

    /** Coloca cada pin en su coordenada de porcentaje sobre el mapa. */
    private fun reposicionarPines() {
        val ancho = mapaZona.width
        val alto = mapaZona.height
        if (ancho <= 0 || alto <= 0) return
        val padIzq = mapaZona.paddingLeft
        val padSup = mapaZona.paddingTop
        val innerW = ancho - padIzq - mapaZona.paddingRight
        val innerH = alto - padSup - mapaZona.paddingBottom
        if (innerW <= 0 || innerH <= 0) return

        val tam = pines[0].width
        for (i in salas.indices) {
            val pos = posicionInicial(i)
            val x = padIzq + innerW * pos[0] / 100f - tam / 2f
            val y = padSup + innerH * pos[1] / 100f - tam / 2f
            val lp = pines[i].layoutParams as FrameLayout.LayoutParams
            lp.leftMargin = x.toInt().coerceIn(0, ancho - tam)
            lp.topMargin = y.toInt().coerceIn(0, alto - tam)
            pines[i].layoutParams = lp
        }
    }

    private fun configurarArrastre() {
        mapaZona.setOnTouchListener { _, ev ->
            val ax = ev.x
            val ay = ev.y
            when (ev.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    pinArrastrado = pinBajoElDedo(ax, ay)
                    arrastrado = false
                    tocadoX = ax
                    tocadoY = ay
                    if (pinArrastrado >= 0) {
                        mapaZona.parent.requestDisallowInterceptTouchEvent(true)
                    }
                    true
                }
                MotionEvent.ACTION_MOVE -> if (pinArrastrado >= 0) {
                    val dx = ax - tocadoX
                    val dy = ay - tocadoY
                    if (!arrastrado && hypot(dx, dy) > slop) arrastrado = true
                    if (arrastrado) moverPin(pinArrastrado, dx, dy)
                    tocadoX = ax
                    tocadoY = ay
                    true
                } else false
                MotionEvent.ACTION_UP -> {
                    val idx = pinArrastrado
                    pinArrastrado = -1
                    mapaZona.parent.requestDisallowInterceptTouchEvent(false)
                    if (idx >= 0 && !arrastrado) {
                        mostrarFicha(idx)
                    } else if (idx >= 0) {
                        guardarPines()
                    }
                    arrastrado = false
                    true
                }
                else -> false
            }
        }
    }

    private fun pinBajoElDedo(x: Float, y: Float): Int {
        val tam = pines[0].width / 2f + slop
        for (i in salas.indices) {
            val pin = pines[i]
            val cx = pin.x + pin.width / 2f
            val cy = pin.y + pin.height / 2f
            if (hypot(cx - x, cy - y) <= tam) return i
        }
        return -1
    }

    private fun moverPin(indice: Int, dx: Float, dy: Float) {
        val pin = pines[indice]
        val ancho = mapaZona.width
        val alto = mapaZona.height
        val lp = pin.layoutParams as FrameLayout.LayoutParams
        val nx = (lp.leftMargin + dx).toInt().coerceIn(0, ancho - pin.width)
        val ny = (lp.topMargin + dy).toInt().coerceIn(0, alto - pin.height)
        lp.leftMargin = nx
        lp.topMargin = ny
        pin.layoutParams = lp
    }

    private fun guardarPines() {
        val ancho = mapaZona.width
        val alto = mapaZona.height
        if (ancho <= 0 || alto <= 0) return
        val padIzq = mapaZona.paddingLeft
        val padSup = mapaZona.paddingTop
        val innerW = ancho - padIzq - mapaZona.paddingRight
        val innerH = alto - padSup - mapaZona.paddingBottom
        if (innerW <= 0 || innerH <= 0) return

        val ed = pinPrefs.edit()
        for (i in salas.indices) {
            val pin = pines[i]
            val x = ((pin.x + pin.width / 2f - padIzq) / innerW * 100).toInt().coerceIn(0, 100)
            val y = ((pin.y + pin.height / 2f - padSup) / innerH * 100).toInt().coerceIn(0, 100)
            ed.putInt("pin_x$i", x)
            ed.putInt("pin_y$i", y)
        }
        ed.apply()
    }

    // ============================================================
    // Tarjetas de la ruta
    // ============================================================

    private fun construirTarjetas() {
        contenedor.removeAllViews()
        val filas = ceil(salas.size / 2.0).toInt()
        for (f in 0 until filas) {
            val fila = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
            }
            for (c in 0..1) {
                val i = f * 2 + c
                fila.addView(
                    if (i >= salas.size) marcoVacio() else inflarTarjeta(i)
                )
            }
            contenedor.addView(fila)
        }
    }

    private fun marcoVacio(): View = View(this).apply {
        layoutParams = LinearLayout.LayoutParams(0, 1, 1f)
    }

    private fun inflarTarjeta(indice: Int): View {
        val vista = LayoutInflater.from(this).inflate(R.layout.item_sala_mapa, contenedor, false)
        val sala = salas[indice]

        vista.findViewById<ImageView>(R.id.fotoSala).setImageResource(sala.foto)
        vista.findViewById<TextView>(R.id.nombreSala).text = sala.emoji + "  " + sala.nombre

        val vistas = progreso.obrasDe(sala.id)
        vista.findViewById<ProgressBar>(R.id.barraSala).progress = vistas
        vista.findViewById<TextView>(R.id.textoSala).text = "$vistas/3"
        if (vistas >= 3) vista.isSelected = true

        vista.setOnClickListener { mostrarFicha(indice) }
        return vista
    }

    private fun marcarTarjetas() {
        for (f in 0 until contenedor.childCount) {
            val fila = contenedor.getChildAt(f) as LinearLayout
            for (i in 0 until fila.childCount) {
                val pos = f * 2 + i
                if (pos >= salas.size) continue
                val vista = fila.getChildAt(pos)
                val vistas = progreso.obrasDe(salas[pos].id)
                vista.isSelected = vistas >= 3
                vista.findViewById<ProgressBar>(R.id.barraSala)?.progress = vistas
                vista.findViewById<TextView>(R.id.textoSala)?.text = "$vistas/3"
            }
        }
        actualizarAvance()
        pintarPines()
    }

    private fun actualizarAvance() {
        val total = progreso.salasCompletadas
        val obras = salas.sumOf { progreso.obrasDe(it.id) }
        textoAvance.text = getString(R.string.mapa_avance, total, salas.size, obras, salas.size * 3)
    }

    // ============================================================
    // Ficha de la sala
    // ============================================================

    private fun mostrarFicha(indice: Int) {
        val sala = salas[indice]
        val vistas = progreso.obrasDe(sala.id)

        val caja = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            val pad = (20 * resources.displayMetrics.density).toInt()
            setPadding(pad, pad, pad, 0)
        }

        val foto = ImageView(this).apply {
            setImageResource(sala.fotos.first())
            scaleType = ImageView.ScaleType.CENTER_CROP
            contentDescription = sala.nombre
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                (170 * resources.displayMetrics.density).toInt()
            )
        }
        caja.addView(foto)

        val franja = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        val ladoMini = (54 * resources.displayMetrics.density).toInt()
        val separacion = (6 * resources.displayMetrics.density).toInt()
        val miniaturas = mutableListOf<ImageView>()
        var fotoActual = 0

        fun mostrarFoto(pos: Int) {
            fotoActual = pos
            foto.setImageResource(sala.fotos[pos])
            miniaturas.forEachIndexed { i, mini -> mini.alpha = if (i == pos) 1f else 0.55f }
        }

        sala.fotos.forEachIndexed { pos, recurso ->
            val mini = ImageView(this).apply {
                setImageResource(recurso)
                scaleType = ImageView.ScaleType.CENTER_CROP
                contentDescription = getString(
                    R.string.mapa_foto_n, sala.nombre, pos + 1, sala.fotos.size
                )
                layoutParams = LinearLayout.LayoutParams(ladoMini, ladoMini).apply {
                    marginEnd = separacion
                }
                setOnClickListener { mostrarFoto(pos) }
            }
            miniaturas.add(mini)
            franja.addView(mini)
        }

        val tira = HorizontalScrollView(this).apply {
            isHorizontalScrollBarEnabled = false
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = (10 * resources.displayMetrics.density).toInt() }
            addView(franja)
        }
        caja.addView(tira)
        mostrarFoto(0)

        foto.setOnClickListener { mostrarFotoCompleta(sala, fotoActual) }

        val titulo = TextView(this).apply {
            text = sala.emoji + "  " + sala.nombre
            textSize = 18f
            setTextColor(getColor(R.color.crema))
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setPadding(0, (12 * resources.displayMetrics.density).toInt(), 0, 0)
        }
        caja.addView(titulo)

        val estado = TextView(this).apply {
            text = "Obras vistas: $vistas de 3  ·  " +
                if (vistas >= 3) "Sala completa" else if (vistas > 0) "En curso" else "Sin visitar"
            textSize = 12f
            setTextColor(getColor(R.color.dorado))
            setPadding(0, (4 * resources.displayMetrics.density).toInt(), 0, 0)
        }
        caja.addView(estado)

        val cuerpo = TextView(this).apply {
            text = sala.historia
            textSize = 14f
            setTextColor(getColor(R.color.crema))
            setPadding(0, (12 * resources.displayMetrics.density).toInt(), 0, 0)
        }
        caja.addView(cuerpo)

        AlertDialog.Builder(this)
            .setView(caja)
            .setPositiveButton(R.string.mapa_entrar) { _, _ -> entrarASala(indice) }
            .setNegativeButton(R.string.mapa_cerrar, null)
            .show()
    }

    /** Abre la foto de la sala a pantalla completa; tocar cierra el visor. */
    private fun mostrarFotoCompleta(sala: SalaMapa, posicion: Int) {
        val visor = ImageView(this).apply {
            setImageResource(sala.fotos[posicion])
            scaleType = ImageView.ScaleType.FIT_CENTER
            contentDescription = sala.nombre
            setBackgroundColor(0xFF000000.toInt())
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }

        val dialogo = Dialog(this, android.R.style.Theme_Black_NoTitleBar_Fullscreen)
        visor.setOnClickListener { dialogo.dismiss() }
        dialogo.setContentView(visor)
        dialogo.show()
        dialogo.window?.setLayout(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT
        )
    }

    // ============================================================
    // Navegación
    // ============================================================

    @Suppress("UNUSED_PARAMETER")
    fun onCerrarMapa(view: View) {
        finish()
    }

    @Suppress("UNUSED_PARAMETER")
    fun onIniciarRecorrido(view: View) {
        val destino = salas.indexOfFirst { progreso.obrasDe(it.id) < 3 }
        entrarASala(if (destino < 0) 0 else destino)
    }

    private fun entrarASala(indice: Int) {
        startActivity(
            Intent(this, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                .putExtra(MainActivity.EXTRA_SALA, indice)
        )
        finish()
    }

    private companion object {
        val SALAS_MAPA = listOf(
            SalaMapa("amecameca", "Amecameca", "🌋", listOf(
                R.drawable.sala_amecameca_1, R.drawable.sala_amecameca_2, R.drawable.sala_amecameca_3),
                "Amecameca nació entre la niebla de los volcanes y fue, desde tiempos prehispánicos, un alto santuario donde se veneraba a Quetzalcóatl. Por sus calles pasaron arrieros, peregrinos y alpinistas camino del Popocatépetl y del Iztaccíhuatl."),
            SalaMapa("chalco", "Chalco", "🏰", listOf(
                R.drawable.sala_chalco_1, R.drawable.sala_chalco_2, R.drawable.sala_chalco_3),
                "Capital del señorío acolhua, Chalco controló las chinampas y el comercio del lago mucho antes de la llegada de los españoles. En la Colonia fue corredor del Camino Real a Veracruz y escenario de desecaciones, epidemias y nuevas devociones."),
            SalaMapa("ozumba", "Ozumba", "🍐", listOf(
                R.drawable.sala_ozumba_1, R.drawable.sala_ozumba_2, R.drawable.sala_ozumba_3),
                "Ozumba creció sobre un asentamiento mexica y tomó su nombre del ozote, el árbol que sombrea sus huertas. Su convento y su mercado hicieron del valle un cruce de caminos entre la tierra fría y las barrancas del sur."),
            SalaMapa("tlalmanalco", "Tlalmanalco", "⛲", listOf(
                R.drawable.sala_tlalmanalco_1, R.drawable.sala_tlalmanalco_2, R.drawable.sala_tlalmanalco_3),
                "Tlalmanalco, «lugar llano», fue señorío de peso antes de la conquista y después sede de uno de los primeros conventos franciscanos de América. Sus muros guardan frescos, capillas abiertas y el silencio de los primeros evangelizadores."),
            SalaMapa("ayapango", "Ayapango", "🐄", listOf(
                R.drawable.sala_ayapango_1, R.drawable.sala_ayapango_2, R.drawable.sala_ayapango_3),
                "Ayapango, «lugar en la orilla del agua», nació como pueblo de paso y de labranza a los pies de la sierra. Sus casonas de adobe y sus portales cuentan siglos de arriería, comercio y fiesta."),
            SalaMapa("tepetlixpa", "Tepetlixpa", "🌽", listOf(
                R.drawable.sala_tepetlixpa_1, R.drawable.sala_tepetlixpa_2, R.drawable.sala_tepetlixpa_3),
                "Tepetlixpa toma su nombre del tepetate, la piedra dura que sostiene caminos y casas. Fue tierra de paso entre la cuenca y Morelos, y aún conserva el trazo de sus antiguos barrios."),
            SalaMapa("cocotitla", "Cocotitla", "🕊️", listOf(
                R.drawable.sala_cocotitla_1, R.drawable.sala_cocotitla_2, R.drawable.sala_cocotitla_3),
                "«Lugar de tórtolas»: un pueblo pequeño de origen prehispánico que creció ligado al señorío de Chalco. Su caserío se acomodó entre la cañada y el agua, en un rincón que todavía huele a bosque."),
            SalaMapa("atlautla", "Atlautla", "🍎", listOf(
                R.drawable.sala_atlautla_1, R.drawable.sala_atlautla_2, R.drawable.sala_atlautla_3),
                "Atlautla, «lugar bajo el agua», se asienta en las faldas orientales del Iztaccíhuatl, donde el deshielo alimenta barrancas y manantiales. Fue tierra de paso y de milpa antes de ser municipio."),
            SalaMapa("tenango-del-aire", "Tenango del Aire", "🪁", listOf(
                R.drawable.sala_tenango_1, R.drawable.sala_tenango_2, R.drawable.sala_tenango_3),
                "Tenango del Aire nació como punto de paso y abasto entre los valles de México y Morelos. El viento que baja de la sierra le dio nombre y también fama de tierra de cometas y cielos abiertos."),
            SalaMapa("temamatla", "Temamatla", "🪨", listOf(
                R.drawable.sala_temamatla_1, R.drawable.sala_temamatla_2, R.drawable.sala_temamatla_3),
                "«Entre piedras»: el nombre resume el paisaje de Temamatla, antiguo poblado agrícola del señorío de Chalco. Sus caminos de piedra y sus cerros bajos guardan la memoria de una vida hecha de temporal."),
            SalaMapa("nepantla", "San Miguel Nepantla", "🪶", listOf(
                R.drawable.sala_nepantla_1, R.drawable.sala_nepantla_2, R.drawable.sala_nepantla_3),
                "San Miguel Nepantla, «en medio», es célebre por ser la cuna de Sor Juana Inés de la Cruz. Hacia 1648, la hacienda y el pueblo formaban un paisaje de milpas y aguas donde la niña aprendió a leer."),
            SalaMapa("ecatzingo", "Ecatzingo de Hidalgo", "🌴", listOf(
                R.drawable.sala_ecatzingo_1, R.drawable.sala_ecatzingo_2, R.drawable.sala_ecatzingo_3),
                "Ecatzingo, «lugar del viento sobre el agua», se levantó entre cerros y barrancas en el límite con Morelos. Su nombre evoca el viento que corre sobre los manantiales y las presas antiguas.")
        )
    }
}

data class SalaMapa(
    val id: String,
    val nombre: String,
    val emoji: String,
    val fotos: List<Int>,
    val historia: String
) {
    /** Primera foto: se usa como portada en la tarjeta del mapa. */
    val foto: Int get() = fotos.first()
}