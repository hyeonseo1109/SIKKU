import { StyleSheet } from "react-native";

import { colors, radius, shadows, spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(17, 35, 32, 0.38)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    maxWidth: 440,
    padding: spacing.lg,
    width: "100%",
    ...shadows.card,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  closeButtonPressed: { opacity: 0.6 },
  closeLabel: { fontSize: 23, lineHeight: 25 },
  header: { alignItems: "center", flexDirection: "row", gap: spacing.md },
  helpButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  helpButtonPressed: { opacity: 0.6 },
  helpLabel: { fontSize: 14, lineHeight: 17 },
  title: { flex: 1 },
});
