package com.sikku.clockwidget

import com.sikku.clockwidget.model.NativeDigitalConfig
import java.util.Calendar
import java.util.Locale

object DigitalTimeFormatter {
  fun format(config: NativeDigitalConfig, calendar: Calendar): String {
    val hour = if (config.format == "h:mm") {
      calendar.get(Calendar.HOUR).let { if (it == 0) 12 else it }
    } else {
      calendar.get(Calendar.HOUR_OF_DAY)
    }
    val hourText = if (config.format == "h:mm") {
      hour.toString()
    } else {
      String.format(Locale.US, "%02d", hour)
    }
    val separator = if (config.colonVisible) {
      when (config.separatorStyle) {
        "pipe", "small-pipe" -> "|"
        "dash" -> "-"
        "space" -> " "
        "none" -> ""
        else -> ":"
      }
    } else {
      ""
    }
    return "$hourText$separator${String.format(Locale.US, "%02d", calendar.get(Calendar.MINUTE))}"
  }
}
