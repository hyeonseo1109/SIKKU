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
    bottom: spacing.md,
    elevation: 20,
    flexGrow: 0,
    flexShrink: 0,
    left: spacing.lg,
    minHeight: 230,
    position: "absolute",
    right: spacing.lg,
    zIndex: 1000,
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
    flexShrink: 0,
    height: 84,
  },
  tabs: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  panel: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
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
