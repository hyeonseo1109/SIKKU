import { View } from "react-native";

import { AppButton } from "@/shared/ui/app-button";
import { AppText } from "@/shared/ui/app-text";

import { styles } from "./OpacityControl.styles";

type OpacityControlProps = {
  label: string;
  onChange: (opacity: number) => void;
  value: number;
};

export const OpacityControl = ({
  label,
  onChange,
  value,
}: OpacityControlProps) => {
  const update = (delta: number) =>
    onChange(Math.max(0, Math.min(1, Math.round((value + delta) * 100) / 100)));

  return (
    <View style={styles.container}>
      <AppText variant="label">
        {label} · {Math.round(value * 100)}%
      </AppText>
      <View style={styles.row}>
        <AppButton
          label="−10%"
          onPress={() => update(-0.1)}
          variant="secondary"
        />
        <AppButton
          label="+10%"
          onPress={() => update(0.1)}
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
