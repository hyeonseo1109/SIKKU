import { StyleSheet } from "react-native";

import { colors, typography } from "@/shared/config/theme";

export const styles = StyleSheet.create({
  base: {
    color: colors.textPrimary,
  },
  body: typography.body,
  label: typography.label,
  title: typography.title,
  heading: typography.heading,
  primary: {
    color: colors.textPrimary,
  },
  secondary: {
    color: colors.textSecondary,
  },
});
