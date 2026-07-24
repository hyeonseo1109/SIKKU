import { Pressable, View } from "react-native";

import { AppText } from "@/shared/ui/app-text";

import { styles } from "./AppButton.styles";

export type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  selected?: boolean;
  disabled?: boolean;
};

export const AppButton = ({
  disabled = false,
  label,
  onPress,
  selected = false,
  variant = "primary",
}: AppButtonProps) => {
  return (
    <Pressable
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
      ]}
    >
      <View>
        <AppText
          variant="label"
          style={
            variant === "primary" || selected
              ? styles.primaryLabel
              : styles.secondaryLabel
          }
        >
          {label}
        </AppText>
      </View>
    </Pressable>
  );
};
