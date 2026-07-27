export type DigitValue =
  "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "colon";

export type DigitalClockFormat = "HH:mm" | "h:mm";

export type DigitalSeparatorStyle =
  "colon" | "pipe" | "small-pipe" | "dash" | "space" | "image" | "none";

export type DigitalSlotId =
  "hour-tens" | "hour-ones" | "colon" | "minute-tens" | "minute-ones";

export type DigitalDisplayTransform = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

export type DigitalClockConfig = {
  format: DigitalClockFormat;
  separatorStyle?: DigitalSeparatorStyle;
  digitSpacing: number;
  colonVisible: boolean;
  digitImageMap: Partial<Record<DigitValue, string>>;
  digitAssetMap: Partial<Record<DigitValue, string>>;
  /** Applies to fallback text and, when set, tints custom digit images. */
  digitColor?: string;
  digitOpacity?: number;
  transform: DigitalDisplayTransform;
  slotTransforms?: Partial<Record<DigitalSlotId, DigitalDisplayTransform>>;
};
