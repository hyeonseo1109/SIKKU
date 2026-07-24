package com.sikku.clockwidget

import android.graphics.Color

object WidgetColorParser {
  fun parse(value: String): Int {
    if (value == "transparent") return Color.TRANSPARENT
    return runCatching { Color.parseColor(value) }.getOrDefault(Color.TRANSPARENT)
  }
}
