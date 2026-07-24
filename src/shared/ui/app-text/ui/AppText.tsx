import type { ComponentProps } from "react";
import { Text } from "react-native";

import { styles } from "./AppText.styles";

type TextProps = ComponentProps<typeof Text>;

export type AppTextProps = TextProps & {
  variant?: "body" | "label" | "title" | "heading";
  tone?: "primary" | "secondary";
};

export const AppText = ({
  style,
  tone = "primary",
  variant = "body",
  ...props
}: AppTextProps) => {
  return (
    <Text
      {...props}
      style={[styles.base, styles[variant], styles[tone], style]}
    />
  );
};
