import { useCallback, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { TextInput, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  Canvas,
  Circle,
  LinearGradient,
  Rect,
  vec,
} from "@shopify/react-native-skia";

import { AppText } from "@/shared/ui/app-text";

import { styles } from "./ColorField.styles";

const PICKER_HEIGHT = 148;
const HUE_WIDTH = 30;
const MARKER_RADIUS = 9;
const DRAG_ACTIVATION_DISTANCE = 8;
const HUE_COLORS = [
  "#FF0000",
  "#FFFF00",
  "#00FF00",
  "#00FFFF",
  "#0000FF",
  "#FF00FF",
  "#FF0000",
];

const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.max(minimum, Math.min(maximum, value));

const normalizeHex = (value: string): string | null => {
  const trimmed = value.trim().toUpperCase();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (/^#[\dA-F]{6}$/.test(withHash)) return withHash;
  if (/^#[\dA-F]{3}$/.test(withHash)) {
    return `#${withHash
      .slice(1)
      .split("")
      .map((character) => character.repeat(2))
      .join("")}`;
  }
  return null;
};

const hexToHsv = (hex: string) => {
  const normalized = normalizeHex(hex) ?? "#000000";
  const red = Number.parseInt(normalized.slice(1, 3), 16) / 255;
  const green = Number.parseInt(normalized.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(normalized.slice(5, 7), 16) / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  let hue = 0;

  if (delta > 0) {
    if (maximum === red) hue = ((green - blue) / delta) % 6;
    else if (maximum === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue = ((hue * 60 + 360) % 360) / 360;
  }

  return {
    hue,
    saturation: maximum === 0 ? 0 : delta / maximum,
    value: maximum,
  };
};

const hsvToHex = (hue: number, saturation: number, value: number) => {
  const sector = clamp(hue) * 6;
  const chroma = clamp(value) * clamp(saturation);
  const secondary = chroma * (1 - Math.abs((sector % 2) - 1));
  const offset = clamp(value) - chroma;
  const [red, green, blue] =
    sector < 1
      ? [chroma, secondary, 0]
      : sector < 2
        ? [secondary, chroma, 0]
        : sector < 3
          ? [0, chroma, secondary]
          : sector < 4
            ? [0, secondary, chroma]
            : sector < 5
              ? [secondary, 0, chroma]
              : [chroma, 0, secondary];
  const channel = (number: number) =>
    Math.round((number + offset) * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  return `#${channel(red)}${channel(green)}${channel(blue)}`;
};

type ColorFieldProps = {
  label: string;
  onChange: (color: string) => void;
  value: string;
};

const ColorHexInput = ({
  onChange,
  value,
}: Pick<ColorFieldProps, "onChange" | "value">) => {
  const [draft, setDraft] = useState(value);
  const commit = () => {
    const normalized = normalizeHex(draft);
    if (normalized) onChange(normalized);
  };

  return (
    <TextInput
      accessibilityLabel="HEX 색상"
      autoCapitalize="characters"
      autoCorrect={false}
      maxLength={7}
      onBlur={commit}
      onChangeText={(text) => {
        setDraft(text);
        const normalized = normalizeHex(text);
        if (normalized) onChange(normalized);
      }}
      onSubmitEditing={commit}
      placeholder="#RRGGBB"
      style={styles.input}
      value={draft}
    />
  );
};

export const ColorField = ({ label, onChange, value }: ColorFieldProps) => {
  const [pickerWidth, setPickerWidth] = useState(0);
  const parsedColor = hexToHsv(value);
  const [grayHue, setGrayHue] = useState(parsedColor.hue);
  const { saturation, value: brightness } = parsedColor;
  const hue = saturation > 0.001 ? parsedColor.hue : grayHue;
  const hueColor = hsvToHex(hue, 1, 1);

  const updateSaturation = useCallback(
    (x: number, y: number) => {
      if (pickerWidth <= 0) return;
      setGrayHue(hue);
      onChange(
        hsvToHex(
          hue,
          clamp(
            (x - MARKER_RADIUS) / (pickerWidth - MARKER_RADIUS * 2),
          ),
          clamp(
            1 -
              (y - MARKER_RADIUS) /
                (PICKER_HEIGHT - MARKER_RADIUS * 2),
          ),
        ),
      );
    },
    [hue, onChange, pickerWidth],
  );
  const updateHue = useCallback(
    (y: number) => {
      const nextHue = clamp(
        (y - MARKER_RADIUS) / (PICKER_HEIGHT - MARKER_RADIUS * 2),
      );
      setGrayHue(nextHue);
      onChange(hsvToHex(nextHue, saturation, brightness));
    },
    [brightness, onChange, saturation],
  );
  const saturationGesture = useMemo(() => {
    const tap = Gesture.Tap()
      .runOnJS(true)
      .onEnd((event) => updateSaturation(event.x, event.y));
    const deliberateDrag = Gesture.Pan()
      .activeOffsetX([
        -DRAG_ACTIVATION_DISTANCE,
        DRAG_ACTIVATION_DISTANCE,
      ])
      .failOffsetY([
        -DRAG_ACTIVATION_DISTANCE,
        DRAG_ACTIVATION_DISTANCE,
      ])
      .runOnJS(true)
      .onStart((event) => updateSaturation(event.x, event.y))
      .onUpdate((event) => updateSaturation(event.x, event.y));
    return Gesture.Exclusive(deliberateDrag, tap);
  }, [updateSaturation]);
  const hueGesture = useMemo(
    () =>
      Gesture.Tap()
      .runOnJS(true)
        .onEnd((event) => updateHue(event.y)),
    [updateHue],
  );
  const handleLayout = (event: LayoutChangeEvent) =>
    setPickerWidth(event.nativeEvent.layout.width);

  return (
    <View style={styles.container}>
      <AppText variant="label">{label}</AppText>
      <View style={styles.picker}>
        <GestureDetector gesture={saturationGesture}>
          <View
            accessibilityLabel={`${label} 채도와 밝기 선택`}
            onLayout={handleLayout}
            style={styles.saturationPicker}
          >
            {pickerWidth > 0 ? (
              <Canvas pointerEvents="none" style={styles.canvas}>
              <Rect height={PICKER_HEIGHT} width={pickerWidth} x={0} y={0}>
                <LinearGradient
                  colors={["#FFFFFF", hueColor]}
                  end={vec(pickerWidth, 0)}
                  start={vec(0, 0)}
                />
              </Rect>
              <Rect height={PICKER_HEIGHT} width={pickerWidth} x={0} y={0}>
                <LinearGradient
                  colors={["rgba(0,0,0,0)", "#000000"]}
                  end={vec(0, PICKER_HEIGHT)}
                  start={vec(0, 0)}
                />
              </Rect>
              <Circle
                color="#FFFFFF"
                cx={
                  MARKER_RADIUS +
                  saturation * (pickerWidth - MARKER_RADIUS * 2)
                }
                cy={
                  MARKER_RADIUS +
                  (1 - brightness) * (PICKER_HEIGHT - MARKER_RADIUS * 2)
                }
                r={MARKER_RADIUS}
                style="stroke"
                strokeWidth={3}
              />
              <Circle
                color="rgba(0,0,0,0.48)"
                cx={
                  MARKER_RADIUS +
                  saturation * (pickerWidth - MARKER_RADIUS * 2)
                }
                cy={
                  MARKER_RADIUS +
                  (1 - brightness) * (PICKER_HEIGHT - MARKER_RADIUS * 2)
                }
                r={MARKER_RADIUS + 2}
                style="stroke"
                strokeWidth={1}
              />
              </Canvas>
            ) : null}
          </View>
        </GestureDetector>
        <GestureDetector gesture={hueGesture}>
          <View
            accessibilityLabel={`${label} 색조 선택`}
            style={styles.huePicker}
          >
            {pickerWidth > 0 ? (
              <Canvas pointerEvents="none" style={styles.canvas}>
              <Rect height={PICKER_HEIGHT} width={HUE_WIDTH} x={0} y={0}>
                <LinearGradient
                  colors={HUE_COLORS}
                  end={vec(0, PICKER_HEIGHT)}
                  start={vec(0, 0)}
                />
              </Rect>
              <Circle
                color="#FFFFFF"
                cx={HUE_WIDTH / 2}
                cy={
                  MARKER_RADIUS +
                  hue * (PICKER_HEIGHT - MARKER_RADIUS * 2)
                }
                r={MARKER_RADIUS}
                style="stroke"
                strokeWidth={3}
              />
              <Circle
                color="rgba(0,0,0,0.42)"
                cx={HUE_WIDTH / 2}
                cy={
                  MARKER_RADIUS +
                  hue * (PICKER_HEIGHT - MARKER_RADIUS * 2)
                }
                r={MARKER_RADIUS + 2}
                style="stroke"
                strokeWidth={1}
              />
              </Canvas>
            ) : null}
          </View>
        </GestureDetector>
      </View>
      <View style={styles.inputRow}>
        <View style={[styles.preview, { backgroundColor: value }]} />
        <ColorHexInput key={value} onChange={onChange} value={value} />
      </View>
    </View>
  );
};
