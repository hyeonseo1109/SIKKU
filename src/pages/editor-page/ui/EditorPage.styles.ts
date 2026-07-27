import { StyleSheet } from "react-native";

import { colors, radius, shadows, spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderColor: "rgba(255,255,255,0.78)",
    borderWidth: 1,
    ...shadows.card,
  },
  headerButton: {
    minWidth: 72,
  },
  headerTitle: {
    alignItems: "center",
    flex: 1,
  },
  widgetAction: {
    paddingVertical: spacing.sm,
  },
  toolbar: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 230,
    borderColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    ...shadows.card,
  },
  resizeHandle: {
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 54,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  resizeHandleBar: {
    backgroundColor: colors.border,
    borderRadius: radius.full,
    height: 5,
    width: 64,
  },
  tabScroller: {
    flexGrow: 0,
  },
  tabs: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  panel: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  controlGroup: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
  },
});
