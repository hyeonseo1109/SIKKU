import { StyleSheet } from "react-native";

import { colors, radius, shadows, spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  header: {
    alignItems: "flex-start",
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    gap: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surfaceMuted,
    color: colors.textPrimary,
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
