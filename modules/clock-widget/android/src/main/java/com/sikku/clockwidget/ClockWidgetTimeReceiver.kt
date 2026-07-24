package com.sikku.clockwidget

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class ClockWidgetTimeReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val pendingResult = goAsync()
    ClockWidgetDependencies.updater(context).updateAllAsync {
      ClockWidgetDependencies.scheduler(context).scheduleNextMinute()
      pendingResult.finish()
    }
  }
}
