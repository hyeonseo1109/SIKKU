package com.sikku.clockwidget

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import kotlin.math.max

class BitmapLoader {
  fun load(path: String, targetWidth: Int, targetHeight: Int): Bitmap? {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(path, bounds)
    if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null
    val options = BitmapFactory.Options().apply {
      inPreferredConfig = Bitmap.Config.ARGB_8888
      inSampleSize = calculateSampleSize(
        bounds.outWidth,
        bounds.outHeight,
        max(1, targetWidth),
        max(1, targetHeight),
      )
    }
    return runCatching { BitmapFactory.decodeFile(path, options) }.getOrNull()
  }

  private fun calculateSampleSize(
    sourceWidth: Int,
    sourceHeight: Int,
    targetWidth: Int,
    targetHeight: Int,
  ): Int {
    var sampleSize = 1
    while (
      sourceWidth / (sampleSize * 2) >= targetWidth &&
      sourceHeight / (sampleSize * 2) >= targetHeight
    ) {
      sampleSize *= 2
    }
    return sampleSize
  }
}
