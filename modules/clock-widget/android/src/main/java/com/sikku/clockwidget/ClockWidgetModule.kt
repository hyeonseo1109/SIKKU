package com.sikku.clockwidget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ClockWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ClockWidget")

    Function("isSupported") {
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
    }

    AsyncFunction("requestPinWidget") { projectId: String, configJson: String ->
      val context = requireContext()
      val manager = AppWidgetManager.getInstance(context)
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O ||
        !manager.isRequestPinAppWidgetSupported
      ) {
        return@AsyncFunction mapOf("status" to "unsupported")
      }
      parseProjectConfig(context, projectId, configJson)
      val repository = ClockWidgetDependencies.repository(context)
      val token = repository.savePending(projectId, configJson)
      val callbackIntent = Intent(context, ClockWidgetPinReceiver::class.java).apply {
        putExtra(ClockWidgetPinReceiver.EXTRA_CONFIG_TOKEN, token)
      }
      val callback = PendingIntent.getBroadcast(
        context,
        token.hashCode(),
        callbackIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or pinCallbackMutabilityFlag(),
      )
      val extras = android.os.Bundle().apply {
        putString(ClockWidgetPinReceiver.EXTRA_CONFIG_TOKEN, token)
      }
      val requested = manager.requestPinAppWidget(
        ComponentName(context, ClockWidgetProvider::class.java),
        extras,
        callback,
      )
      mapOf("status" to if (requested) "requested" else "failed")
    }

    AsyncFunction("saveWidgetConfig") { appWidgetId: Int, configJson: String ->
      val context = requireContext()
      ClockWidgetDependencies.parser(context).parse(configJson)
      ClockWidgetDependencies.repository(context).save(appWidgetId, configJson)
      ClockWidgetDependencies.updater(context).update(appWidgetId)
    }

    AsyncFunction("updateWidget") { appWidgetId: Int, configJson: String? ->
      val context = requireContext()
      if (configJson != null) {
        ClockWidgetDependencies.parser(context).parse(configJson)
        ClockWidgetDependencies.repository(context).save(appWidgetId, configJson)
      }
      ClockWidgetDependencies.updater(context).update(appWidgetId)
    }

    AsyncFunction("updateProjectWidgets") { projectId: String, configJson: String ->
      val context = requireContext()
      parseProjectConfig(context, projectId, configJson)
      val repository = ClockWidgetDependencies.repository(context)
      val installed = ClockWidgetUpdater.installedWidgetIds(context).toSet()
      val ids = repository.findByProject(projectId)
        .map { it.appWidgetId }
        .filter(installed::contains)
      ids.forEach { id ->
        repository.save(id, configJson)
        ClockWidgetDependencies.updater(context).update(id)
      }
      ids
    }

    AsyncFunction("clearProjectWidgets") { projectId: String ->
      val context = requireContext()
      val repository = ClockWidgetDependencies.repository(context)
      val installed = ClockWidgetUpdater.installedWidgetIds(context).toSet()
      val ids = repository.findByProject(projectId)
        .map { it.appWidgetId }
        .filter(installed::contains)
      ids.forEach { id ->
        repository.remove(id)
        ClockWidgetDependencies.updater(context).update(id)
      }
      ids
    }

    AsyncFunction("getInstalledWidgets") {
      val context = requireContext()
      val manager = AppWidgetManager.getInstance(context)
      val repository = ClockWidgetDependencies.repository(context)
      ClockWidgetUpdater.installedWidgetIds(context).map { id ->
        val stored = repository.get(id)
        val options = manager.getAppWidgetOptions(id)
        mapOf(
          "appWidgetId" to id,
          "projectId" to stored?.projectId,
          "width" to options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH),
          "height" to options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT),
          "configured" to (stored != null),
          "updatedAt" to stored?.updatedAt?.toDouble(),
        )
      }
    }

    AsyncFunction("removeWidgetConfig") { appWidgetId: Int ->
      val context = requireContext()
      ClockWidgetDependencies.repository(context).remove(appWidgetId)
      ClockWidgetDependencies.updater(context).update(appWidgetId)
    }
  }

  private fun requireContext(): Context =
    appContext.reactContext?.applicationContext
      ?: throw IllegalStateException("Android 앱 컨텍스트를 사용할 수 없습니다.")

  private fun parseProjectConfig(
    context: Context,
    projectId: String,
    configJson: String,
  ) {
    val config = ClockWidgetDependencies.parser(context).parse(configJson)
    require(config.projectId == projectId) {
      "프로젝트 ID와 위젯 설정이 일치하지 않습니다."
    }
  }

  private fun pinCallbackMutabilityFlag(): Int =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      PendingIntent.FLAG_MUTABLE
    } else {
      0
    }
}
