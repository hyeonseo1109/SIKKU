package com.sikku.clockwidget

import android.content.Context
import android.net.Uri
import java.io.File

class WidgetFilePathResolver(context: Context) {
  private val allowedRoot = context.filesDir.canonicalFile

  fun resolve(uriString: String): String {
    val uri = Uri.parse(uriString)
    require(uri.scheme == "file") { "앱 내부 file URI만 사용할 수 있습니다." }
    val path = uri.path ?: error("이미지 경로가 없습니다.")
    val file = File(path).canonicalFile
    require(file.path.startsWith("${allowedRoot.path}${File.separator}")) {
      "앱 저장소 밖의 이미지는 사용할 수 없습니다."
    }
    require(file.isFile && file.canRead()) { "이미지 파일을 읽을 수 없습니다." }
    require(file.length() <= MAX_IMAGE_FILE_BYTES) { "이미지 파일이 너무 큽니다." }
    return file.path
  }

  companion object {
    private const val MAX_IMAGE_FILE_BYTES = 50L * 1024L * 1024L
  }
}
