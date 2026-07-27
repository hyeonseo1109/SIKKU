package com.sikku.clockwidget

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.graphics.PorterDuffXfermode
import android.graphics.Rect
import android.graphics.RectF
import com.sikku.clockwidget.model.NativeCanvasConfig
import com.sikku.clockwidget.model.NativeImageLayer
import com.sikku.clockwidget.model.WidgetSize
import com.sikku.clockwidget.model.WidgetViewport
import kotlin.math.roundToInt

class BitmapComposer(
  private val bitmapLoader: BitmapLoader,
) {
  fun createOutput(size: WidgetSize): Bitmap =
    Bitmap.createBitmap(size.width, size.height, Bitmap.Config.ARGB_8888)

  fun drawBackground(
    canvas: Canvas,
    config: NativeCanvasConfig,
    viewport: WidgetViewport,
  ) {
    val destination = canvasBounds(viewport)
    val cornerRadius = config.cornerRadius * viewport.width / config.width
    val color = WidgetColorParser.parse(config.backgroundColor)
    if (color != android.graphics.Color.TRANSPARENT) {
      val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = withOpacity(color, config.backgroundColorOpacity)
        if (config.shadow.enabled) {
          val shadowColor = WidgetColorParser.parse(config.shadow.color)
          val alpha = (config.shadow.opacity.coerceIn(0f, 1f) * 255f).roundToInt()
          setShadowLayer(
            config.shadow.blur * viewport.width / config.width,
            config.shadow.offsetX * viewport.width / config.width,
            config.shadow.offsetY * viewport.width / config.width,
            (shadowColor and 0x00FFFFFF) or (alpha shl 24),
          )
        }
      }
      canvas.drawRoundRect(destination, cornerRadius, cornerRadius, paint)
    } else if (config.shadow.enabled) {
      val scale = viewport.width / config.width
      val shadowColor = WidgetColorParser.parse(config.shadow.color)
      val alpha = (config.shadow.opacity.coerceIn(0f, 1f) * 255f).roundToInt()
      val shadowPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = android.graphics.Color.WHITE
        setShadowLayer(
          config.shadow.blur * scale,
          config.shadow.offsetX * scale,
          config.shadow.offsetY * scale,
          (shadowColor and 0x00FFFFFF) or (alpha shl 24),
        )
      }
      canvas.drawRoundRect(destination, cornerRadius, cornerRadius, shadowPaint)
      canvas.drawRoundRect(
        destination,
        cornerRadius,
        cornerRadius,
        Paint(Paint.ANTI_ALIAS_FLAG).apply {
          xfermode = PorterDuffXfermode(PorterDuff.Mode.CLEAR)
        },
      )
    }
    val path = config.backgroundImagePath
    if (path != null) {
      val bitmap = bitmapLoader.load(
        path,
        viewport.width.roundToInt(),
        viewport.height.roundToInt(),
      )
      if (bitmap != null) {
        val checkpoint = canvas.save()
        canvas.clipPath(canvasPath(config, viewport))
        val imagePaint = Paint(IMAGE_PAINT).apply {
          alpha = (config.backgroundImageOpacity.coerceIn(0f, 1f) * 255f).roundToInt()
        }
        canvas.drawBitmap(
          bitmap,
          centerCropSource(bitmap, destination),
          destination,
          imagePaint,
        )
        canvas.restoreToCount(checkpoint)
      }
    }
    if (config.appearance == "glass") {
      val glassPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = (2f * viewport.width / config.width).coerceAtLeast(1f)
        this.color = 0xC8FFFFFF.toInt()
      }
      canvas.drawRoundRect(destination, cornerRadius, cornerRadius, glassPaint)
      val highlight = RectF(
        destination.left + glassPaint.strokeWidth,
        destination.top + glassPaint.strokeWidth,
        destination.right - glassPaint.strokeWidth,
        destination.top + destination.height() * 0.38f,
      )
      canvas.drawRoundRect(
        highlight,
        cornerRadius,
        cornerRadius,
        Paint(Paint.ANTI_ALIAS_FLAG).apply {
          this.color = 0x38FFFFFF
        },
      )
    }
  }

  fun clipToCanvas(
    canvas: Canvas,
    config: NativeCanvasConfig,
    viewport: WidgetViewport,
  ): Int {
    val checkpoint = canvas.save()
    canvas.clipPath(canvasPath(config, viewport))
    return checkpoint
  }

  fun drawLayer(
    canvas: Canvas,
    layer: NativeImageLayer,
    sourceCanvas: NativeCanvasConfig,
    viewport: WidgetViewport,
    rotation: Float = layer.rotation,
    centerX: Float = layer.x,
    centerY: Float = layer.y,
  ) {
    val scale = viewport.width / sourceCanvas.width
    val targetWidth = layer.width * scale
    val targetHeight = layer.height * scale
    val bitmap = bitmapLoader.load(
      layer.imagePath,
      targetWidth.roundToInt(),
      targetHeight.roundToInt(),
    ) ?: return
    val pivotX = if (layer.type == "hour-hand" || layer.type == "minute-hand") {
      layer.anchorX
    } else {
      0.5f
    }
    val pivotY = if (layer.type == "hour-hand" || layer.type == "minute-hand") {
      layer.anchorY
    } else {
      0.5f
    }
    val x = viewport.left + centerX * scale
    val y = viewport.top + centerY * scale
    val destination = RectF(
      -pivotX * targetWidth,
      -pivotY * targetHeight,
      (1f - pivotX) * targetWidth,
      (1f - pivotY) * targetHeight,
    )
    val checkpoint = canvas.save()
    canvas.translate(x, y)
    canvas.rotate(rotation)
    val paint = Paint(IMAGE_PAINT).apply {
      alpha = (layer.opacity.coerceIn(0f, 1f) * 255f).roundToInt()
      layer.tintColor?.let { tint ->
        colorFilter = PorterDuffColorFilter(
          WidgetColorParser.parse(tint),
          PorterDuff.Mode.SRC_IN,
        )
      }
    }
    canvas.drawBitmap(bitmap, null, destination, paint)
    canvas.restoreToCount(checkpoint)
  }

  fun drawCenterCap(
    canvas: Canvas,
    centerX: Float,
    centerY: Float,
    sourceCanvas: NativeCanvasConfig,
    viewport: WidgetViewport,
    color: String,
  ) {
    val scale = viewport.width / sourceCanvas.width
    val x = viewport.left + centerX * scale
    val y = viewport.top + centerY * scale
    canvas.drawCircle(x, y, 6f * scale, Paint(Paint.ANTI_ALIAS_FLAG).apply {
      this.color = WidgetColorParser.parse(color)
    })
  }

  companion object {
    private val IMAGE_PAINT = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)

    internal fun centerCropSource(bitmap: Bitmap, destination: RectF): Rect {
      val sourceRatio = bitmap.width.toFloat() / bitmap.height
      val destinationRatio = destination.width() / destination.height()
      return if (sourceRatio > destinationRatio) {
        val cropWidth = (bitmap.height * destinationRatio).roundToInt()
        val left = (bitmap.width - cropWidth) / 2
        Rect(left, 0, left + cropWidth, bitmap.height)
      } else {
        val cropHeight = (bitmap.width / destinationRatio).roundToInt()
        val top = (bitmap.height - cropHeight) / 2
        Rect(0, top, bitmap.width, top + cropHeight)
      }
    }
  }

  private fun canvasBounds(viewport: WidgetViewport) = RectF(
    viewport.left,
    viewport.top,
    viewport.left + viewport.width,
    viewport.top + viewport.height,
  )

  private fun withOpacity(color: Int, opacity: Float): Int {
    val sourceAlpha = android.graphics.Color.alpha(color)
    val alpha = (sourceAlpha * opacity.coerceIn(0f, 1f)).roundToInt()
    return (color and 0x00FFFFFF) or (alpha shl 24)
  }

  private fun canvasPath(
    config: NativeCanvasConfig,
    viewport: WidgetViewport,
  ) = Path().apply {
    val cornerRadius = config.cornerRadius * viewport.width / config.width
    addRoundRect(
      canvasBounds(viewport),
      cornerRadius,
      cornerRadius,
      Path.Direction.CW,
    )
  }
}
