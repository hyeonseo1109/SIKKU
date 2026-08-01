import { StyleSheet } from "react-native";

import { colors, radius, spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  fill: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: "100%",
  },
  header: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  label: { flex: 1 },
  limits: { flexDirection: "row", justifyContent: "space-between" },
  thumb: {
    backgroundColor: colors.primary,
    borderColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 3,
    height: 22,
    marginLeft: -11,
    position: "absolute",
    top: 7,
    width: 22,
  },
  touchTarget: { height: 36, justifyContent: "center" },
  track: {
    backgroundColor: colors.border,
    borderRadius: radius.full,
    height: 6,
    overflow: "hidden",
  },
});
