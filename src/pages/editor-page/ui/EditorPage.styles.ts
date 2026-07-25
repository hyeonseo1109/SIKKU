import { StyleSheet } from "react-native";

import { colors, radius, spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerButton: {
    minWidth: 72,
  },
  headerTitle: {
    alignItems: "center",
    flex: 1,
  },
  widgetAction: {
    paddingBottom: spacing.sm,
  },
  toolbar: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    minHeight: 230,
    overflow: "hidden",
  },
  tabScroller: {
    flexGrow: 0,
  },
  tabs: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  panel: {
    gap: spacing.md,
    padding: spacing.md,
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
