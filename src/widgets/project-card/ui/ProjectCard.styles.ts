import { StyleSheet } from "react-native";

import { colors, radius, shadows, spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: radius.lg,
    borderColor: colors.border,
    borderWidth: 0,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  preview: {
    height: 176,
    backgroundColor: colors.surfaceMuted,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  meta: {
    gap: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  action: {
    flex: 1,
  },
});
