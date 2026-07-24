import {
  canvasPresets,
  CLOCK_PROJECT_SCHEMA_VERSION,
  clockProjectRepository,
  type CanvasPreset,
  type ClockProject,
  type ClockType,
} from "@/entities/clock-project";
import { createId } from "@/shared/lib/id";

export type CreateClockProjectInput = {
  name: string;
  type: ClockType;
  preset: CanvasPreset;
};

export const buildClockProject = ({
  name,
  preset,
  type,
}: CreateClockProjectInput): ClockProject => {
  const id = createId("project");
  const now = new Date().toISOString();
  const { height, width } = canvasPresets[preset];

  return {
    id,
    name: name.trim(),
    type,
    canvas: {
      preset,
      width,
      height,
      backgroundColor: "#FFFFFF",
    },
    layers: [],
    assets: [],
    analogConfig:
      type === "analog"
        ? {
            centerX: width / 2,
            centerY: height / 2,
            showCenterCap: true,
            previewMode: "current",
            previewHour: 10,
            previewMinute: 10,
          }
        : undefined,
    digitalConfig:
      type === "digital"
        ? {
            format: "HH:mm",
            digitSpacing: 8,
            colonVisible: true,
            digitImageMap: {},
            digitAssetMap: {},
            transform: {
              x: width / 2,
              y: height / 2,
              width: Math.min(width * 0.75, 360),
              height: 100,
              rotation: 0,
            },
          }
        : undefined,
    createdAt: now,
    updatedAt: now,
    schemaVersion: CLOCK_PROJECT_SCHEMA_VERSION,
  };
};

export const createClockProject = async (
  input: CreateClockProjectInput,
): Promise<ClockProject> => {
  if (!input.name.trim()) {
    throw new Error("프로젝트 이름을 입력해 주세요.");
  }

  const project = buildClockProject(input);
  await clockProjectRepository.create(project);
  return project;
};
