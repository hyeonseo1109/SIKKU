import { StyleSheet } from "react-native";

import { spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
