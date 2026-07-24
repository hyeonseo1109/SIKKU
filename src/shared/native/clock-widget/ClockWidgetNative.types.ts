export type ApplyClockWidgetParams = {
  projectId: string;
};

export type ClockWidgetNativeModule = {
  saveWidgetConfig: (params: ApplyClockWidgetParams) => Promise<void>;
  updateWidget: (widgetId?: number) => Promise<void>;
};
