import { useCallback, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { AppText } from "@/shared/ui/app-text";

import { styles } from "./PropertySliderRow.styles";

type PropertySliderRowProps = {
  label: string;
  maximum: number;
  maximumLabel?: string;
  minimum: number;
  minimumLabel?: string;
  onChange: (value: number) => void;
  step?: number;
  value: number;
  valueLabel?: (value: number) => string;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

export const PropertySliderRow = ({
  label,
  maximum,
  maximumLabel,
  minimum,
  minimumLabel,
  onChange,
  step = 1,
  value,
  valueLabel = (current) => String(current),
}: PropertySliderRowProps) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const range = Math.max(maximum - minimum, Number.EPSILON);
  const progress = clamp((value - minimum) / range, 0, 1);
  const updateFromX = useCallback(
    (x: number) => {
      if (trackWidth <= 0) return;
      const raw = minimum + clamp(x / trackWidth, 0, 1) * range;
      const stepped = minimum + Math.round((raw - minimum) / step) * step;
      onChange(clamp(stepped, minimum, maximum));
    },
    [maximum, minimum, onChange, range, step, trackWidth],
  );
  const gesture = useMemo(() => {
    const tap = Gesture.Tap()
      .runOnJS(true)
      .onEnd((event) => updateFromX(event.x));
    const pan = Gesture.Pan()
      .activeOffsetX([-6, 6])
      .failOffsetY([-8, 8])
      .runOnJS(true)
      .onStart((event) => updateFromX(event.x))
      .onUpdate((event) => updateFromX(event.x));
    return Gesture.Exclusive(pan, tap);
  }, [updateFromX]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
        <AppText tone="secondary">{valueLabel(value)}</AppText>
      </View>
      <GestureDetector gesture={gesture}>
        <View
          accessibilityLabel={label}
          accessibilityRole="adjustable"
          onLayout={(event: LayoutChangeEvent) =>
            setTrackWidth(event.nativeEvent.layout.width)
          }
          style={styles.touchTarget}
        >
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={[styles.thumb, { left: `${progress * 100}%` }]} />
        </View>
      </GestureDetector>
      {minimumLabel || maximumLabel ? (
        <View style={styles.limits}>
          <AppText tone="secondary">{minimumLabel}</AppText>
          <AppText tone="secondary">{maximumLabel}</AppText>
        </View>
      ) : null}
    </View>
  );
};
