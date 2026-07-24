package com.sikku.clockwidget

import android.graphics.Bitmap
import android.graphics.Canvas
import com.sikku.clockwidget.model.NativeWidgetConfig
import com.sikku.clockwidget.model.WidgetSize
import java.util.Calendar

class ClockWidgetRenderer(
  private val sizeResolver: WidgetSizeResolver,
  private val composer: BitmapComposer,
  private val analogRenderer: AnalogClockRenderer,
  private val digitalRenderer: DigitalClockRenderer,
) {
  fun render(
    config: NativeWidgetConfig,
    size: WidgetSize,
    calendar: Calendar = Calendar.getInstance(),
  ): Bitmap {
    val output = composer.createOutput(size)
    val canvas = Canvas(output)
    val viewport = sizeResolver.contain(config.canvas, size)
    composer.drawBackground(canvas, config.canvas, viewport)
    when (config.clockType) {
      "analog" -> analogRenderer.render(canvas, config, viewport, calendar)
      "digital" -> digitalRenderer.render(canvas, config, viewport, calendar)
      else -> error("지원하지 않는 시계 유형입니다.")
    }
    return output
  }
}
