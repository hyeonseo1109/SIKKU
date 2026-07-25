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
    flex: 1,
    minHeight: 230,
    overflow: "hidden",
    ...shadows.card,
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
