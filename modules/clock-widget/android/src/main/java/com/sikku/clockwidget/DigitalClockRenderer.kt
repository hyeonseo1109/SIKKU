package com.sikku.clockwidget

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import com.sikku.clockwidget.model.NativeDigitalConfig
import com.sikku.clockwidget.model.NativeWidgetConfig
import com.sikku.clockwidget.model.WidgetViewport
import java.util.Calendar
import kotlin.math.max

class DigitalClockRenderer(
  private val composer: BitmapComposer,
  private val bitmapLoader: BitmapLoader,
) {
  fun render(
    canvas: Canvas,
    config: NativeWidgetConfig,
    viewport: WidgetViewport,
    calendar: Calendar,
  ) {
    config.layers.forEach {
      composer.drawLayer(canvas, it, config.canvas, viewport)
    }
    val digital = requireNotNull(config.digital)
    val text = DigitalTimeFormatter.format(digital, calendar)
    drawDigits(canvas, config, viewport, digital, text)
  }

  private fun drawDigits(
    canvas: Canvas,
    widget: NativeWidgetConfig,
    viewport: WidgetViewport,
    config: NativeDigitalConfig,
    text: String,
  ) {
    val canvasScale = viewport.width / widget.canvas.width
    val transform = config.transform
    val displayWidth = transform.width * canvasScale
    val displayHeight = transform.height * canvasScale
    val spacing = config.digitSpacing * canvasScale
    val itemWidth = max(1f, (displayWidth - spacing * (text.length - 1)) / text.length)
    val originX = viewport.left + transform.x * canvasScale
    val originY = viewport.top + transform.y * canvasScale
    val checkpoint = canvas.save()
    canvas.translate(originX, originY)
    canvas.rotate(transform.rotation)
    var left = -displayWidth / 2f
    text.forEach { character ->
      val key = if (character == ':') "colon" else character.toString()
      val destination = RectF(
        left,
        -displayHeight / 2f,
        left + itemWidth,
        displayHeight / 2f,
      )
      val bitmap = config.digitImagePaths[key]?.let {
        bitmapLoader.load(it, itemWidth.toInt(), displayHeight.toInt())
      }
      if (bitmap != null) {
        canvas.drawBitmap(bitmap, null, destination, IMAGE_PAINT)
      } else {
        drawFallback(canvas, character, destination)
      }
      left += itemWidth + spacing
    }
    canvas.restoreToCount(checkpoint)
  }

  private fun drawFallback(canvas: Canvas, character: Char, bounds: RectF) {
    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = Color.BLACK
      textAlign = Paint.Align.CENTER
      textSize = bounds.height() * 0.78f
      typeface = android.graphics.Typeface.DEFAULT_BOLD
    }
    val baseline = bounds.centerY() - (paint.ascent() + paint.descent()) / 2f
    canvas.drawText(character.toString(), bounds.centerX(), baseline, paint)
  }

  companion object {
    private val IMAGE_PAINT = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
  }
}
