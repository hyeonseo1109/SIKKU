import { File } from "expo-file-system";

import type { ClockLayer } from "@/entities/clock-layer";
import type { ClockProject } from "@/entities/clock-project";
import type { DigitValue, DigitalSlotId } from "@/entities/digital-clock";
import { resolveDigitalSlotTransforms } from "@/entities/digital-clock";

export type WidgetLayerConfig = {
  id: string;
  type: ClockLayer["type"];
  imagePath: string;
  zIndex: number;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  anchorX: number;
  anchorY: number;
  tipX?: number;
  tipY?: number;
};

export type NativeWidgetConfig = {
  schemaVersion: number;
  projectId: string;
  clockType: ClockProject["type"];
  canvas: ClockProject["canvas"];
  layers: WidgetLayerConfig[];
  analog?: ClockProject["analogConfig"];
  digital?: {
    format: NonNullable<ClockProject["digitalConfig"]>["format"];
    separatorStyle: NonNullable<
      ClockProject["digitalConfig"]
    >["separatorStyle"];
    digitSpacing: number;
    colonVisible: boolean;
    digitImagePaths: Partial<Record<DigitValue, string>>;
    transform: NonNullable<ClockProject["digitalConfig"]>["transform"];
    slotTransforms: Record<
      DigitalSlotId,
      NonNullable<ClockProject["digitalConfig"]>["transform"]
    >;
  };
};

const assertReadable = (uri: string, label: string) => {
  if (!uri.startsWith("file://") || !new File(uri).exists) {
    throw new Error(
      `${label} 이미지 파일이 없어요. 이미지를 다시 선택해 주세요.`,
    );
  }
};

const validateCanvasFiles = (project: ClockProject) => {
  if (project.canvas.backgroundImageUri) {
    assertReadable(project.canvas.backgroundImageUri, "배경");
  }
};

const exportLayers = (project: ClockProject): WidgetLayerConfig[] =>
  project.layers
    .filter((layer) => layer.visible)
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((layer) => {
      assertReadable(layer.imageUri, layer.name);
      return {
        id: layer.id,
        type: layer.type,
        imagePath: layer.imageUri,
        zIndex: layer.zIndex,
        opacity: layer.opacity,
        ...layer.transform,
      };
    });

const exportDigitImagePaths = (
  project: ClockProject,
): Partial<Record<DigitValue, string>> => {
  const digitImagePaths: Partial<Record<DigitValue, string>> = {};
  if (!project.digitalConfig) return digitImagePaths;
  for (const [digit, uri] of Object.entries(
    project.digitalConfig.digitImageMap,
  )) {
    if (uri) {
      assertReadable(uri, `숫자 ${digit}`);
      digitImagePaths[digit as DigitValue] = uri;
    }
  }
  return digitImagePaths;
};

export const exportWidgetConfig = (
  project: ClockProject,
): NativeWidgetConfig => {
  validateCanvasFiles(project);
  const layers = exportLayers(project);
  const digitImagePaths = exportDigitImagePaths(project);

  return {
    schemaVersion: project.schemaVersion,
    projectId: project.id,
    clockType: project.type,
    canvas: project.canvas,
    layers,
    analog: project.analogConfig,
    digital: project.digitalConfig
      ? {
          format: project.digitalConfig.format,
          separatorStyle: project.digitalConfig.separatorStyle ?? "colon",
          digitSpacing: project.digitalConfig.digitSpacing,
          colonVisible: project.digitalConfig.colonVisible,
          digitImagePaths,
          transform: project.digitalConfig.transform,
          slotTransforms: resolveDigitalSlotTransforms(
            project.digitalConfig,
            project.canvas,
          ),
        }
      : undefined,
  };
};

export const serializeWidgetConfig = (project: ClockProject) =>
  JSON.stringify(exportWidgetConfig(project), null, 2);
