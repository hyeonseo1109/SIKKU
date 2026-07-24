import { StyleSheet } from "react-native";

import { colors, radius } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 360,
    overflow: "hidden",
    borderRadius: radius.md,
    backgroundColor: colors.textPrimary,
  },
  canvas: {
    flex: 1,
  },
});
