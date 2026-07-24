import { StyleSheet } from "react-native";

import { colors, radius, spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  header: {
    alignItems: "flex-start",
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  section: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
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
    gap: spacing.sm,
  },
  presetOption: {
    flex: 1,
  },
  submit: {
    marginTop: spacing.lg,
  },
});
