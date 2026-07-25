import { View } from "react-native";

import type { DigitalDisplayTransform } from "@/entities/digital-clock";
import { clamp } from "@/shared/lib/geometry";
import { AppButton, AppText } from "@/shared/ui";

import { styles } from "./DigitalSlotEditor.styles";

type DigitalSlotEditorProps = {
  canvasHeight: number;
  canvasWidth: number;
  label: string;
  onChange: (transform: DigitalDisplayTransform) => void;
  transform: DigitalDisplayTransform;
};

export const DigitalSlotEditor = ({
  canvasHeight,
  canvasWidth,
  label,
  onChange,
  transform,
}: DigitalSlotEditorProps) => {
  const move = (dx: number, dy: number) =>
    onChange({
      ...transform,
      x: clamp(transform.x + dx, 0, canvasWidth),
      y: clamp(transform.y + dy, 0, canvasHeight),
    });
  const resize = (factor: number) =>
    onChange({
      ...transform,
      width: clamp(transform.width * factor, 12, canvasWidth),
      height: clamp(transform.height * factor, 24, canvasHeight),
    });

  return (
    <View style={styles.container}>
      <AppText variant="label">{label} 위치</AppText>
      <AppText tone="secondary">
        캔버스에서 직접 끌거나 아래 버튼으로 세밀하게 조절하세요. X{" "}
        {Math.round(transform.x)} · Y {Math.round(transform.y)}
      </AppText>
      <View style={styles.row}>
        <AppButton label="←" onPress={() => move(-5, 0)} variant="secondary" />
        <AppButton label="↑" onPress={() => move(0, -5)} variant="secondary" />
        <AppButton label="↓" onPress={() => move(0, 5)} variant="secondary" />
        <AppButton label="→" onPress={() => move(5, 0)} variant="secondary" />
        <AppButton
          label="크기 −"
          onPress={() => resize(0.9)}
          variant="secondary"
        />
        <AppButton
          label="크기 +"
          onPress={() => resize(1.1)}
          variant="secondary"
        />
      </View>
    </View>
  );
};
