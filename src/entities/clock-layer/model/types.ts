import type { DigitValue } from "@/entities/digital-clock";

export type ClockLayerTransform = {
  /** Layer center in logical canvas coordinates. */
  x: number;
  y: number;
  /** Unscaled size in logical canvas coordinates. */
  width: number;
  height: number;
  /** User-authored clockwise rotation in degrees. */
  rotation: number;
  scaleX: number;
  scaleY: number;
  /** Rotation anchor normalized to the image bounds (0–1). */
  anchorX: number;
  anchorY: number;
  /** The point that should face the clock value, normalized to 0–1. */
  tipX?: number;
  tipY?: number;
};

export type BaseClockLayer = {
  id: string;
  name: string;
  imageUri: string;
  imageAssetId?: string;
  transform: ClockLayerTransform;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  opacity: number;
};

export type DecorationLayer = BaseClockLayer & {
  type: "decoration";
};

export type HourHandLayer = BaseClockLayer & {
  type: "hour-hand";
};

export type MinuteHandLayer = BaseClockLayer & {
  type: "minute-hand";
};

export type DigitalDigitLayer = BaseClockLayer & {
  type: "digit";
  digit: DigitValue;
};

export type ClockLayer =
  DecorationLayer | HourHandLayer | MinuteHandLayer | DigitalDigitLayer;

export type ClockLayerType = ClockLayer["type"];
