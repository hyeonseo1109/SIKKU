import { StyleSheet } from "react-native";

import { spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    marginBottom: spacing.md,
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
