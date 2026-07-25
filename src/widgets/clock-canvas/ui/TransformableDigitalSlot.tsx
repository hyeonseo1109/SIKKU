/* eslint-disable react-hooks/immutability -- Reanimated shared values are intentionally mutated inside worklets. */
import { useCallback, useMemo } from "react";
import { Image } from "expo-image";
import { Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";

import type {
  DigitalDisplayTransform,
  DigitalSlotId,
} from "@/entities/digital-clock";
import { clamp, normalizeRotation } from "@/shared/lib/geometry";

import { styles } from "./ClockCanvas.styles";

type TransformableDigitalSlotProps = {
  canvasHeight: number;
  canvasWidth: number;
  character: string;
  compact?: boolean;
  imageUri?: string;
  onSelect: (slotId: DigitalSlotId) => void;
  onTransformEnd: (
    slotId: DigitalSlotId,
    transform: DigitalDisplayTransform,
  ) => void;
  scale: number;
  selected: boolean;
  slotId: DigitalSlotId;
  transform: DigitalDisplayTransform;
};

export const TransformableDigitalSlot = ({
  canvasHeight,
  canvasWidth,
  character,
  compact = false,
  imageUri,
  onSelect,
  onTransformEnd,
  scale,
  selected,
  slotId,
  transform,
}: TransformableDigitalSlotProps) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const gestureScale = useSharedValue(1);
  const gestureRotation = useSharedValue(0);
  const screenWidth = transform.width * scale;
  const screenHeight = transform.height * scale;

  const commitPan = useCallback(
    (dx: number, dy: number) => {
      onTransformEnd(slotId, {
        ...transform,
        x: clamp(transform.x + dx / scale, 0, canvasWidth),
        y: clamp(transform.y + dy / scale, 0, canvasHeight),
      });
    },
    [canvasHeight, canvasWidth, onTransformEnd, scale, slotId, transform],
  );

  const commitScale = useCallback(
    (factor: number) => {
      onTransformEnd(slotId, {
        ...transform,
        width: clamp(transform.width * factor, 12, canvasWidth),
        height: clamp(transform.height * factor, 24, canvasHeight),
      });
    },
    [canvasHeight, canvasWidth, onTransformEnd, slotId, transform],
  );

  const commitRotation = useCallback(
    (radians: number) => {
      onTransformEnd(slotId, {
        ...transform,
        rotation: normalizeRotation(
          transform.rotation + (radians * 180) / Math.PI,
        ),
      });
    },
    [onTransformEnd, slotId, transform],
  );

  const gesture = useMemo(() => {
    const tap = Gesture.Tap().onEnd(() => runOnJS(onSelect)(slotId));
    const pan = Gesture.Pan()
      .minDistance(1)
      .onBegin(() => runOnJS(onSelect)(slotId))
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
      .onBegin(() => runOnJS(onSelect)(slotId))
      .onUpdate((event) => {
        gestureScale.value = event.scale;
      })
      .onEnd((event) => {
        runOnJS(commitScale)(event.scale);
        gestureScale.value = 1;
      });
    const rotation = Gesture.Rotation()
      .onBegin(() => runOnJS(onSelect)(slotId))
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
    onSelect,
    slotId,
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
          transform.rotation + (gestureRotation.value * 180) / Math.PI
        }deg`,
      },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessibilityLabel={`${slotId} 숫자 자리`}
        style={[
          styles.digitalSlot,
          {
            height: screenHeight,
            left: transform.x * scale - screenWidth / 2,
            top: transform.y * scale - screenHeight / 2,
            width: screenWidth,
            zIndex: selected ? 102 : 100,
          },
          animatedStyle,
        ]}
      >
        {imageUri ? (
          <View pointerEvents="none" style={styles.digitalSlotContent}>
            <Image
              contentFit="fill"
              source={imageUri}
              style={styles.digitalSlotImage}
            />
          </View>
        ) : (
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[
              styles.digitalSlotFallback,
              { fontSize: screenHeight * (compact ? 0.44 : 0.8) },
            ]}
          >
            {character}
          </Text>
        )}
        {selected ? (
          <Animated.View pointerEvents="none" style={styles.selection} />
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
};
