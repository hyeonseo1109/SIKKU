import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";

import type { ClockWidgetNativeModule } from "./ClockWidgetNative.types";

export class ClockWidgetUnavailableError extends Error {
  constructor() {
    super("Android Development Build에서만 홈 화면 위젯을 사용할 수 있어요.");
    this.name = "ClockWidgetUnavailableError";
  }
}

const nativeModule =
  Platform.OS === "android"
    ? requireOptionalNativeModule<ClockWidgetNativeModule>("ClockWidget")
    : null;

const requireModule = (): ClockWidgetNativeModule => {
  if (!nativeModule) throw new ClockWidgetUnavailableError();
  return nativeModule;
};

export const clockWidgetNative: ClockWidgetNativeModule = {
  isSupported: () => nativeModule?.isSupported() ?? false,
  canScheduleExactUpdates: () =>
    nativeModule?.canScheduleExactUpdates() ?? false,
  requestExactUpdatePermission: () =>
    requireModule().requestExactUpdatePermission(),
  requestPinWidget: (projectId, configJson) =>
    requireModule().requestPinWidget(projectId, configJson),
  saveWidgetConfig: (appWidgetId, configJson) =>
    requireModule().saveWidgetConfig(appWidgetId, configJson),
  updateWidget: (appWidgetId, configJson) =>
    requireModule().updateWidget(appWidgetId, configJson),
  updateProjectWidgets: (projectId, configJson) =>
    requireModule().updateProjectWidgets(projectId, configJson),
  clearProjectWidgets: (projectId) =>
    requireModule().clearProjectWidgets(projectId),
  getInstalledWidgets: () => requireModule().getInstalledWidgets(),
  refreshWidgets: () => requireModule().refreshWidgets(),
  removeWidgetConfig: (appWidgetId) =>
    requireModule().removeWidgetConfig(appWidgetId),
};
