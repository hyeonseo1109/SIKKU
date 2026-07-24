import { StyleSheet } from "react-native";

import { colors, radius, spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  preview: {
    alignSelf: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    maxHeight: 200,
    overflow: "hidden",
    width: "70%",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  marker: {
    backgroundColor: colors.accent,
    borderColor: colors.primary,
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    position: "absolute",
    width: 16,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  action: {
    flex: 1,
  },
});
