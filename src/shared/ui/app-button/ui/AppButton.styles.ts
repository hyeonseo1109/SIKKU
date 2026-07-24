import { StyleSheet } from "react-native";

import { colors, radius, sizes, spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  base: {
    minHeight: sizes.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.82,
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
