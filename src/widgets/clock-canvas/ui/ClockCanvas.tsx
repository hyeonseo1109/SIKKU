import { useCallback, useMemo, useState } from "react";
import { Image } from "expo-image";
import type { LayoutChangeEvent } from "react-native";
import { Pressable, View } from "react-native";

import { getHourAngle, getMinuteAngle } from "@/entities/analog-clock";
import type { ClockLayerTransform } from "@/entities/clock-layer";
import type { ClockProject } from "@/entities/clock-project";
import type { DigitalDisplayTransform } from "@/entities/digital-clock";
import { useCurrentTime } from "@/shared/hooks";
import { getCanvasScale, logicalToScreenPoint } from "@/shared/lib/geometry";

import { styles } from "./ClockCanvas.styles";
import { TransformableDigitalClock } from "./TransformableDigitalClock";
import { TransformableLayer } from "./TransformableLayer";

const MAX_CANVAS_HEIGHT = 390;
const CENTER_CAP_SIZE = 12;
const DIGITAL_SELECTION_ID = "__digital__";

export type ClockCanvasProps = {
  project: ClockProject;
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string | null) => void;
  onTransformLayer: (layerId: string, transform: ClockLayerTransform) => void;
  onTransformDigital: (transform: DigitalDisplayTransform) => void;
};

export const ClockCanvas = ({
  onSelectLayer,
  onTransformDigital,
  onTransformLayer,
  project,
  selectedLayerId,
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

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setAvailableWidth(event.nativeEvent.layout.width);
  }, []);

  const hourAngle = getHourAngle(
    previewDate.getHours(),
    previewDate.getMinutes(),
    previewDate.getSeconds(),
  );
  const minuteAngle = getMinuteAngle(
    previewDate.getMinutes(),
    previewDate.getSeconds(),
  );
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
        <Pressable
          accessibilityLabel="시계 캔버스"
          onPress={() => onSelectLayer(null)}
          style={[
            styles.canvas,
            {
              width: screenWidth,
              height: screenHeight,
              backgroundColor: project.canvas.backgroundColor,
            },
          ]}
        >
          {project.canvas.backgroundImageUri ? (
            <Image
              contentFit="cover"
              source={project.canvas.backgroundImageUri}
              style={styles.backgroundImage}
            />
          ) : null}

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
              onSelect={() => onSelectLayer(DIGITAL_SELECTION_ID)}
              onTransformEnd={onTransformDigital}
              scale={scale}
              selected={selectedLayerId === DIGITAL_SELECTION_ID}
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
        </Pressable>
      ) : null}
    </View>
  );
};

export { DIGITAL_SELECTION_ID };
