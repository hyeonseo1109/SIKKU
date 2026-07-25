import type { RefObject } from "react";
import { useCallback, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Image, Pressable, View } from "react-native";

import { getHourAngle, getMinuteAngle } from "@/entities/analog-clock";
import type { ClockLayerTransform } from "@/entities/clock-layer";
import type { ClockProject } from "@/entities/clock-project";
import {
  resolveCanvasCornerRadius,
  resolveCanvasShadow,
} from "@/entities/clock-project";
import {
  DIGITAL_SLOT_IDS,
  type DigitalDisplayTransform,
  type DigitalSlotId,
} from "@/entities/digital-clock";
import { useCurrentTime } from "@/shared/hooks";
import { getCanvasScale, logicalToScreenPoint } from "@/shared/lib/geometry";

import { styles } from "./ClockCanvas.styles";
import { TransformableDigitalClock } from "./TransformableDigitalClock";
import { TransformableLayer } from "./TransformableLayer";

const MAX_CANVAS_HEIGHT = 390;
const CENTER_CAP_SIZE = 12;
const DIGITAL_SELECTION_PREFIX = "__digital_slot__:";

const withOpacity = (color: string, opacity: number): string => {
  const normalized = color.replace("#", "");
  if (!/^[\dA-Fa-f]{6}$/.test(normalized)) return color;
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
};

const getDigitalSelectionId = (slotId: DigitalSlotId) =>
  `${DIGITAL_SELECTION_PREFIX}${slotId}`;

const getSelectedDigitalSlotId = (
  selectedLayerId: string | null,
): DigitalSlotId | null => {
  if (!selectedLayerId?.startsWith(DIGITAL_SELECTION_PREFIX)) return null;
  const slotId = selectedLayerId.slice(DIGITAL_SELECTION_PREFIX.length);
  return DIGITAL_SLOT_IDS.includes(slotId as DigitalSlotId)
    ? (slotId as DigitalSlotId)
    : null;
};

export type ClockCanvasProps = {
  project: ClockProject;
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string | null) => void;
  onTransformLayer: (layerId: string, transform: ClockLayerTransform) => void;
  onTransformDigital: (
    slotId: DigitalSlotId,
    transform: DigitalDisplayTransform,
  ) => void;
  snapshotRef?: RefObject<View | null>;
};

export const ClockCanvas = ({
  onSelectLayer,
  onTransformDigital,
  onTransformLayer,
  project,
  selectedLayerId,
  snapshotRef,
}: ClockCanvasProps) => {
  const [availableWidth, setAvailableWidth] = useState(0);
  const isCurrentTime = project.analogConfig?.previewMode !== "custom";
  const liveDate = useCurrentTime(isCurrentTime);
  const previewDate = useMemo(() => {
    if (
      project.type === "analog" &&
      project.analogConfig?.previewMode === "custom"
    ) {
      const date = new Date();
      date.setHours(
        project.analogConfig.previewHour,
        project.analogConfig.previewMinute,
        0,
        0,
      );
      return date;
    }
    return liveDate;
  }, [liveDate, project.analogConfig, project.type]);

  const scale = getCanvasScale(
    project.canvas.width,
    project.canvas.height,
    availableWidth,
    MAX_CANVAS_HEIGHT,
  );
  const screenWidth = project.canvas.width * scale;
  const screenHeight = project.canvas.height * scale;
  const cornerRadius = resolveCanvasCornerRadius(project.canvas) * scale;
  const canvasShadow = resolveCanvasShadow(project.canvas);
  const shadowEnabled = canvasShadow.enabled;
  const shadowBlur = canvasShadow.blur * scale;
  const shadowOffsetX = canvasShadow.offsetX * scale;
  const shadowOffsetY = canvasShadow.offsetY * scale;
  const shadowPadding = shadowEnabled
    ? Math.ceil(
        shadowBlur + Math.max(Math.abs(shadowOffsetX), Math.abs(shadowOffsetY)),
      )
    : 0;

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setAvailableWidth(event.nativeEvent.layout.width);
  }, []);
  const handleDigitalSelect = useCallback(
    (slotId: DigitalSlotId) => onSelectLayer(getDigitalSelectionId(slotId)),
    [onSelectLayer],
  );

  const hourAngle = getHourAngle(
    previewDate.getHours(),
    previewDate.getMinutes(),
    previewDate.getSeconds(),
  );
  const minuteAngle = getMinuteAngle(
    previewDate.getMinutes(),
    previewDate.getSeconds(),
  );
  const selectedDigitalSlotId = getSelectedDigitalSlotId(selectedLayerId);
  const analogCenter = project.analogConfig
    ? logicalToScreenPoint(
        {
          x: project.analogConfig.centerX,
          y: project.analogConfig.centerY,
        },
        scale,
      )
    : null;

  return (
    <View onLayout={handleLayout} style={styles.stage}>
      {availableWidth > 0 ? (
        <View
          collapsable={false}
          ref={snapshotRef}
          style={[styles.captureFrame, { padding: shadowPadding }]}
        >
          <View
            style={[
              styles.shadowFrame,
              {
                backgroundColor: project.canvas.backgroundColor,
                borderRadius: cornerRadius,
                boxShadow: shadowEnabled
                  ? [
                      {
                        blurRadius: shadowBlur,
                        color: withOpacity(
                          canvasShadow.color,
                          canvasShadow.opacity,
                        ),
                        offsetX: shadowOffsetX,
                        offsetY: shadowOffsetY,
                      },
                    ]
                  : undefined,
                height: screenHeight,
                width: screenWidth,
              },
            ]}
          >
            <View
              style={[
                styles.canvas,
                {
                  width: screenWidth,
                  height: screenHeight,
                  borderRadius: cornerRadius,
                  backgroundColor: project.canvas.backgroundColor,
                },
              ]}
            >
              {project.canvas.backgroundImageUri ? (
                <Image
                  resizeMode="cover"
                  source={{ uri: project.canvas.backgroundImageUri }}
                  style={[
                    styles.backgroundImage,
                    { borderRadius: cornerRadius },
                  ]}
                />
              ) : null}

              <Pressable
                accessibilityLabel="시계 캔버스"
                onPress={() => onSelectLayer(null)}
                style={styles.canvasDismissArea}
              />

              {project.layers
                .filter((layer) => layer.visible)
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((layer) => {
                  const isHand =
                    layer.type === "hour-hand" || layer.type === "minute-hand";
                  const renderedLayer =
                    isHand && project.analogConfig
                      ? {
                          ...layer,
                          transform: {
                            ...layer.transform,
                            x: project.analogConfig.centerX,
                            y: project.analogConfig.centerY,
                          },
                        }
                      : layer;

                  return (
                    <TransformableLayer
                      canvasHeight={project.canvas.height}
                      canvasWidth={project.canvas.width}
                      key={layer.id}
                      layer={renderedLayer}
                      onSelect={onSelectLayer}
                      onTransformEnd={onTransformLayer}
                      scale={scale}
                      selected={selectedLayerId === layer.id}
                      timeRotation={
                        layer.type === "hour-hand"
                          ? hourAngle
                          : layer.type === "minute-hand"
                            ? minuteAngle
                            : 0
                      }
                    />
                  );
                })}

              {project.type === "digital" && project.digitalConfig ? (
                <TransformableDigitalClock
                  canvasHeight={project.canvas.height}
                  canvasWidth={project.canvas.width}
                  config={project.digitalConfig}
                  date={previewDate}
                  onSelect={handleDigitalSelect}
                  onTransformEnd={onTransformDigital}
                  scale={scale}
                  selectedSlotId={selectedDigitalSlotId}
                />
              ) : null}

              {project.type === "analog" &&
              project.analogConfig?.showCenterCap &&
              analogCenter ? (
                <View
                  pointerEvents="none"
                  style={[
                    styles.centerCap,
                    {
                      left: analogCenter.x - CENTER_CAP_SIZE / 2,
                      top: analogCenter.y - CENTER_CAP_SIZE / 2,
                    },
                  ]}
                />
              ) : null}
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
};

export { getDigitalSelectionId, getSelectedDigitalSlotId };
