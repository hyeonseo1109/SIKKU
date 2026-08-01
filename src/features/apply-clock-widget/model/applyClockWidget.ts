import type { ClockProject } from "@/entities/clock-project";
import { serializeWidgetConfig } from "@/features/export-widget-config";
import {
  clockWidgetNative,
  type InstalledClockWidget,
  type PinWidgetResult,
} from "@/shared/native/clock-widget";

export const isClockWidgetSupported = () => clockWidgetNative.isSupported();

export const canScheduleExactClockWidgetUpdates = () =>
  clockWidgetNative.canScheduleExactUpdates();

export const requestExactClockWidgetUpdatePermission = () =>
  clockWidgetNative.requestExactUpdatePermission();

export const requestClockWidget = (
  project: ClockProject,
): Promise<PinWidgetResult> =>
  clockWidgetNative.requestPinWidget(
    project.id,
    serializeWidgetConfig(project),
  );

export const updateClockWidgets = (project: ClockProject): Promise<number[]> =>
  clockWidgetNative.updateProjectWidgets(
    project.id,
    serializeWidgetConfig(project),
  );

export const getClockWidgets = (): Promise<InstalledClockWidget[]> =>
  clockWidgetNative.getInstalledWidgets();

export const refreshClockWidgets = (): Promise<void> =>
  clockWidgetNative.refreshWidgets();

export const configureUnassignedClockWidgets = async (
  project: ClockProject,
): Promise<number[]> => {
  const configJson = serializeWidgetConfig(project);
  const widgets = await clockWidgetNative.getInstalledWidgets();
  const ids = widgets
    .filter((widget) => !widget.configured)
    .map((widget) => widget.appWidgetId);
  await Promise.all(
    ids.map((appWidgetId) =>
      clockWidgetNative.saveWidgetConfig(appWidgetId, configJson),
    ),
  );
  return ids;
};

export const clearClockWidgetsForProject = (
  projectId: string,
): Promise<number[]> => clockWidgetNative.clearProjectWidgets(projectId);
