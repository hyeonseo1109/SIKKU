import type { NormalizedPoint } from "@/entities/image-asset";

const MIN_POLYGON_AREA = 0.0025;

export const closePolygon = (points: NormalizedPoint[]): NormalizedPoint[] => {
  if (points.length < 2) {
    return points;
  }

  const first = points[0];
  const last = points.at(-1);

  if (!first || !last || (first.x === last.x && first.y === last.y)) {
    return points;
  }

  return [...points, first];
};

export const getPolygonArea = (points: NormalizedPoint[]): number => {
  if (points.length < 3) {
    return 0;
  }

  return (
    Math.abs(
      points.reduce((sum, point, index) => {
        const next = points[(index + 1) % points.length];
        return next ? sum + point.x * next.y - next.x * point.y : sum;
      }, 0),
    ) / 2
  );
};

export const isValidPolygon = (points: NormalizedPoint[]): boolean => {
  return points.length >= 8 && getPolygonArea(points) >= MIN_POLYGON_AREA;
};
