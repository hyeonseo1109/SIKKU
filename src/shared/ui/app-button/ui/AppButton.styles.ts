import { StyleSheet } from "react-native";

import { colors, radius, shadows, sizes, spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  base: {
    minHeight: sizes.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    transform: [{ translateY: 0 }],
  },
  primary: {
    backgroundColor: colors.primary,
    ...shadows.control,
  },
  secondary: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.control,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ translateY: 1 }],
  },
  disabled: {
    opacity: 0.45,
  },
  primaryLabel: {
    color: colors.white,
  },
  secondaryLabel: {
    color: colors.textPrimary,
  },
});
