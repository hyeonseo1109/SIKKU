import { StyleSheet } from "react-native";

import { spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
});
