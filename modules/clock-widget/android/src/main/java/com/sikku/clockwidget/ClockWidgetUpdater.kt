package com.sikku.clockwidget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.net.Uri
import android.util.Log
import android.widget.RemoteViews
import com.sikku.clockwidget.model.NativeWidgetConfig
import com.sikku.clockwidget.model.WidgetSize
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock
import kotlin.math.min

class ClockWidgetUpdater(
  private val context: Context,
  private val repository: WidgetConfigRepository,
  private val parser: WidgetConfigParser,
  private val sizeResolver: WidgetSizeResolver,
  private val renderer: ClockWidgetRenderer,
) {
  fun update(appWidgetId: Int) {
    lockFor(appWidgetId).withLock {
      val manager = AppWidgetManager.getInstance(context)
      val size = sizeResolver.resolve(manager, appWidgetId)
      val stored = repository.get(appWidgetId)
      val parsedConfig = stored?.let {
        runCatching { parser.parse(it.configJson) }
          .onFailure { error ->
            Log.e(TAG, "Widget $appWidgetId config parsing failed", error)
          }
          .getOrNull()
      }
      val fallbackMessage = when {
        stored == null -> "앱에서 시계를 적용해 주세요"
        parsedConfig == null -> "시계를 불러오지 못했어요"
        else -> null
      }
      val views = createRemoteViewsForSize(
        size = size,
        config = parsedConfig,
        fallbackMessage = fallbackMessage,
        projectId = parsedConfig?.projectId ?: stored?.projectId,
        appWidgetId = appWidgetId,
      )
      manager.updateAppWidget(appWidgetId, views)
    }
  }

  fun updateAsync(appWidgetId: Int, onComplete: (() -> Unit)? = null) {
    EXECUTOR.execute {
      try {
        update(appWidgetId)
      } catch (error: Throwable) {
        Log.e(TAG, "Widget $appWidgetId update failed", error)
      } finally {
        onComplete?.invoke()
      }
    }
  }

  fun updateAll() {
    installedWidgetIds(context).forEach { appWidgetId ->
      runCatching { update(appWidgetId) }
        .onFailure { error ->
          Log.e(TAG, "Widget $appWidgetId update failed", error)
        }
    }
  }

  fun updateAllAsync(onComplete: (() -> Unit)? = null) {
    val ids = installedWidgetIds(context)
    if (ids.isEmpty()) {
      onComplete?.invoke()
      return
    }
    EXECUTOR.execute {
      try {
        updateAll()
      } finally {
        onComplete?.invoke()
      }
    }
  }

  private fun createRemoteViews(
    bitmap: Bitmap,
    projectId: String?,
    appWidgetId: Int,
  ): RemoteViews = RemoteViews(context.packageName, R.layout.clock_widget).apply {
    setImageViewBitmap(R.id.clock_widget_image, bitmap)
    setOnClickPendingIntent(
      R.id.clock_widget_image,
      createOpenAppIntent(projectId, appWidgetId),
    )
  }

  private fun createRemoteViewsForSize(
    size: WidgetSize,
    config: NativeWidgetConfig?,
    fallbackMessage: String?,
    projectId: String?,
    appWidgetId: Int,
  ): RemoteViews {
    val bitmap = if (config == null) {
      createFallback(size, fallbackMessage ?: "시계를 불러오지 못했어요")
    } else {
      runCatching { renderer.render(config, size) }
        .getOrElse { error ->
          Log.e(TAG, "Widget $appWidgetId rendering failed", error)
          createFallback(size, "시계를 불러오지 못했어요")
        }
    }
    return createRemoteViews(bitmap, projectId, appWidgetId)
  }

  private fun createOpenAppIntent(projectId: String?, appWidgetId: Int): PendingIntent {
    val route = projectId?.let { "sikku:///editor/$it" } ?: "sikku:///"
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(route)).apply {
      setPackage(context.packageName)
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    return PendingIntent.getActivity(
      context,
      appWidgetId,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun createFallback(size: WidgetSize, message: String): Bitmap {
    val bitmap = Bitmap.createBitmap(size.width, size.height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    canvas.drawColor(Color.rgb(255, 248, 242))
    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = Color.rgb(74, 53, 45)
      textAlign = Paint.Align.CENTER
      textSize = (min(size.width, size.height) * 0.08f).coerceAtLeast(18f)
    }
    val lines = fallbackLines(message)
    val lineHeight = paint.fontSpacing
    val firstBaseline = size.height / 2f -
      ((lines.size - 1) * lineHeight) / 2f -
      (paint.ascent() + paint.descent()) / 2f
    lines.forEachIndexed { index, line ->
      canvas.drawText(
        line,
        size.width / 2f,
        firstBaseline + index * lineHeight,
        paint,
      )
    }
    return bitmap
  }

  private fun fallbackLines(message: String): List<String> = when (message) {
    "앱에서 시계를 적용해 주세요" -> listOf("앱에서 시계를", "적용해 주세요")
    "시계를 불러오지 못했어요" -> listOf("시계를 불러오지", "못했어요")
    else -> listOf(message)
  }

  companion object {
    private const val TAG = "ClockWidgetUpdater"
    private val EXECUTOR = Executors.newSingleThreadExecutor()
    private val LOCKS = ConcurrentHashMap<Int, ReentrantLock>()

    fun installedWidgetIds(context: Context): IntArray =
      AppWidgetManager.getInstance(context).getAppWidgetIds(
        android.content.ComponentName(context, ClockWidgetProvider::class.java),
      )

    private fun lockFor(appWidgetId: Int) =
      LOCKS.getOrPut(appWidgetId) { ReentrantLock() }
  }
}
