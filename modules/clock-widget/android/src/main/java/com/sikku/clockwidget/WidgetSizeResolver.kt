package com.sikku.clockwidget

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.res.Configuration
import android.os.Build
import android.util.SizeF
import com.sikku.clockwidget.model.NativeCanvasConfig
import com.sikku.clockwidget.model.WidgetSize
import com.sikku.clockwidget.model.WidgetViewport
import kotlin.math.min
import kotlin.math.roundToInt

class WidgetSizeResolver(private val context: Context) {
  data class ResolvedSize(
    val dpSize: SizeF?,
    val pixelSize: WidgetSize,
  )

  fun resolve(appWidgetManager: AppWidgetManager, appWidgetId: Int): WidgetSize {
    val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
    return resolveOptions(options).first().pixelSize
  }

  fun resolveAll(
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
  ): List<ResolvedSize> =
    resolveOptions(appWidgetManager.getAppWidgetOptions(appWidgetId))

  @Suppress("DEPRECATION")
  private fun resolveOptions(options: android.os.Bundle): List<ResolvedSize> {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val exactSizes = options.getParcelableArrayList<SizeF>(
        AppWidgetManager.OPTION_APPWIDGET_SIZES,
      )
      if (!exactSizes.isNullOrEmpty()) {
        return exactSizes
          .distinct()
          .take(MAX_EXACT_SIZES)
          .map { size -> ResolvedSize(size, dpToPixels(size.width, size.height)) }
      }
    }

    val portrait =
      context.resources.configuration.orientation != Configuration.ORIENTATION_LANDSCAPE
    val widthKey = if (portrait) {
      AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH
    } else {
      AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH
    }
    val heightKey = if (portrait) {
      AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT
    } else {
      AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT
    }
    return listOf(
      ResolvedSize(
        dpSize = null,
        pixelSize = dpToPixels(
          options.getInt(widthKey, DEFAULT_SIZE_DP).toFloat(),
          options.getInt(heightKey, DEFAULT_SIZE_DP).toFloat(),
        ),
      ),
    )
  }

  private fun dpToPixels(widthDp: Float, heightDp: Float): WidgetSize {
    val density = context.resources.displayMetrics.density
    return WidgetSize(
      width = (widthDp.coerceAtLeast(1f) * density)
        .roundToInt()
        .coerceIn(1, MAX_DIMENSION),
      height = (heightDp.coerceAtLeast(1f) * density)
        .roundToInt()
        .coerceIn(1, MAX_DIMENSION),
    )
  }

  fun contain(canvas: NativeCanvasConfig, output: WidgetSize): WidgetViewport {
    val scale = min(output.width / canvas.width, output.height / canvas.height)
    val width = canvas.width * scale
    val height = canvas.height * scale
    return WidgetViewport(
      left = (output.width - width) / 2f,
      top = (output.height - height) / 2f,
      width = width,
      height = height,
    )
  }

  companion object {
    const val MAX_DIMENSION = 1024
    private const val MAX_EXACT_SIZES = 16
    private const val DEFAULT_SIZE_DP = 180
  }
}
