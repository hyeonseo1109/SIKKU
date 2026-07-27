package com.sikku.clockwidget.model

data class NativeCanvasConfig(
  val width: Float,
  val height: Float,
  val backgroundColor: String,
  val backgroundColorOpacity: Float = 1f,
  val backgroundImagePath: String? = null,
  val backgroundImageOpacity: Float = 1f,
  val appearance: String = "solid",
  val cornerRadius: Float = 24f,
  val shadow: NativeCanvasShadow = NativeCanvasShadow(),
)

data class NativeCanvasShadow(
  val enabled: Boolean = false,
  val color: String = "#214E49",
  val opacity: Float = 0.18f,
  val blur: Float = 18f,
  val offsetX: Float = 0f,
  val offsetY: Float = 8f,
)

data class NativeImageLayer(
  val id: String,
  val type: String,
  val imagePath: String,
  val zIndex: Int,
  val opacity: Float,
  val tintColor: String? = null,
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
  val hourHandColor: String = "#18312E",
  val minuteHandColor: String = "#2F6F68",
  val hourHandOpacity: Float = 1f,
  val minuteHandOpacity: Float = 1f,
  val centerCapColor: String = "#F3A58E",
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
  val separatorStyle: String = "colon",
  val digitSpacing: Float,
  val colonVisible: Boolean,
  val digitImagePaths: Map<String, String>,
  val digitColor: String? = null,
  val digitOpacity: Float = 1f,
  val transform: NativeDigitalTransform,
  val slotTransforms: Map<String, NativeDigitalTransform> = emptyMap(),
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
