package com.sikku.clockwidget

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

class WidgetUpdateScheduler(private val context: Context) {
  fun scheduleNextMinute() {
    if (ClockWidgetUpdater.installedWidgetIds(context).isEmpty()) {
      cancel()
      return
    }
    val nextMinute = ClockMath.nextMinuteAfter(System.currentTimeMillis())
    val alarmManager = context.getSystemService(AlarmManager::class.java)
    if (canScheduleExactUpdates(alarmManager)) {
      // A non-wakeup exact alarm keeps the visible widget minute-accurate without
      // waking a sleeping device. An overdue alarm is delivered when it wakes.
      alarmManager.setExact(AlarmManager.RTC, nextMinute, pendingIntent())
    } else {
      alarmManager.setWindow(
        AlarmManager.RTC,
        nextMinute,
        FALLBACK_WINDOW_MILLIS,
        pendingIntent(),
      )
    }
  }

  fun canScheduleExactUpdates(): Boolean =
    canScheduleExactUpdates(context.getSystemService(AlarmManager::class.java))

  fun cancel() {
    context.getSystemService(AlarmManager::class.java).cancel(pendingIntent())
  }

  private fun pendingIntent(): PendingIntent =
    PendingIntent.getBroadcast(
      context,
      REQUEST_CODE,
      Intent(context, ClockWidgetTimeReceiver::class.java),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

  companion object {
    private const val FALLBACK_WINDOW_MILLIS = 60_000L
    private const val REQUEST_CODE = 9417

    private fun canScheduleExactUpdates(alarmManager: AlarmManager): Boolean =
      Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
        alarmManager.canScheduleExactAlarms()
  }
}
