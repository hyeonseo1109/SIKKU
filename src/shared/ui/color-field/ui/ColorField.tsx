import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { AppText } from "@/shared/ui/app-text";

import { styles } from "./ColorField.styles";

const DEFAULT_SWATCHES = [
  "#FFFFFF",
  "#F3A58E",
  "#F5C96A",
  "#67B8B0",
  "#4F82C0",
  "#8D6BC1",
  "#D85F78",
  "#18312E",
  "#000000",
];

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

type ColorFieldProps = {
  label: string;
  onChange: (color: string) => void;
  swatches?: readonly string[];
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

export const ColorField = ({
  label,
  onChange,
  swatches = DEFAULT_SWATCHES,
  value,
}: ColorFieldProps) => (
  <View style={styles.container}>
    <AppText variant="label">{label}</AppText>
    <View style={styles.swatches}>
      {swatches.map((color) => (
        <Pressable
          accessibilityLabel={`${color} 색상`}
          accessibilityRole="button"
          key={color}
          onPress={() => onChange(color)}
          style={[
            styles.swatch,
            { backgroundColor: color },
            normalizeHex(value) === normalizeHex(color) &&
              styles.swatchSelected,
          ]}
        />
      ))}
    </View>
    <View style={styles.inputRow}>
      <View style={[styles.preview, { backgroundColor: value }]} />
      <ColorHexInput key={value} onChange={onChange} value={value} />
    </View>
    <AppText tone="secondary">
      HEX 값을 직접 입력하면 모든 색상을 정확하게 선택할 수 있어요.
    </AppText>
  </View>
);
