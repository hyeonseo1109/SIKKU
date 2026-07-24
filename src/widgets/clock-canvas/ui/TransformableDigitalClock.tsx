/* eslint-disable react-hooks/immutability -- Reanimated shared values are intentionally mutated inside worklets. */
import { useCallback, useMemo } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";

import type {
  DigitalClockConfig,
  DigitalDisplayTransform,
} from "@/entities/digital-clock";
import { clamp, normalizeRotation } from "@/shared/lib/geometry";

import { styles } from "./ClockCanvas.styles";
import { DigitalClockView } from "./DigitalClockView";

type TransformableDigitalClockProps = {
  config: DigitalClockConfig;
  date: Date;
  scale: number;
  canvasWidth: number;
  canvasHeight: number;
  selected: boolean;
  onSelect: () => void;
  onTransformEnd: (transform: DigitalDisplayTransform) => void;
};

export const TransformableDigitalClock = ({
  canvasHeight,
  canvasWidth,
  config,
  date,
  onSelect,
  onTransformEnd,
  scale,
  selected,
}: TransformableDigitalClockProps) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const gestureScale = useSharedValue(1);
  const screenWidth = config.transform.width * scale;
  const screenHeight = config.transform.height * scale;

  const commitPan = useCallback(
    (dx: number, dy: number) => {
      onTransformEnd({
        ...config.transform,
        x: clamp(config.transform.x + dx / scale, 0, canvasWidth),
        y: clamp(config.transform.y + dy / scale, 0, canvasHeight),
      });
    },
    [canvasHeight, canvasWidth, config.transform, onTransformEnd, scale],
  );

  const commitScale = useCallback(
    (factor: number) => {
      onTransformEnd({
        ...config.transform,
        width: clamp(config.transform.width * factor, 80, canvasWidth * 1.5),
        height: clamp(config.transform.height * factor, 44, canvasHeight),
      });
    },
    [canvasHeight, canvasWidth, config.transform, onTransformEnd],
  );

  const gesture = useMemo(() => {
    const tap = Gesture.Tap().onEnd(() => runOnJS(onSelect)());
    const pan = Gesture.Pan()
      .onBegin(() => runOnJS(onSelect)())
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
      .onBegin(() => runOnJS(onSelect)())
      .onUpdate((event) => {
        gestureScale.value = event.scale;
      })
      .onEnd((event) => {
        runOnJS(commitScale)(event.scale);
        gestureScale.value = 1;
      });
    return Gesture.Simultaneous(tap, pan, pinch);
  }, [commitPan, commitScale, gestureScale, onSelect, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: gestureScale.value },
      {
        rotate: `${normalizeRotation(config.transform.rotation)}deg`,
      },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.digitalDisplay,
          {
            left: config.transform.x * scale - screenWidth / 2,
            top: config.transform.y * scale - screenHeight / 2,
            width: screenWidth,
            height: screenHeight,
          },
          selected && styles.selection,
          animatedStyle,
        ]}
      >
        <DigitalClockView config={config} date={date} />
      </Animated.View>
    </GestureDetector>
  );
};
