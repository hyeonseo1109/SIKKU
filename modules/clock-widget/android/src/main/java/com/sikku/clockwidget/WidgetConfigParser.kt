package com.sikku.clockwidget

import com.sikku.clockwidget.model.NativeAnalogConfig
import com.sikku.clockwidget.model.NativeCanvasConfig
import com.sikku.clockwidget.model.NativeCanvasShadow
import com.sikku.clockwidget.model.NativeDigitalConfig
import com.sikku.clockwidget.model.NativeDigitalTransform
import com.sikku.clockwidget.model.NativeImageLayer
import com.sikku.clockwidget.model.NativeWidgetConfig
import org.json.JSONObject

class WidgetConfigParser(
  private val filePathResolver: WidgetFilePathResolver,
) {
  fun parse(json: String): NativeWidgetConfig {
    val root = JSONObject(json)
    val schemaVersion = root.requireInt("schemaVersion")
    require(schemaVersion == SUPPORTED_SCHEMA_VERSION) {
      "지원하지 않는 위젯 설정 버전입니다: $schemaVersion"
    }
    val projectId = root.requireString("projectId")
    val clockType = root.requireString("clockType")
    require(clockType == "analog" || clockType == "digital") {
      "지원하지 않는 시계 유형입니다."
    }
    val canvasJson = root.getJSONObject("canvas")
    val shadowJson = canvasJson.optJSONObject("shadow")
    val canvas = NativeCanvasConfig(
      width = canvasJson.requirePositiveFloat("width"),
      height = canvasJson.requirePositiveFloat("height"),
      backgroundColor = canvasJson.optString("backgroundColor", "transparent"),
      backgroundColorOpacity = canvasJson.optDouble("backgroundColorOpacity", 1.0)
        .toFloat()
        .coerceIn(0f, 1f),
      backgroundImagePath = canvasJson.optionalFilePath("backgroundImageUri"),
      backgroundImageOpacity = canvasJson.optDouble("backgroundImageOpacity", 1.0)
        .toFloat()
        .coerceIn(0f, 1f),
      appearance = canvasJson.optString("appearance", "solid")
        .takeIf { it == "glass" } ?: "solid",
      cornerRadius = canvasJson.optDouble("cornerRadius", 24.0)
        .toFloat()
        .coerceAtLeast(0f),
      shadow = NativeCanvasShadow(
        enabled = shadowJson?.optBoolean("enabled", false) ?: false,
        color = shadowJson?.optString("color", "#214E49") ?: "#214E49",
        opacity = shadowJson?.optDouble("opacity", 0.18)
          ?.toFloat()
          ?.coerceIn(0f, 1f) ?: 0.18f,
        blur = shadowJson?.optDouble("blur", 18.0)
          ?.toFloat()
          ?.coerceAtLeast(0f) ?: 18f,
        offsetX = shadowJson?.optDouble("offsetX", 0.0)?.toFloat() ?: 0f,
        offsetY = shadowJson?.optDouble("offsetY", 8.0)?.toFloat() ?: 8f,
      ),
    )
    val layerJson = root.optJSONArray("layers")
    val layers = buildList {
      if (layerJson != null) {
        for (index in 0 until layerJson.length()) {
          add(parseLayer(layerJson.getJSONObject(index)))
        }
      }
    }
    val analog = root.optJSONObject("analog")?.let {
      NativeAnalogConfig(
        centerX = it.requireFiniteFloat("centerX"),
        centerY = it.requireFiniteFloat("centerY"),
        showCenterCap = it.optBoolean("showCenterCap", true),
        hourHandColor = it.optString("hourHandColor", "#18312E"),
        minuteHandColor = it.optString("minuteHandColor", "#2F6F68"),
        hourHandOpacity = it.optDouble("hourHandOpacity", 1.0)
          .toFloat()
          .coerceIn(0f, 1f),
        minuteHandOpacity = it.optDouble("minuteHandOpacity", 1.0)
          .toFloat()
          .coerceIn(0f, 1f),
        centerCapColor = it.optString("centerCapColor", "#F3A58E"),
      )
    }
    val digital = root.optJSONObject("digital")?.let(::parseDigital)
    require(clockType != "analog" || analog != null) {
      "아날로그 설정이 없습니다."
    }
    require(clockType != "digital" || digital != null) {
      "디지털 설정이 없습니다."
    }
    return NativeWidgetConfig(
      schemaVersion = schemaVersion,
      projectId = projectId,
      clockType = clockType,
      canvas = canvas,
      layers = layers.sortedBy { it.zIndex },
      analog = analog,
      digital = digital,
    )
  }

  private fun parseLayer(json: JSONObject) = NativeImageLayer(
    id = json.requireString("id"),
    type = json.requireString("type"),
    imagePath = filePathResolver.resolve(json.requireString("imagePath")),
    zIndex = json.optInt("zIndex", 0),
    opacity = json.requireFiniteFloat("opacity").coerceIn(0f, 1f),
    tintColor = json.optString("tintColor").takeIf { it.isNotBlank() },
    x = json.requireFiniteFloat("x"),
    y = json.requireFiniteFloat("y"),
    width = json.requirePositiveFloat("width"),
    height = json.requirePositiveFloat("height"),
    rotation = json.requireFiniteFloat("rotation"),
    anchorX = json.requireFiniteFloat("anchorX").coerceIn(0f, 1f),
    anchorY = json.requireFiniteFloat("anchorY").coerceIn(0f, 1f),
    tipX = json.optionalFiniteFloat("tipX")?.coerceIn(0f, 1f),
    tipY = json.optionalFiniteFloat("tipY")?.coerceIn(0f, 1f),
  )

  private fun parseDigital(json: JSONObject): NativeDigitalConfig {
    val pathsJson = json.optJSONObject("digitImagePaths") ?: JSONObject()
    val paths = buildMap {
      pathsJson.keys().forEach { key ->
        put(key, filePathResolver.resolve(pathsJson.getString(key)))
      }
    }
    val transformJson = json.getJSONObject("transform")
    val slotTransformsJson = json.optJSONObject("slotTransforms")
    val slotTransforms = buildMap {
      slotTransformsJson?.keys()?.forEach { key ->
        put(key, parseDigitalTransform(slotTransformsJson.getJSONObject(key)))
      }
    }
    return NativeDigitalConfig(
      format = json.optString("format", "HH:mm"),
      separatorStyle = json.optString("separatorStyle", "colon"),
      digitSpacing = json.requireFiniteFloat("digitSpacing"),
      colonVisible = json.optBoolean("colonVisible", true),
      digitImagePaths = paths,
      digitColor = json.optString("digitColor").takeIf { it.isNotBlank() },
      digitOpacity = json.optDouble("digitOpacity", 1.0)
        .toFloat()
        .coerceIn(0f, 1f),
      transform = parseDigitalTransform(transformJson),
      slotTransforms = slotTransforms,
    )
  }

  private fun parseDigitalTransform(json: JSONObject) = NativeDigitalTransform(
    x = json.requireFiniteFloat("x"),
    y = json.requireFiniteFloat("y"),
    width = json.requirePositiveFloat("width"),
    height = json.requirePositiveFloat("height"),
    rotation = json.requireFiniteFloat("rotation"),
  )

  private fun JSONObject.optionalFilePath(key: String): String? {
    val value = optString(key).takeIf { it.isNotBlank() } ?: return null
    return filePathResolver.resolve(value)
  }

  private fun JSONObject.requireString(key: String): String =
    getString(key).trim().also { require(it.isNotEmpty()) { "$key 값이 비어 있습니다." } }

  private fun JSONObject.requireInt(key: String): Int = getInt(key)

  private fun JSONObject.requirePositiveFloat(key: String): Float =
    requireFiniteFloat(key).also { require(it > 0f) { "$key 값은 0보다 커야 합니다." } }

  private fun JSONObject.requireFiniteFloat(key: String): Float =
    getDouble(key).toFloat().also { require(it.isFinite()) { "$key 값이 올바르지 않습니다." } }

  private fun JSONObject.optionalFiniteFloat(key: String): Float? =
    if (has(key) && !isNull(key)) requireFiniteFloat(key) else null

  companion object {
    const val SUPPORTED_SCHEMA_VERSION = 1
  }
}
