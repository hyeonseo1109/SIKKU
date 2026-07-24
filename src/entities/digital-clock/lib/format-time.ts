import type { DigitalClockFormat } from "../model/types";

type FormatTimeParams = {
  date: Date;
  format: DigitalClockFormat;
  colonVisible?: boolean;
};

export const formatTime = ({
  colonVisible = true,
  date,
  format,
}: FormatTimeParams): string => {
  const minute = String(date.getMinutes()).padStart(2, "0");
  const rawHour =
    format === "HH:mm"
      ? String(date.getHours()).padStart(2, "0")
      : String(date.getHours() % 12 || 12);

  return colonVisible ? `${rawHour}:${minute}` : `${rawHour}${minute}`;
};
