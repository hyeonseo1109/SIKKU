package com.sikku.clockwidget

import java.util.Calendar
import java.util.TimeZone
import org.junit.Assert.assertEquals
import org.junit.Test

class ClockMathTest {
  @Test
  fun anglesIncludeMinuteProgress() {
    val calendar = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
      set(2026, Calendar.JULY, 24, 3, 30, 0)
    }

    assertEquals(105f, ClockMath.hourAngle(calendar), 0.001f)
    assertEquals(180f, ClockMath.minuteAngle(calendar), 0.001f)
  }

  @Test
  fun horizontalHandIsRotatedToTwelveOClock() {
    assertEquals(
      -90f,
      ClockMath.handOrientationOffset(0f, 0.5f, 1f, 0.5f),
      0.001f,
    )
  }

  @Test
  fun nextMinuteAlwaysMovesForward() {
    assertEquals(120_000L, ClockMath.nextMinuteAfter(60_000L))
    assertEquals(120_000L, ClockMath.nextMinuteAfter(119_999L))
  }
}
