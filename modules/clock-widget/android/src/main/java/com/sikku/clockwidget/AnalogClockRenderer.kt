package com.sikku.clockwidget

import android.graphics.Canvas
import android.graphics.Paint
import com.sikku.clockwidget.model.NativeWidgetConfig
import com.sikku.clockwidget.model.WidgetViewport
import java.util.Calendar
import kotlin.math.cos
import kotlin.math.sin

class AnalogClockRenderer(
  private val composer: BitmapComposer,
) {
  fun render(
    canvas: Canvas,
    config: NativeWidgetConfig,
    viewport: WidgetViewport,
    calendar: Calendar,
  ) {
    val analog = requireNotNull(config.analog)
    val hourAngle = ClockMath.hourAngle(calendar)
    val minuteAngle = ClockMath.minuteAngle(calendar)
    config.layers.forEach { layer ->
      val timeRotation = when (layer.type) {
        "hour-hand" -> hourAngle
        "minute-hand" -> minuteAngle
        else -> 0f
      }
      val isHand = layer.type == "hour-hand" || layer.type == "minute-hand"
      composer.drawLayer(
        canvas = canvas,
        layer = layer,
        sourceCanvas = config.canvas,
        viewport = viewport,
        rotation = layer.rotation + timeRotation + if (isHand) {
          ClockMath.handOrientationOffset(
            layer.anchorX,
            layer.anchorY,
            layer.tipX,
            layer.tipY,
          )
        } else {
          0f
        },
        centerX = if (isHand) analog.centerX else layer.x,
        centerY = if (isHand) analog.centerY else layer.y,
      )
    }
    if (config.layers.none { it.type == "hour-hand" }) {
      drawDefaultHand(
        canvas,
        config,
        viewport,
        hourAngle,
        analog.hourHandColor,
        analog.hourHandOpacity,
        lengthRatio = 0.22f,
        widthRatio = 0.022f,
      )
    }
    if (config.layers.none { it.type == "minute-hand" }) {
      drawDefaultHand(
        canvas,
        config,
        viewport,
        minuteAngle,
        analog.minuteHandColor,
        analog.minuteHandOpacity,
        lengthRatio = 0.32f,
        widthRatio = 0.016f,
      )
    }
    if (analog.showCenterCap) {
      composer.drawCenterCap(
        canvas,
        analog.centerX,
        analog.centerY,
        config.canvas,
        viewport,
        analog.centerCapColor,
      )
    }
  }

  private fun drawDefaultHand(
    canvas: Canvas,
    config: NativeWidgetConfig,
    viewport: WidgetViewport,
    angle: Float,
    color: String,
    opacity: Float,
    lengthRatio: Float,
    widthRatio: Float,
  ) {
    val analog = requireNotNull(config.analog)
    val scale = viewport.width / config.canvas.width
    val centerX = viewport.left + analog.centerX * scale
    val centerY = viewport.top + analog.centerY * scale
    val length = config.canvas.height * lengthRatio * scale
    val radians = Math.toRadians(angle.toDouble())
    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      this.color = WidgetColorParser.parse(color)
      alpha = (opacity.coerceIn(0f, 1f) * 255f).toInt()
      strokeCap = Paint.Cap.ROUND
      strokeWidth = (config.canvas.width * widthRatio * scale).coerceAtLeast(2f)
    }
    canvas.drawLine(
      centerX,
      centerY,
      centerX + sin(radians).toFloat() * length,
      centerY - cos(radians).toFloat() * length,
      paint,
    )
  }
}
