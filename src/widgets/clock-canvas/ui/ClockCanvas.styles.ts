import { StyleSheet } from "react-native";

import { colors, radius, spacing } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  stage: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  captureFrame: {
    backgroundColor: colors.transparent,
  },
  shadowFrame: {
    position: "relative",
  },
  canvas: {
    overflow: "hidden",
    position: "relative",
    borderColor: colors.border,
    borderWidth: 1,
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    elevation: 0,
    zIndex: 0,
  },
  canvasDismissArea: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    elevation: 1,
    zIndex: 1,
  },
  layer: {
    position: "absolute",
  },
  selection: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderColor: colors.accent,
    borderWidth: 3,
    borderStyle: "dashed",
  },
  lockedSelection: {
    borderColor: colors.textSecondary,
  },
  centerCap: {
    position: "absolute",
    elevation: 1000,
    zIndex: 1000,
    width: 12,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    borderColor: colors.white,
    borderWidth: 2,
  },
  digitalDisplay: {
    position: "absolute",
    elevation: 100,
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  digitalSlot: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  digitalSlotFallback: {
    color: colors.textPrimary,
    fontWeight: "700",
    textAlign: "center",
  },
  digitalRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  digitImage: {
    flex: 1,
    height: "80%",
    minWidth: 12,
  },
  digitFallback: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
