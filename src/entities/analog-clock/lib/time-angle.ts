export const getHourAngle = (
  hour: number,
  minute: number,
  second = 0,
): number => {
  return (hour % 12) * 30 + minute * 0.5 + second / 120;
};

export const getMinuteAngle = (minute: number, second = 0): number => {
  return minute * 6 + second * 0.1;
};
