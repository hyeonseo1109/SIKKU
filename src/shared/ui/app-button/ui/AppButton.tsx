import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { Pressable, View } from "react-native";

import { AppText } from "@/shared/ui/app-text";

import { styles } from "./AppButton.styles";

export type AppButtonProps = {
  accessibilityLabel?: string;
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  onPress: () => void;
  pressedStyle?: StyleProp<ViewStyle>;
  variant?: "primary" | "secondary";
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export const AppButton = ({
  accessibilityLabel,
  disabled = false,
  label,
  labelStyle,
  onPress,
  pressedStyle,
  selected = false,
  style,
  variant = "primary",
}: AppButtonProps) => {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        selected && styles.selected,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
        pressed && !disabled && pressedStyle,
      ]}
    >
      <View>
        <AppText
          variant="label"
          style={[
            variant === "primary" || selected
              ? styles.primaryLabel
              : styles.secondaryLabel,
            labelStyle,
          ]}
        >
          {label}
        </AppText>
      </View>
    </Pressable>
  );
};
