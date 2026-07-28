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
        if (config.appearance == "glass") {
          canvas.drawBitmap(
            blurForGlass(bitmap, centerCropSource(bitmap, destination), destination),
            null,
            destination,
            imagePaint,
          )
        } else {
          canvas.drawBitmap(
            bitmap,
            centerCropSource(bitmap, destination),
            destination,
            imagePaint,
          )
        }
        canvas.restoreToCount(checkpoint)
      }
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

  private fun blurForGlass(bitmap: Bitmap, source: Rect, destination: RectF): Bitmap {
    val width = (destination.width() / GLASS_DOWNSCALE).roundToInt().coerceAtLeast(1)
    val height = (destination.height() / GLASS_DOWNSCALE).roundToInt().coerceAtLeast(1)
    val reduced = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    Canvas(reduced).drawBitmap(
      bitmap,
      source,
      RectF(0f, 0f, width.toFloat(), height.toFloat()),
      IMAGE_PAINT,
    )
    val pixels = IntArray(width * height)
    reduced.getPixels(pixels, 0, width, 0, 0, width, height)
    val horizontal = boxBlur(pixels, width, height, GLASS_BLUR_RADIUS, true)
    val vertical = boxBlur(horizontal, width, height, GLASS_BLUR_RADIUS, false)
    reduced.setPixels(vertical, 0, width, 0, 0, width, height)
    return reduced
  }

  private fun boxBlur(
    input: IntArray,
    width: Int,
    height: Int,
    radius: Int,
    horizontal: Boolean,
  ): IntArray {
    val output = IntArray(input.size)
    for (y in 0 until height) {
      for (x in 0 until width) {
        var alpha = 0
        var red = 0
        var green = 0
        var blue = 0
        var count = 0
        for (offset in -radius..radius) {
          val sampleX = if (horizontal) (x + offset).coerceIn(0, width - 1) else x
          val sampleY = if (horizontal) y else (y + offset).coerceIn(0, height - 1)
          val color = input[sampleY * width + sampleX]
          alpha += android.graphics.Color.alpha(color)
          red += android.graphics.Color.red(color)
          green += android.graphics.Color.green(color)
          blue += android.graphics.Color.blue(color)
          count += 1
        }
        output[y * width + x] = android.graphics.Color.argb(
          alpha / count,
          red / count,
          green / count,
          blue / count,
        )
      }
    }
    return output
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

  companion object {
    private const val GLASS_DOWNSCALE = 6f
    private const val GLASS_BLUR_RADIUS = 4
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
}
