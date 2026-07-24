import type { ClockProject } from "../../model/types";
import { CLOCK_PROJECT_SCHEMA_VERSION } from "../../model/types";
import { getLassoBottomCenter } from "@/entities/image-asset";

const isClockProject = (value: unknown): value is ClockProject => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<ClockProject>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    (candidate.type === "analog" || candidate.type === "digital") &&
    typeof candidate.canvas === "object" &&
    Array.isArray(candidate.layers) &&
    Array.isArray(candidate.assets) &&
    typeof candidate.schemaVersion === "number"
  );
};

const alignAnalogHandsToCenter = (project: ClockProject): ClockProject => {
  if (project.type !== "analog" || !project.analogConfig) {
    return project;
  }

  const { centerX, centerY } = project.analogConfig;
  return {
    ...project,
    layers: project.layers.map((layer) => {
      if (layer.type !== "hour-hand" && layer.type !== "minute-hand") {
        return layer;
      }

      const asset = project.assets.find(
        (item) => item.id === layer.imageAssetId,
      );
      const lassoAnchor =
        layer.transform.anchorX === 0.5 &&
        layer.transform.anchorY === 1 &&
        asset
          ? getLassoBottomCenter(asset)
          : null;

      return {
        ...layer,
        transform: {
          ...layer.transform,
          x: centerX,
          y: centerY,
          anchorX: lassoAnchor?.x ?? layer.transform.anchorX,
          anchorY: lassoAnchor?.y ?? layer.transform.anchorY,
        },
      };
    }),
  };
};

export const migrateClockProject = (value: unknown): ClockProject => {
  if (!isClockProject(value)) {
    throw new Error("Invalid clock project data");
  }

  if (value.schemaVersion > CLOCK_PROJECT_SCHEMA_VERSION) {
    throw new Error("Unsupported future clock project schema");
  }

  if (value.schemaVersion === CLOCK_PROJECT_SCHEMA_VERSION) {
    return alignAnalogHandsToCenter(value);
  }

  throw new Error(`Unsupported clock project schema: ${value.schemaVersion}`);
};
