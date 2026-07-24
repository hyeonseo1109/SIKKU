export type InstalledClockWidget = {
  appWidgetId: number;
  projectId?: string;
  width?: number;
  height?: number;
  configured: boolean;
  updatedAt?: number;
};

export type PinWidgetResult =
  | { status: "requested" }
  | { status: "unsupported" }
  | { status: "failed"; message?: string };

export type ClockWidgetNativeModule = {
  isSupported: () => boolean;
  requestPinWidget: (
    projectId: string,
    configJson: string,
  ) => Promise<PinWidgetResult>;
  saveWidgetConfig: (appWidgetId: number, configJson: string) => Promise<void>;
  updateWidget: (appWidgetId: number, configJson?: string) => Promise<void>;
  updateProjectWidgets: (
    projectId: string,
    configJson: string,
  ) => Promise<number[]>;
  clearProjectWidgets: (projectId: string) => Promise<number[]>;
  getInstalledWidgets: () => Promise<InstalledClockWidget[]>;
  removeWidgetConfig: (appWidgetId: number) => Promise<void>;
};
