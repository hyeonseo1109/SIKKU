export type AnalogClockConfig = {
  hourHandLayerId?: string;
  minuteHandLayerId?: string;
  centerX: number;
  centerY: number;
  showCenterCap: boolean;
  previewMode: "current" | "custom";
  previewHour: number;
  previewMinute: number;
};
