import type { AnalogClockConfig } from "@/entities/analog-clock";
import type { ClockLayer } from "@/entities/clock-layer";
import type { DigitalClockConfig } from "@/entities/digital-clock";
import type { ImageAsset } from "@/entities/image-asset";

export const CLOCK_PROJECT_SCHEMA_VERSION = 1;

export type ClockType = "analog" | "digital";
export type CanvasPreset = "square" | "landscape" | "portrait";

export type ClockCanvasShadow = {
  enabled: boolean;
  color: string;
  opacity: number;
  blur: number;
  offsetY: number;
};

export type ClockCanvas = {
  preset: CanvasPreset;
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImageUri?: string;
  backgroundImageAssetId?: string;
  cornerRadius?: number;
  shadow?: ClockCanvasShadow;
};

export type ClockProject = {
  id: string;
  name: string;
  type: ClockType;
  canvas: ClockCanvas;
  layers: ClockLayer[];
  assets: ImageAsset[];
  analogConfig?: AnalogClockConfig;
  digitalConfig?: DigitalClockConfig;
  previewImageUri?: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
};

export type ProjectIndexItem = {
  id: string;
  name: string;
  type: ClockType;
  previewImageUri?: string;
  updatedAt: string;
};

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";
