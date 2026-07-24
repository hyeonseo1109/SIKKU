package com.sikku.clockwidget.model

data class NativeCanvasConfig(
  val width: Float,
  val height: Float,
  val backgroundColor: String,
  val backgroundImagePath: String?,
)

data class NativeImageLayer(
  val id: String,
  val type: String,
  val imagePath: String,
  val zIndex: Int,
  val opacity: Float,
  val x: Float,
  val y: Float,
  val width: Float,
  val height: Float,
  val rotation: Float,
  val anchorX: Float,
  val anchorY: Float,
  val tipX: Float?,
  val tipY: Float?,
)

data class NativeAnalogConfig(
  val centerX: Float,
  val centerY: Float,
  val showCenterCap: Boolean,
)

data class NativeDigitalTransform(
  val x: Float,
  val y: Float,
  val width: Float,
  val height: Float,
  val rotation: Float,
)

data class NativeDigitalConfig(
  val format: String,
  val digitSpacing: Float,
  val colonVisible: Boolean,
  val digitImagePaths: Map<String, String>,
  val transform: NativeDigitalTransform,
)

data class NativeWidgetConfig(
  val schemaVersion: Int,
  val projectId: String,
  val clockType: String,
  val canvas: NativeCanvasConfig,
  val layers: List<NativeImageLayer>,
  val analog: NativeAnalogConfig?,
  val digital: NativeDigitalConfig?,
)

data class WidgetSize(val width: Int, val height: Int)

data class WidgetViewport(
  val left: Float,
  val top: Float,
  val width: Float,
  val height: Float,
)
