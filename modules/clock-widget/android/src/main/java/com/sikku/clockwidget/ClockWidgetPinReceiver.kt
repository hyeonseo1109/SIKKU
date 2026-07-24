package com.sikku.clockwidget

import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class ClockWidgetPinReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val appWidgetId = intent.getIntExtra(
      AppWidgetManager.EXTRA_APPWIDGET_ID,
      AppWidgetManager.INVALID_APPWIDGET_ID,
    )
    val token = intent.getStringExtra(EXTRA_CONFIG_TOKEN)
    if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID || token == null) {
      Log.w(TAG, "Pin callback did not include widget id or config token")
      return
    }
    val repository = ClockWidgetDependencies.repository(context)
    val configJson = repository.consumePending(token) ?: return
    runCatching { repository.save(appWidgetId, configJson) }
      .onSuccess {
        ClockWidgetDependencies.updater(context).updateAsync(appWidgetId)
        ClockWidgetDependencies.scheduler(context).scheduleNextMinute()
      }
      .onFailure { Log.e(TAG, "Failed to bind pinned widget", it) }
  }

  companion object {
    const val EXTRA_CONFIG_TOKEN = "clock_widget_config_token"
    private const val TAG = "ClockWidgetPin"
  }
}
