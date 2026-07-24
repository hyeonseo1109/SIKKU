import { File } from "expo-file-system";

import type { ClockLayer } from "@/entities/clock-layer";
import type { ClockProject } from "@/entities/clock-project";
import type { DigitValue } from "@/entities/digital-clock";

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
    digitSpacing: number;
    colonVisible: boolean;
    digitImagePaths: Partial<Record<DigitValue, string>>;
    transform: NonNullable<ClockProject["digitalConfig"]>["transform"];
  };
};

const assertReadable = (uri: string, label: string) => {
  if (!uri.startsWith("file://") || !new File(uri).exists) {
    throw new Error(
      `${label} 이미지 파일이 없어요. 이미지를 다시 선택해 주세요.`,
    );
  }
};

export const exportWidgetConfig = (
  project: ClockProject,
): NativeWidgetConfig => {
  if (
    project.type === "analog" &&
    (!project.analogConfig?.hourHandLayerId ||
      !project.analogConfig.minuteHandLayerId)
  ) {
    throw new Error("시침과 분침 이미지를 모두 등록해 주세요.");
  }

  if (project.canvas.backgroundImageUri) {
    assertReadable(project.canvas.backgroundImageUri, "배경");
  }

  const layers = project.layers
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

  const digitImagePaths: Partial<Record<DigitValue, string>> = {};
  if (project.digitalConfig) {
    for (const [digit, uri] of Object.entries(
      project.digitalConfig.digitImageMap,
    )) {
      if (uri) {
        assertReadable(uri, `숫자 ${digit}`);
        digitImagePaths[digit as DigitValue] = uri;
      }
    }
  }

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
          digitSpacing: project.digitalConfig.digitSpacing,
          colonVisible: project.digitalConfig.colonVisible,
          digitImagePaths,
          transform: project.digitalConfig.transform,
        }
      : undefined,
  };
};

export const serializeWidgetConfig = (project: ClockProject) =>
  JSON.stringify(exportWidgetConfig(project), null, 2);
