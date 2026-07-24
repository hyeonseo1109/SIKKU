import { StyleSheet } from "react-native";

import { spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  header: {
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  section: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
  },
});
