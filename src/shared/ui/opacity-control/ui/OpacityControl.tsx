import { View } from "react-native";

import { AppButton } from "@/shared/ui/app-button";
import { AppText } from "@/shared/ui/app-text";

import { styles } from "./OpacityControl.styles";

type OpacityControlProps = {
  label: string;
  onChange: (opacity: number) => void;
  value: number;
};

const clampOpacity = (opacity: number) =>
  Math.max(0, Math.min(1, Math.round(opacity * 100) / 100));

const opacityToTransparencyPercent = (opacity: number) =>
  Math.round((1 - clampOpacity(opacity)) * 100);

export const OpacityControl = ({
  label,
  onChange,
  value,
}: OpacityControlProps) => {
  const updateTransparency = (delta: number) =>
    onChange(clampOpacity(value - delta));

  return (
    <View style={styles.container}>
      <AppText variant="label">
        {label} · {opacityToTransparencyPercent(value)}%
      </AppText>
      <View style={styles.row}>
        <AppButton
          label="−10%"
          onPress={() => updateTransparency(-0.1)}
          variant="secondary"
        />
        <AppButton
          label="+10%"
          onPress={() => updateTransparency(0.1)}
          variant="secondary"
        />
        <AppButton
          label="투명"
          onPress={() => onChange(0)}
          variant="secondary"
        />
        <AppButton
          label="불투명"
          onPress={() => onChange(1)}
          variant="secondary"
        />
      </View>
    </View>
  );
};
