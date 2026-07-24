package com.sikku.clockwidget

import java.util.Calendar
import kotlin.math.atan2
import kotlin.math.hypot

object ClockMath {
  private const val MINUTE_MS = 60_000L

  fun hourAngle(calendar: Calendar): Float =
    calendar.get(Calendar.HOUR) * 30f + calendar.get(Calendar.MINUTE) * 0.5f

  fun minuteAngle(calendar: Calendar): Float =
    calendar.get(Calendar.MINUTE) * 6f

  fun handOrientationOffset(
    anchorX: Float,
    anchorY: Float,
    tipX: Float?,
    tipY: Float?,
  ): Float {
    val dx = (tipX ?: 0.5f) - anchorX
    val dy = (tipY ?: 0f) - anchorY
    if (hypot(dx, dy) < 0.001f) return 0f
    return -90f - Math.toDegrees(atan2(dy, dx).toDouble()).toFloat()
  }

  fun nextMinuteAfter(epochMillis: Long): Long =
    ((epochMillis / MINUTE_MS) + 1L) * MINUTE_MS
}
