import { StyleSheet } from "react-native";

import { colors, radius, spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  inputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  preview: {
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 42,
    width: 42,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.textPrimary,
    flex: 1,
    fontFamily: "sans-serif",
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  swatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  swatch: {
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 2,
    height: 34,
    width: 34,
  },
  swatchSelected: {
    borderColor: colors.textPrimary,
    borderWidth: 3,
  },
});
