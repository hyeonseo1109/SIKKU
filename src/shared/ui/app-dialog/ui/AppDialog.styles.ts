import { StyleSheet } from "react-native";

import { colors, radius, shadows, spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(12, 30, 28, 0.42)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: "rgba(255,255,255,0.94)",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    maxWidth: 420,
    padding: spacing.lg,
    width: "100%",
    ...shadows.floating,
  },
  copy: {
    gap: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "flex-end",
  },
  action: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 88,
    paddingHorizontal: spacing.md,
  },
  primaryAction: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.control,
  },
  dangerAction: {
    backgroundColor: "#FFF1F1",
    borderColor: "#F3D3D3",
  },
  pressed: {
    opacity: 0.82,
  },
  primaryLabel: {
    color: colors.white,
  },
  dangerLabel: {
    color: colors.danger,
  },
});
