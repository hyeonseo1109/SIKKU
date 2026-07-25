import { StyleSheet } from "react-native";

import { colors, radius, spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  layerList: {
    gap: spacing.sm,
  },
  selectedCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.md,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  orderActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  orderAction: {
    flex: 1,
  },
});
