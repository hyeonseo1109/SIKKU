export type ClockLayerType =
  "background" | "decoration" | "hour-hand" | "minute-hand" | "digit";

export type ClockLayerTransform = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  /**
   * Normalized rotation anchor in the 0–1 range, relative to layer bounds.
   */
  anchorX: number;
  anchorY: number;
};

export type ClockLayer = {
  id: string;
  type: ClockLayerType;
  imageUri?: string;
  transform: ClockLayerTransform;
  zIndex: number;
  visible: boolean;
  locked: boolean;
};
