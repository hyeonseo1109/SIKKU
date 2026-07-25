import { StyleSheet } from "react-native";

import { colors, radius, shadows, sizes, spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  base: {
    minHeight: sizes.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  primary: {
    backgroundColor: colors.primary,
    ...shadows.card,
  },
  secondary: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.card,
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
