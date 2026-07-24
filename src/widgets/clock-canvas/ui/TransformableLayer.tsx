/* eslint-disable react-hooks/immutability -- Reanimated shared values are intentionally mutated inside worklets. */
import { memo, useCallback, useEffect, useMemo } from "react";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";

import type { ClockLayer, ClockLayerTransform } from "@/entities/clock-layer";
import { clampLayerToCanvas, normalizeRotation } from "@/shared/lib/geometry";

import { styles } from "./ClockCanvas.styles";

type TransformableLayerProps = {
  layer: ClockLayer;
  canvasWidth: number;
  canvasHeight: number;
  scale: number;
  selected: boolean;
  timeRotation: number;
  onSelect: (layerId: string) => void;
  onTransformEnd: (layerId: string, transform: ClockLayerTransform) => void;
};

const TransformableLayerComponent = ({
  canvasHeight,
  canvasWidth,
  layer,
  onSelect,
  onTransformEnd,
  scale,
  selected,
  timeRotation,
}: TransformableLayerProps) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const gestureScale = useSharedValue(1);
  const gestureRotation = useSharedValue(0);
  const screenWidth = layer.transform.width * scale;
  const screenHeight = layer.transform.height * scale;
  const isHand = layer.type === "hour-hand" || layer.type === "minute-hand";

  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    gestureScale.value = 1;
    gestureRotation.value = 0;
  }, [gestureRotation, gestureScale, layer.transform, translateX, translateY]);

  const commitPan = useCallback(
    (dx: number, dy: number) => {
      onTransformEnd(
        layer.id,
        clampLayerToCanvas(
          {
            ...layer.transform,
            x: layer.transform.x + dx / scale,
            y: layer.transform.y + dy / scale,
          },
          canvasWidth,
          canvasHeight,
        ),
      );
    },
    [
      canvasHeight,
      canvasWidth,
      layer.id,
      layer.transform,
      onTransformEnd,
      scale,
    ],
  );

  const commitScale = useCallback(
    (factor: number) => {
      onTransformEnd(
        layer.id,
        clampLayerToCanvas(
          {
            ...layer.transform,
            width: layer.transform.width * factor,
            height: layer.transform.height * factor,
          },
          canvasWidth,
          canvasHeight,
        ),
      );
    },
    [canvasHeight, canvasWidth, layer.id, layer.transform, onTransformEnd],
  );

  const commitRotation = useCallback(
    (radians: number) => {
      onTransformEnd(layer.id, {
        ...layer.transform,
        rotation: normalizeRotation(
          layer.transform.rotation + (radians * 180) / Math.PI,
        ),
      });
    },
    [layer.id, layer.transform, onTransformEnd],
  );

  const gesture = useMemo(() => {
    const tap = Gesture.Tap().onEnd(() => {
      runOnJS(onSelect)(layer.id);
    });

    const pan = Gesture.Pan()
      .enabled(!layer.locked)
      .onBegin(() => {
        runOnJS(onSelect)(layer.id);
      })
      .onUpdate((event) => {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      })
      .onEnd((event) => {
        runOnJS(commitPan)(event.translationX, event.translationY);
        translateX.value = 0;
        translateY.value = 0;
      });

    const pinch = Gesture.Pinch()
      .enabled(!layer.locked)
      .onBegin(() => {
        runOnJS(onSelect)(layer.id);
      })
      .onUpdate((event) => {
        gestureScale.value = event.scale;
      })
      .onEnd((event) => {
        runOnJS(commitScale)(event.scale);
        gestureScale.value = 1;
      });

    const rotation = Gesture.Rotation()
      .enabled(!layer.locked)
      .onBegin(() => {
        runOnJS(onSelect)(layer.id);
      })
      .onUpdate((event) => {
        gestureRotation.value = event.rotation;
      })
      .onEnd((event) => {
        runOnJS(commitRotation)(event.rotation);
        gestureRotation.value = 0;
      });

    return Gesture.Simultaneous(tap, pan, pinch, rotation);
  }, [
    commitPan,
    commitRotation,
    commitScale,
    gestureRotation,
    gestureScale,
    layer.id,
    layer.locked,
    onSelect,
    translateX,
    translateY,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: gestureScale.value },
      {
        rotate: `${
          layer.transform.rotation +
          timeRotation +
          (gestureRotation.value * 180) / Math.PI
        }deg`,
      },
    ],
  }));

  const left = isHand
    ? layer.transform.x * scale - layer.transform.anchorX * screenWidth
    : layer.transform.x * scale - screenWidth / 2;
  const top = isHand
    ? layer.transform.y * scale - layer.transform.anchorY * screenHeight
    : layer.transform.y * scale - screenHeight / 2;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.layer,
          {
            left,
            top,
            width: screenWidth,
            height: screenHeight,
            opacity: layer.opacity,
            zIndex: layer.zIndex + 2,
            transformOrigin: isHand
              ? [
                  layer.transform.anchorX * screenWidth,
                  layer.transform.anchorY * screenHeight,
                  0,
                ]
              : [screenWidth / 2, screenHeight / 2, 0],
          },
          animatedStyle,
        ]}
      >
        <Image
          accessibilityLabel={layer.name}
          contentFit="fill"
          source={layer.imageUri}
          style={StyleSheet.absoluteFill}
        />
        {selected ? (
          <View
            pointerEvents="none"
            style={[styles.selection, layer.locked && styles.lockedSelection]}
          />
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
};

export const TransformableLayer = memo(TransformableLayerComponent);
