import { File } from "expo-file-system";

import type { ClockLayer } from "@/entities/clock-layer";
import type { ImageAsset, NormalizedPoint } from "@/entities/image-asset";

import type { ClockProject } from "../../model/types";
import { CLOCK_PROJECT_SCHEMA_VERSION } from "../../model/types";

export type ProjectValidationIssue = {
  code: string;
  message: string;
  path: string;
};

export type ProjectValidationResult =
  | { valid: true; issues: [] }
  | { valid: false; issues: ProjectValidationIssue[] };

const finite = (value: number) => Number.isFinite(value);
const unit = (value: number) => finite(value) && value >= 0 && value <= 1;
const positive = (value: number) => finite(value) && value > 0;
const validColor = (value: string) =>
  value === "transparent" ||
  /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(value) ||
  /^rgba?\(/i.test(value);

const addDuplicateIssues = (
  values: string[],
  path: string,
  issues: ProjectValidationIssue[],
) => {
  if (new Set(values).size !== values.length) {
    issues.push({
      code: "duplicate-id",
      message: `${path} ID가 중복됐어요.`,
      path,
    });
  }
};

const validatePoint = (
  point: NormalizedPoint,
  path: string,
  issues: ProjectValidationIssue[],
) => {
  if (!unit(point.x) || !unit(point.y)) {
    issues.push({
      code: "invalid-point",
      message: "올가미 좌표가 이미지 범위를 벗어났어요.",
      path,
    });
  }
};

const validateAsset = (
  asset: ImageAsset,
  path: string,
  issues: ProjectValidationIssue[],
) => {
  if (!positive(asset.width) || !positive(asset.height)) {
    issues.push({
      code: "invalid-asset-size",
      message: "이미지 크기가 올바르지 않아요.",
      path,
    });
  }
  asset.lassoPoints?.forEach((point, index) =>
    validatePoint(point, `${path}.lassoPoints[${index}]`, issues),
  );
  asset.lassoRegions?.forEach((region, regionIndex) =>
    region.forEach((point, pointIndex) =>
      validatePoint(
        point,
        `${path}.lassoRegions[${regionIndex}][${pointIndex}]`,
        issues,
      ),
    ),
  );
  const bounds = asset.cropBounds;
  if (
    bounds &&
    (!unit(bounds.minX) ||
      !unit(bounds.minY) ||
      !unit(bounds.maxX) ||
      !unit(bounds.maxY) ||
      bounds.minX >= bounds.maxX ||
      bounds.minY >= bounds.maxY)
  ) {
    issues.push({
      code: "invalid-crop-bounds",
      message: "이미지 자르기 범위가 올바르지 않아요.",
      path: `${path}.cropBounds`,
    });
  }
};

const validateLayer = (
  layer: ClockLayer,
  assetIds: Set<string>,
  path: string,
  issues: ProjectValidationIssue[],
) => {
  const transform = layer.transform;
  if (
    !positive(transform.width) ||
    !positive(transform.height) ||
    !finite(transform.x) ||
    !finite(transform.y) ||
    !finite(transform.rotation) ||
    !finite(transform.scaleX) ||
    !finite(transform.scaleY) ||
    !unit(transform.anchorX) ||
    !unit(transform.anchorY) ||
    (transform.tipX !== undefined && !unit(transform.tipX)) ||
    (transform.tipY !== undefined && !unit(transform.tipY)) ||
    !finite(layer.zIndex) ||
    !unit(layer.opacity)
  ) {
    issues.push({
      code: "invalid-layer",
      message: "레이어 위치 또는 크기 값이 올바르지 않아요.",
      path,
    });
  }
  if (layer.imageAssetId && !assetIds.has(layer.imageAssetId)) {
    issues.push({
      code: "missing-asset-reference",
      message: `${layer.name} 레이어가 없는 이미지를 참조해요.`,
      path: `${path}.imageAssetId`,
    });
  }
};

const validateFile = (
  uri: string | undefined,
  path: string,
  issues: ProjectValidationIssue[],
) => {
  if (!uri) return;
  if (!uri.startsWith("file://") || !new File(uri).exists) {
    issues.push({
      code: "missing-file",
      message: `${path} 이미지 파일을 찾을 수 없어요.`,
      path,
    });
  }
};

const validateDisplayTransform = (
  transform: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  },
  path: string,
  issues: ProjectValidationIssue[],
) => {
  if (
    !finite(transform.x) ||
    !finite(transform.y) ||
    !positive(transform.width) ||
    !positive(transform.height) ||
    !finite(transform.rotation)
  ) {
    issues.push({
      code: "invalid-digital-transform",
      message: "디지털 시계 위치 또는 크기 값이 올바르지 않아요.",
      path,
    });
  }
};

export const validateClockProject = (
  project: ClockProject,
  options: { checkFiles?: boolean } = {},
): ProjectValidationResult => {
  const issues: ProjectValidationIssue[] = [];
  const assetIds = new Set(project.assets.map((asset) => asset.id));
  const layersById = new Map(project.layers.map((layer) => [layer.id, layer]));

  if (
    !project.id.trim() ||
    !project.name.trim() ||
    !["analog", "digital"].includes(project.type) ||
    project.schemaVersion !== CLOCK_PROJECT_SCHEMA_VERSION
  ) {
    issues.push({
      code: "invalid-project",
      message: "프로젝트 기본 정보가 올바르지 않아요.",
      path: "project",
    });
  }
  if (
    !positive(project.canvas.width) ||
    !positive(project.canvas.height) ||
    !validColor(project.canvas.backgroundColor) ||
    (project.canvas.cornerRadius !== undefined &&
      (!finite(project.canvas.cornerRadius) ||
        project.canvas.cornerRadius < 0)) ||
    (project.canvas.shadow !== undefined &&
      (!validColor(project.canvas.shadow.color) ||
        !unit(project.canvas.shadow.opacity) ||
        !finite(project.canvas.shadow.blur) ||
        project.canvas.shadow.blur < 0 ||
        !finite(project.canvas.shadow.offsetX) ||
        !finite(project.canvas.shadow.offsetY)))
  ) {
    issues.push({
      code: "invalid-canvas",
      message: "캔버스 설정이 올바르지 않아요.",
      path: "canvas",
    });
  }

  addDuplicateIssues(
    project.assets.map((asset) => asset.id),
    "assets",
    issues,
  );
  addDuplicateIssues(
    project.layers.map((layer) => layer.id),
    "layers",
    issues,
  );
  project.assets.forEach((asset, index) =>
    validateAsset(asset, `assets[${index}]`, issues),
  );
  project.layers.forEach((layer, index) =>
    validateLayer(layer, assetIds, `layers[${index}]`, issues),
  );
  if (
    project.canvas.backgroundImageAssetId &&
    !assetIds.has(project.canvas.backgroundImageAssetId)
  ) {
    issues.push({
      code: "missing-background-asset",
      message: "배경 이미지 Asset을 찾을 수 없어요.",
      path: "canvas.backgroundImageAssetId",
    });
  }

  const analog = project.analogConfig;
  if (project.type === "analog" && !analog) {
    issues.push({
      code: "missing-analog-config",
      message: "아날로그 시계 설정이 없어요.",
      path: "analogConfig",
    });
  }
  if (analog) {
    const hour = analog.hourHandLayerId
      ? layersById.get(analog.hourHandLayerId)
      : undefined;
    const minute = analog.minuteHandLayerId
      ? layersById.get(analog.minuteHandLayerId)
      : undefined;
    if (analog.hourHandLayerId && !hour) {
      issues.push({
        code: "missing-hour-hand",
        message: "시침 레이어를 찾을 수 없어요.",
        path: "analogConfig.hourHandLayerId",
      });
    }
    if (analog.minuteHandLayerId && !minute) {
      issues.push({
        code: "missing-minute-hand",
        message: "분침 레이어를 찾을 수 없어요.",
        path: "analogConfig.minuteHandLayerId",
      });
    }
    if (hour && hour.type !== "hour-hand") {
      issues.push({
        code: "invalid-hour-hand",
        message: "시침 레이어 참조가 올바르지 않아요.",
        path: "analogConfig.hourHandLayerId",
      });
    }
    if (minute && minute.type !== "minute-hand") {
      issues.push({
        code: "invalid-minute-hand",
        message: "분침 레이어 참조가 올바르지 않아요.",
        path: "analogConfig.minuteHandLayerId",
      });
    }
    if (!finite(analog.centerX) || !finite(analog.centerY)) {
      issues.push({
        code: "invalid-analog-center",
        message: "시계 중심 좌표가 올바르지 않아요.",
        path: "analogConfig",
      });
    }
  }
  if (project.type === "digital" && !project.digitalConfig) {
    issues.push({
      code: "missing-digital-config",
      message: "디지털 시계 설정이 없어요.",
      path: "digitalConfig",
    });
  }
  const digital = project.digitalConfig;
  if (digital) {
    validateDisplayTransform(
      digital.transform,
      "digitalConfig.transform",
      issues,
    );
    Object.entries(digital.slotTransforms ?? {}).forEach(
      ([slot, transform]) => {
        if (transform) {
          validateDisplayTransform(
            transform,
            `digitalConfig.slotTransforms.${slot}`,
            issues,
          );
        }
      },
    );
    Object.entries(digital.digitAssetMap).forEach(([digit, assetId]) => {
      if (assetId && !assetIds.has(assetId)) {
        issues.push({
          code: "missing-digit-asset",
          message: `${digit} 숫자 이미지 Asset을 찾을 수 없어요.`,
          path: `digitalConfig.digitAssetMap.${digit}`,
        });
      }
    });
    if (!finite(digital.digitSpacing)) {
      issues.push({
        code: "invalid-digit-spacing",
        message: "숫자 간격 값이 올바르지 않아요.",
        path: "digitalConfig.digitSpacing",
      });
    }
  }

  if (options.checkFiles) {
    project.assets.forEach((asset, index) => {
      if (!asset.originalUri || !asset.processedUri) {
        issues.push({
          code: "missing-required-asset-file",
          message: "필수 이미지 파일 경로가 없어요.",
          path: `assets[${index}]`,
        });
      }
      validateFile(asset.originalUri, `assets[${index}].originalUri`, issues);
      validateFile(asset.processedUri, `assets[${index}].processedUri`, issues);
    });
    project.layers.forEach((layer, index) => {
      if (!layer.imageUri) {
        issues.push({
          code: "missing-required-layer-file",
          message: "레이어 이미지 파일 경로가 없어요.",
          path: `layers[${index}].imageUri`,
        });
      }
      validateFile(layer.imageUri, `layers[${index}].imageUri`, issues);
    });
    validateFile(
      project.canvas.backgroundImageUri,
      "canvas.background",
      issues,
    );
    validateFile(project.previewImageUri, "preview", issues);
    Object.entries(project.digitalConfig?.digitImageMap ?? {}).forEach(
      ([digit, uri]) =>
        validateFile(uri, `digital.digitImageMap.${digit}`, issues),
    );
  }

  return issues.length === 0
    ? { valid: true, issues: [] }
    : { valid: false, issues };
};

export const assertValidClockProject = (
  project: ClockProject,
  options: { checkFiles?: boolean } = {},
) => {
  const result = validateClockProject(project, options);
  if (!result.valid) {
    throw new Error(result.issues[0]?.message ?? "프로젝트가 손상됐어요.");
  }
};
