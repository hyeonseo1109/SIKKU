import { StyleSheet } from "react-native";

import { colors, radius, spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  editor: {
    flex: 1,
    marginBottom: spacing.md,
  },
  preview: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    marginBottom: spacing.md,
    overflow: "hidden",
    padding: spacing.md,
  },
  previewImage: {
    height: "100%",
    width: "100%",
  },
  previewActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  action: {
    flex: 1,
  },
  missing: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
});
