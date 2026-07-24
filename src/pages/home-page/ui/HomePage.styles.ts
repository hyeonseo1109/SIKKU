import { StyleSheet } from "react-native";

import { colors, radius, spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeLabel: {
    color: colors.primary,
    letterSpacing: 2,
  },
  list: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    color: "#B42318",
  },
});
