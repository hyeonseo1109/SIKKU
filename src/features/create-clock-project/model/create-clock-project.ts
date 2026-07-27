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
      backgroundColorOpacity: 1,
      backgroundImageOpacity: 1,
      appearance: "solid",
      cornerRadius: 24,
      shadow: {
        enabled: true,
        color: "#214E49",
        opacity: 0.18,
        blur: 18,
        offsetX: 0,
        offsetY: 8,
      },
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
            hourHandColor: "#18312E",
            minuteHandColor: "#2F6F68",
            hourHandOpacity: 1,
            minuteHandOpacity: 1,
            centerCapColor: "#F3A58E",
          }
        : undefined,
    digitalConfig:
      type === "digital"
        ? {
            format: "HH:mm",
            separatorStyle: "colon",
            digitSpacing: 8,
            colonVisible: true,
            digitImageMap: {},
            digitAssetMap: {},
            digitColor: "#18312E",
            digitOpacity: 1,
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
