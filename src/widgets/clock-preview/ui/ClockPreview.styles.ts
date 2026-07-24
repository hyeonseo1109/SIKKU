import { StyleSheet } from "react-native";

import { colors, radius, shadows, sizes, spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  container: {
    minHeight: sizes.editorCanvas,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadows.card,
  },
  clock: {
    width: 164,
    height: 164,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.primary,
    borderWidth: 6,
  },
  hourHand: {
    position: "absolute",
    width: 6,
    height: 48,
    bottom: 79,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    transform: [{ rotate: "35deg" }],
    transformOrigin: "bottom",
  },
  minuteHand: {
    position: "absolute",
    width: 4,
    height: 64,
    bottom: 79,
    borderRadius: radius.full,
    backgroundColor: colors.textSecondary,
    transform: [{ rotate: "125deg" }],
    transformOrigin: "bottom",
  },
  centerPin: {
    width: 14,
    height: 14,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  digitalClock: {
    minWidth: 190,
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
});
