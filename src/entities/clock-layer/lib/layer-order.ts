import type { ClockLayer } from "../model/types";

export const normalizeLayerOrder = (layers: ClockLayer[]): ClockLayer[] => {
  return [...layers]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((layer, zIndex) => ({ ...layer, zIndex }));
};

export const moveLayer = (
  layers: ClockLayer[],
  layerId: string,
  direction: "up" | "down" | "front" | "back",
): ClockLayer[] => {
  const ordered = normalizeLayerOrder(layers);
  const index = ordered.findIndex((layer) => layer.id === layerId);

  if (index < 0) {
    return ordered;
  }

  const destination =
    direction === "front"
      ? ordered.length - 1
      : direction === "back"
        ? 0
        : direction === "up"
          ? Math.min(index + 1, ordered.length - 1)
          : Math.max(index - 1, 0);

  const result = [...ordered];
  const [layer] = result.splice(index, 1);

  if (!layer) {
    return ordered;
  }

  result.splice(destination, 0, layer);
  return normalizeLayerOrder(result);
};
