import { clockWidgetNative } from "@/shared/native/clock-widget";

export const applyClockWidget = async (projectId: string) => {
  await clockWidgetNative.saveWidgetConfig({ projectId });
  await clockWidgetNative.updateWidget();
};
