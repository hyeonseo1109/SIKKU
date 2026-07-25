import type {
  DigitalClockConfig,
  DigitalDisplayTransform,
  DigitalSeparatorStyle,
  DigitalSlotId,
  DigitValue,
} from "../model/types";

export const DIGITAL_SLOT_IDS: DigitalSlotId[] = [
  "hour-tens",
  "hour-ones",
  "colon",
  "minute-tens",
  "minute-ones",
];

export const DIGITAL_SLOT_LABELS: Record<DigitalSlotId, string> = {
  "hour-tens": "시 십의 자리",
  "hour-ones": "시 일의 자리",
  colon: "콜론",
  "minute-tens": "분 십의 자리",
  "minute-ones": "분 일의 자리",
};

export type DigitalTimeSlot = {
  id: DigitalSlotId;
  digit?: DigitValue;
  character: string;
  compact?: boolean;
};

export const getDigitalSeparatorStyle = (
  config: DigitalClockConfig,
): DigitalSeparatorStyle =>
  config.colonVisible === false ? "none" : (config.separatorStyle ?? "colon");

export const getDigitalSeparatorCharacter = (
  style: DigitalSeparatorStyle,
): string => {
  switch (style) {
    case "colon":
      return ":";
    case "pipe":
    case "small-pipe":
      return "|";
    case "dash":
      return "-";
    case "space":
      return " ";
    case "none":
      return "";
  }
};

const toDigitValue = (character: string): DigitValue =>
  character === ":" ? "colon" : (character as DigitValue);

export const getDigitalTimeSlots = (
  date: Date,
  config: DigitalClockConfig,
): DigitalTimeSlot[] => {
  const rawHour =
    config.format === "HH:mm"
      ? String(date.getHours()).padStart(2, "0")
      : String(date.getHours() % 12 || 12);
  const minute = String(date.getMinutes()).padStart(2, "0");
  const separatorStyle = getDigitalSeparatorStyle(config);
  const separator = getDigitalSeparatorCharacter(separatorStyle);
  const slots: DigitalTimeSlot[] = [];

  if (rawHour.length === 2) {
    slots.push({
      id: "hour-tens",
      character: rawHour[0] ?? "0",
      digit: toDigitValue(rawHour[0] ?? "0"),
    });
  }
  slots.push({
    id: "hour-ones",
    character: rawHour.at(-1) ?? "0",
    digit: toDigitValue(rawHour.at(-1) ?? "0"),
  });
  if (separatorStyle !== "none") {
    slots.push({
      id: "colon",
      character: separator,
      compact: separatorStyle === "small-pipe",
      digit: separatorStyle === "colon" ? "colon" : undefined,
    });
  }
  slots.push(
    {
      id: "minute-tens",
      character: minute[0] ?? "0",
      digit: toDigitValue(minute[0] ?? "0"),
    },
    {
      id: "minute-ones",
      character: minute[1] ?? "0",
      digit: toDigitValue(minute[1] ?? "0"),
    },
  );
  return slots;
};

export const getDefaultDigitalSlotTransforms = (
  config: DigitalClockConfig,
  canvas?: { width: number; height: number },
): Record<DigitalSlotId, DigitalDisplayTransform> => {
  const { transform } = config;
  const spacing = config.digitSpacing;
  const centerX = canvas
    ? Math.min(
        canvas.width - transform.width / 2,
        Math.max(transform.width / 2, transform.x),
      )
    : transform.x;
  const centerY = canvas
    ? Math.min(
        canvas.height - transform.height / 2,
        Math.max(transform.height / 2, transform.y),
      )
    : transform.y;
  const itemWidth = Math.max(
    12,
    (transform.width - spacing * (DIGITAL_SLOT_IDS.length - 1)) /
      DIGITAL_SLOT_IDS.length,
  );
  const startX = centerX - transform.width / 2 + itemWidth / 2;

  return Object.fromEntries(
    DIGITAL_SLOT_IDS.map((slotId, index) => [
      slotId,
      {
        x: startX + index * (itemWidth + spacing),
        y: centerY,
        width: itemWidth,
        height: transform.height,
        rotation: transform.rotation,
      },
    ]),
  ) as Record<DigitalSlotId, DigitalDisplayTransform>;
};

export const resolveDigitalSlotTransforms = (
  config: DigitalClockConfig,
  canvas?: { width: number; height: number },
): Record<DigitalSlotId, DigitalDisplayTransform> => ({
  ...getDefaultDigitalSlotTransforms(config, canvas),
  ...config.slotTransforms,
});
