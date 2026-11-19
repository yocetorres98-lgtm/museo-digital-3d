package com.museo.guia

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import kotlin.math.hypot
import kotlin.math.min

/**
 * Joystick virtual para caminar dentro del museo.
 * notifica a la escena 3D mediante GameInput.
 */
class JoystickView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null
) : View(context, attrs) {

    interface Listener {
        fun onMover(x: Float, y: Float)
        fun onSoltar()
    }

    var listener: Listener? = null

    private var centroX = 0f
    private var centroY = 0f
    private var radio = 0f
    private var dedoX = 0f
    private var dedoY = 0f
    private var activo = false
    private var idActivo = MotionEvent.INVALID_POINTER_ID

    private val paintBase = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = Color.parseColor("#22FFFFFF")
    }
    private val paintBorde = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 6f
        color = Color.parseColor("#66E2B04A")
    }
    private val paintPalanca = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = Color.parseColor("#CCB06A3B")
    }
    private val paintPalancaBorde = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 4f
        color = Color.parseColor("#FFE2B04A")
    }
    private val paintEtiqueta = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#88F5EAD6")
        textAlign = Paint.Align.CENTER
        typeface = Typeface.DEFAULT_BOLD
    }

    override fun onSizeChanged(w: Int, h: Int, oldW: Int, oldH: Int) {
        super.onSizeChanged(w, h, oldW, oldH)
        centroX = w / 2f
        centroY = h / 2f
        radio = min(w, h) / 2f - 12f
        paintEtiqueta.textSize = radio * 0.22f
    }

    override fun onDraw(canvas: Canvas) {
        canvas.drawCircle(centroX, centroY, radio, paintBase)
        canvas.drawCircle(centroX, centroY, radio, paintBorde)

        val dx = if (activo) dedoX - centroX else 0f
        val dy = if (activo) dedoY - centroY else 0f
        canvas.drawCircle(centroX + dx, centroY + dy, radio * 0.36f, paintPalanca)
        canvas.drawCircle(centroX + dx, centroY + dy, radio * 0.36f, paintPalancaBorde)

        if (!activo) {
            canvas.drawText("MOVER", centroX, centroY + radio * 0.72f, paintEtiqueta)
        }
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN, MotionEvent.ACTION_POINTER_DOWN -> {
                val i = event.actionIndex
                if (!activo) {
                    idActivo = event.getPointerId(i)
                    activo = true
                    dedoX = event.getX(i)
                    dedoY = event.getY(i)
                    calcular()
                    invalidate()
                    return true
                }
            }

            MotionEvent.ACTION_MOVE -> {
                if (activo) {
                    val i = event.findPointerIndex(idActivo)
                    if (i >= 0) {
                        dedoX = event.getX(i)
                        dedoY = event.getY(i)
                        calcular()
                        invalidate()
                    }
                    return true
                }
            }

            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL, MotionEvent.ACTION_POINTER_UP -> {
                if (activo && (event.actionMasked == MotionEvent.ACTION_UP ||
                        event.actionMasked == MotionEvent.ACTION_CANCEL ||
                        event.getPointerId(event.actionIndex) == idActivo)
                ) {
                    activo = false
                    idActivo = MotionEvent.INVALID_POINTER_ID
                    listener?.onSoltar()
                    invalidate()
                    performClick()
                    return true
                }
            }
        }
        return super.onTouchEvent(event)
    }

    override fun performClick(): Boolean {
        super.performClick()
        return true
    }

    private fun calcular() {
        var dx = dedoX - centroX
        var dy = dedoY - centroY
        val dist = hypot(dx, dy)
        val max = radio * 0.62f
        if (dist > max) {
            dx = dx / dist * max
            dy = dy / dist * max
        }
        // el juego espera x = derecha, y = adelante (arriba)
        listener?.onMover(dx / max, -dy / max)
    }
}