import { StyleSheet } from "react-native";

import {
  colors,
  fontFamilies,
  radius,
  shadows,
  spacing,
} from "@/shared/config/theme";

export const styles = StyleSheet.create({
  header: {
    alignItems: "flex-start",
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    gap: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderColor: "rgba(255,255,255,0.82)",
    borderWidth: 1,
    ...shadows.card,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    ...shadows.card,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surfaceMuted,
    color: colors.textPrimary,
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    paddingHorizontal: spacing.md,
  },
  options: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  option: {
    flex: 1,
  },
  presetOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  presetOption: {
    flex: 1,
  },
  submit: {
    marginTop: spacing.lg,
  },
});
