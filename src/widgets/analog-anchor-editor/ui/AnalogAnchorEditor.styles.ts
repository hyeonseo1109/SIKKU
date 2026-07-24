import { StyleSheet } from "react-native";

import { colors, radius, spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  previewFrame: {
    alignSelf: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    width: "88%",
  },
  preview: {
    alignSelf: "center",
    overflow: "visible",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  marker: {
    borderRadius: 9,
    borderWidth: 2,
    height: 18,
    position: "absolute",
    width: 18,
  },
  pivotMarker: {
    backgroundColor: colors.accent,
    borderColor: colors.primary,
  },
  tipMarker: {
    backgroundColor: "#55C4BF",
    borderColor: "#157E7A",
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  action: {
    flex: 1,
  },
});
