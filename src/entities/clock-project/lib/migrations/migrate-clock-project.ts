import type { ClockProject } from "../../model/types";
import { CLOCK_PROJECT_SCHEMA_VERSION } from "../../model/types";

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

export const migrateClockProject = (value: unknown): ClockProject => {
  if (!isClockProject(value)) {
    throw new Error("Invalid clock project data");
  }

  if (value.schemaVersion > CLOCK_PROJECT_SCHEMA_VERSION) {
    throw new Error("Unsupported future clock project schema");
  }

  if (value.schemaVersion === CLOCK_PROJECT_SCHEMA_VERSION) {
    return value;
  }

  throw new Error(`Unsupported clock project schema: ${value.schemaVersion}`);
};
