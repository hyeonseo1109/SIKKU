package com.sikku.clockwidget

import android.graphics.Canvas
import com.sikku.clockwidget.model.NativeWidgetConfig
import com.sikku.clockwidget.model.WidgetViewport
import java.util.Calendar

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
    if (analog.showCenterCap) {
      composer.drawCenterCap(canvas, analog.centerX, analog.centerY, config.canvas, viewport)
    }
  }
}
