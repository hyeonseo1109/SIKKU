export type DigitValue =
  "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "colon";

export type DigitalClockFormat = "HH:mm" | "h:mm";

export type DigitalDisplayTransform = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

export type DigitalClockConfig = {
  format: DigitalClockFormat;
  digitSpacing: number;
  colonVisible: boolean;
  digitImageMap: Partial<Record<DigitValue, string>>;
  digitAssetMap: Partial<Record<DigitValue, string>>;
  transform: DigitalDisplayTransform;
};
