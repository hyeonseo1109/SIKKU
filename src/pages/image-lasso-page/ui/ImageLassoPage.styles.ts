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
