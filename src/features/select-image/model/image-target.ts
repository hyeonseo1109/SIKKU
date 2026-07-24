import type { DigitValue } from "@/entities/digital-clock";

export type ImageTarget =
  | { kind: "background" }
  | { kind: "decoration" }
  | { kind: "hour-hand"; replaceLayerId?: string }
  | { kind: "minute-hand"; replaceLayerId?: string }
  | { kind: "digit"; digit: DigitValue }
  | { kind: "layer-reedit"; layerId: string };
