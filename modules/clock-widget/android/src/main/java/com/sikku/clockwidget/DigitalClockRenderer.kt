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
    if (digital.slotTransforms.isEmpty()) {
      drawLegacyDigits(canvas, config, viewport, digital, text)
    } else {
      drawPositionedDigits(canvas, config, viewport, digital, text)
    }
  }

  private fun drawPositionedDigits(
    canvas: Canvas,
    widget: NativeWidgetConfig,
    viewport: WidgetViewport,
    config: NativeDigitalConfig,
    text: String,
  ) {
    val hourLength = if (config.format == "h:mm") {
      text.length - 2 - if (config.colonVisible && config.separatorStyle != "none") 1 else 0
    } else {
      2
    }
    val hasSeparator = config.colonVisible && config.separatorStyle != "none"
    val slotIds = buildList {
      if (hourLength == 2) add("hour-tens")
      add("hour-ones")
      if (hasSeparator) add("colon")
      add("minute-tens")
      add("minute-ones")
    }
    val canvasScale = viewport.width / widget.canvas.width
    slotIds.zip(text.toList()).forEach { (slotId, character) ->
      val transform = config.slotTransforms[slotId] ?: return@forEach
      val width = transform.width * canvasScale
      val height = transform.height * canvasScale
      val checkpoint = canvas.save()
      canvas.translate(
        viewport.left + transform.x * canvasScale,
        viewport.top + transform.y * canvasScale,
      )
      canvas.rotate(transform.rotation)
      drawDigit(
        canvas,
        config,
        character,
        RectF(-width / 2f, -height / 2f, width / 2f, height / 2f),
        compact = slotId == "colon" && config.separatorStyle == "small-pipe",
      )
      canvas.restoreToCount(checkpoint)
    }
  }

  private fun drawLegacyDigits(
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
      val destination = RectF(
        left,
        -displayHeight / 2f,
        left + itemWidth,
        displayHeight / 2f,
      )
      drawDigit(
        canvas,
        config,
        character,
        destination,
        compact = character == '|' && config.separatorStyle == "small-pipe",
      )
      left += itemWidth + spacing
    }
    canvas.restoreToCount(checkpoint)
  }

  private fun drawDigit(
    canvas: Canvas,
    config: NativeDigitalConfig,
    character: Char,
    destination: RectF,
    compact: Boolean = false,
  ) {
    val key = if (character == ':') "colon" else character.toString()
    val bitmap = config.digitImagePaths[key]?.let {
      bitmapLoader.load(it, destination.width().toInt(), destination.height().toInt())
    }
    if (bitmap != null) {
      canvas.drawBitmap(bitmap, null, destination, IMAGE_PAINT)
    } else {
      drawFallback(canvas, character, destination, compact)
    }
  }

  private fun drawFallback(
    canvas: Canvas,
    character: Char,
    bounds: RectF,
    compact: Boolean,
  ) {
    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = Color.BLACK
      textAlign = Paint.Align.CENTER
      textSize = bounds.height() * if (compact) 0.44f else 0.78f
      typeface = android.graphics.Typeface.DEFAULT_BOLD
    }
    val baseline = bounds.centerY() - (paint.ascent() + paint.descent()) / 2f
    canvas.drawText(character.toString(), bounds.centerX(), baseline, paint)
  }

  companion object {
    private val IMAGE_PAINT = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
  }
}
