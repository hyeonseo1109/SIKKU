package com.sikku.clockwidget

import android.content.Context
import org.json.JSONObject
import java.util.UUID

data class StoredWidgetConfig(
  val appWidgetId: Int,
  val projectId: String,
  val configJson: String,
  val updatedAt: Long,
)

class WidgetConfigRepository(context: Context) {
  private val preferences =
    context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)

  fun save(appWidgetId: Int, configJson: String): StoredWidgetConfig {
    val projectId = JSONObject(configJson).getString("projectId")
    val stored = StoredWidgetConfig(appWidgetId, projectId, configJson, System.currentTimeMillis())
    preferences.edit()
      .putString(widgetKey(appWidgetId), JSONObject().apply {
        put("appWidgetId", stored.appWidgetId)
        put("projectId", stored.projectId)
        put("configJson", stored.configJson)
        put("updatedAt", stored.updatedAt)
      }.toString())
      .apply()
    return stored
  }

  fun get(appWidgetId: Int): StoredWidgetConfig? =
    preferences.getString(widgetKey(appWidgetId), null)?.let(::decode)

  fun getAll(): List<StoredWidgetConfig> =
    preferences.all
      .filterKeys { it.startsWith(WIDGET_PREFIX) }
      .values
      .mapNotNull { value -> (value as? String)?.let(::decode) }

  fun findByProject(projectId: String): List<StoredWidgetConfig> =
    getAll().filter { it.projectId == projectId }

  fun remove(appWidgetId: Int) {
    preferences.edit().remove(widgetKey(appWidgetId)).apply()
  }

  fun savePending(projectId: String, configJson: String): String {
    val token = UUID.randomUUID().toString()
    preferences.edit()
      .putString(pendingKey(token), JSONObject().apply {
        put("projectId", projectId)
        put("configJson", configJson)
        put("createdAt", System.currentTimeMillis())
      }.toString())
      .apply()
    clearExpiredPending()
    return token
  }

  fun consumePending(token: String): String? {
    val key = pendingKey(token)
    val value = preferences.getString(key, null) ?: return null
    preferences.edit().remove(key).apply()
    return runCatching { JSONObject(value).getString("configJson") }.getOrNull()
  }

  private fun clearExpiredPending() {
    val cutoff = System.currentTimeMillis() - PENDING_TTL_MS
    val expired = preferences.all
      .filterKeys { it.startsWith(PENDING_PREFIX) }
      .filterValues { value ->
        runCatching { JSONObject(value as String).getLong("createdAt") < cutoff }
          .getOrDefault(true)
      }
      .keys
    if (expired.isNotEmpty()) {
      preferences.edit().also { editor ->
        expired.forEach(editor::remove)
      }.apply()
    }
  }

  private fun decode(value: String): StoredWidgetConfig? = runCatching {
    val json = JSONObject(value)
    StoredWidgetConfig(
      appWidgetId = json.getInt("appWidgetId"),
      projectId = json.getString("projectId"),
      configJson = json.getString("configJson"),
      updatedAt = json.getLong("updatedAt"),
    )
  }.getOrNull()

  private fun widgetKey(appWidgetId: Int) = "$WIDGET_PREFIX$appWidgetId"
  private fun pendingKey(token: String) = "$PENDING_PREFIX$token"

  companion object {
    private const val PREFERENCES_NAME = "sikku_clock_widgets"
    private const val WIDGET_PREFIX = "widget_config_"
    private const val PENDING_PREFIX = "pending_config_"
    private const val PENDING_TTL_MS = 24L * 60L * 60L * 1000L
  }
}
