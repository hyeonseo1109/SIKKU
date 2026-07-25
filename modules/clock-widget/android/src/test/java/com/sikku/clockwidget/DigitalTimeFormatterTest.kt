package com.sikku.clockwidget

import com.sikku.clockwidget.model.NativeDigitalConfig
import com.sikku.clockwidget.model.NativeDigitalTransform
import java.util.Calendar
import java.util.TimeZone
import org.junit.Assert.assertEquals
import org.junit.Test

class DigitalTimeFormatterTest {
  @Test
  fun formatsTwentyFourHourClock() {
    assertEquals("03:07", DigitalTimeFormatter.format(config("HH:mm"), at(3, 7)))
  }

  @Test
  fun formatsTwelveHourMidnightWithoutColon() {
    assertEquals(
      "1207",
      DigitalTimeFormatter.format(config("h:mm", colonVisible = false), at(0, 7)),
    )
  }

  @Test
  fun formatsSelectedSeparatorStyles() {
    assertEquals(
      "03|07",
      DigitalTimeFormatter.format(config("HH:mm", separatorStyle = "pipe"), at(3, 7)),
    )
    assertEquals(
      "03-07",
      DigitalTimeFormatter.format(config("HH:mm", separatorStyle = "dash"), at(3, 7)),
    )
    assertEquals(
      "03 07",
      DigitalTimeFormatter.format(config("HH:mm", separatorStyle = "space"), at(3, 7)),
    )
    assertEquals(
      "03:07",
      DigitalTimeFormatter.format(config("HH:mm", separatorStyle = "image"), at(3, 7)),
    )
  }

  private fun config(
    format: String,
    colonVisible: Boolean = true,
    separatorStyle: String = "colon",
  ) = NativeDigitalConfig(
    format = format,
    separatorStyle = separatorStyle,
    digitSpacing = 0f,
    colonVisible = colonVisible,
    digitImagePaths = emptyMap(),
    transform = NativeDigitalTransform(0f, 0f, 100f, 40f, 0f),
  )

  private fun at(hour: Int, minute: Int): Calendar =
    Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
      set(2026, Calendar.JULY, 24, hour, minute, 0)
    }
}
