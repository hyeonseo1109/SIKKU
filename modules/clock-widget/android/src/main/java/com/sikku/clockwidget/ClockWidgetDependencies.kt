package com.sikku.clockwidget

import android.content.Context

object ClockWidgetDependencies {
  fun repository(context: Context) = WidgetConfigRepository(context)

  fun parser(context: Context) = WidgetConfigParser(WidgetFilePathResolver(context))

  fun sizeResolver(context: Context) = WidgetSizeResolver(context)

  fun renderer(context: Context): ClockWidgetRenderer {
    val loader = BitmapLoader()
    val composer = BitmapComposer(loader)
    return ClockWidgetRenderer(
      sizeResolver = sizeResolver(context),
      composer = composer,
      analogRenderer = AnalogClockRenderer(composer),
      digitalRenderer = DigitalClockRenderer(composer, loader),
    )
  }

  fun updater(context: Context) = ClockWidgetUpdater(
    context = context.applicationContext,
    repository = repository(context),
    parser = parser(context),
    sizeResolver = sizeResolver(context),
    renderer = renderer(context),
  )

  fun scheduler(context: Context) = WidgetUpdateScheduler(context.applicationContext)
}
