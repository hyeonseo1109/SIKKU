package com.sikku.clockwidget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.os.Bundle

class ClockWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    val pendingResult = goAsync()
    val updater = ClockWidgetDependencies.updater(context)
    if (appWidgetIds.isEmpty()) {
      pendingResult.finish()
    } else {
      var remaining = appWidgetIds.size
      appWidgetIds.forEach { id ->
        updater.updateAsync(id) {
          remaining -= 1
          if (remaining == 0) pendingResult.finish()
        }
      }
    }
    ClockWidgetDependencies.scheduler(context).scheduleNextMinute()
  }

  override fun onAppWidgetOptionsChanged(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
    newOptions: Bundle,
  ) {
    ClockWidgetDependencies.updater(context).updateAsync(appWidgetId)
  }

  override fun onDeleted(context: Context, appWidgetIds: IntArray) {
    val repository = ClockWidgetDependencies.repository(context)
    appWidgetIds.forEach(repository::remove)
    ClockWidgetDependencies.scheduler(context).scheduleNextMinute()
  }

  override fun onDisabled(context: Context) {
    ClockWidgetDependencies.scheduler(context).cancel()
  }
}
