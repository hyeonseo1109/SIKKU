import type { ClockType } from "@/entities/clock-project";

export type WidgetConfig = {
  widgetId?: number;
  projectId: string;
  clockType: ClockType;
  renderedAssetUri?: string;
  updatedAt: string;
};
