export const getCanvasScale = (
  logicalWidth: number,
  logicalHeight: number,
  screenWidth: number,
  screenHeight: number,
): number => {
  if (
    logicalWidth <= 0 ||
    logicalHeight <= 0 ||
    screenWidth <= 0 ||
    screenHeight <= 0
  ) {
    return 1;
  }

  return Math.min(screenWidth / logicalWidth, screenHeight / logicalHeight);
};
