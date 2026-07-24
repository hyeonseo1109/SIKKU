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
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
      alarmManager.canScheduleExactAlarms()
    ) {
      alarmManager.setExactAndAllowWhileIdle(
        AlarmManager.RTC_WAKEUP,
        nextMinute,
        pendingIntent(),
      )
    } else {
      alarmManager.setAndAllowWhileIdle(
        AlarmManager.RTC_WAKEUP,
        nextMinute,
        pendingIntent(),
      )
    }
  }

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
    private const val REQUEST_CODE = 9417
  }
}
