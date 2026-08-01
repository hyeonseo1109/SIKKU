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
      scheduleExact(alarmManager, nextMinute)
    } else {
      scheduleBestEffort(alarmManager, nextMinute)
    }
  }

  fun canScheduleExactUpdates(): Boolean =
    canScheduleExactUpdates(context.getSystemService(AlarmManager::class.java))

  fun cancel() {
    context.getSystemService(AlarmManager::class.java).cancel(pendingIntent())
  }

  private fun scheduleExact(alarmManager: AlarmManager, triggerAtMillis: Long) {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        alarmManager.setExactAndAllowWhileIdle(
          AlarmManager.RTC_WAKEUP,
          triggerAtMillis,
          pendingIntent(),
        )
      } else {
        alarmManager.setExact(
          AlarmManager.RTC_WAKEUP,
          triggerAtMillis,
          pendingIntent(),
        )
      }
    } catch (_: SecurityException) {
      scheduleBestEffort(alarmManager, triggerAtMillis)
    }
  }

  private fun scheduleBestEffort(alarmManager: AlarmManager, triggerAtMillis: Long) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      alarmManager.setAndAllowWhileIdle(
        AlarmManager.RTC_WAKEUP,
        triggerAtMillis,
        pendingIntent(),
      )
    } else {
      alarmManager.set(
        AlarmManager.RTC_WAKEUP,
        triggerAtMillis,
        pendingIntent(),
      )
    }
  }

  private fun pendingIntent(): PendingIntent =
    PendingIntent.getBroadcast(
      context,
      REQUEST_CODE,
      Intent(context, ClockWidgetTimeReceiver::class.java),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

  companion object {
    private const val REQUEST_CODE = 9417

    private fun canScheduleExactUpdates(alarmManager: AlarmManager): Boolean =
      Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
        alarmManager.canScheduleExactAlarms()
  }
}
