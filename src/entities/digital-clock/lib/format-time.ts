import { getDigitalSeparatorCharacter } from "./digital-slots";
import type { DigitalClockFormat, DigitalSeparatorStyle } from "../model/types";

type FormatTimeParams = {
  date: Date;
  format: DigitalClockFormat;
  colonVisible?: boolean;
  separatorStyle?: DigitalSeparatorStyle;
};

export const formatTime = ({
  colonVisible = true,
  date,
  format,
  separatorStyle = "colon",
}: FormatTimeParams): string => {
  const minute = String(date.getMinutes()).padStart(2, "0");
  const rawHour =
    format === "HH:mm"
      ? String(date.getHours()).padStart(2, "0")
      : String(date.getHours() % 12 || 12);

  const separator = colonVisible
    ? getDigitalSeparatorCharacter(separatorStyle)
    : "";
  return `${rawHour}${separator}${minute}`;
};
