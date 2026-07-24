# Clock Widget local module

This directory reserves the boundary for a future local Expo Module. There is
no native implementation yet, and the React Native adapter reports that state
as an explicit error.

The Android implementation will be separated by responsibility:

- `ClockWidgetModule.kt`: Expo Module API exposed to React Native
- `ClockWidgetProvider.kt`: `AppWidgetProvider` lifecycle
- `ClockWidgetUpdater.kt`: `AppWidgetManager` and `RemoteViews` updates
- `ClockWidgetRenderer.kt`: analog/digital rendering orchestration
- `BitmapComposer.kt`: bitmap layers, transforms, and rotation
- `WidgetConfigRepository.kt`: per-`appWidgetId` persistence

When native work begins, initialize this directory as a local Expo Module and
add `expo-module.config.json`, Android sources, resources, and tests. Do not
generate native folders for the application until a Development Build is
actually required.
