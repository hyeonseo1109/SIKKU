import { View } from "react-native";

import type { ClockType } from "@/entities/clock-project";
import { AppText } from "@/shared/ui";

import { styles } from "./ClockPreview.styles";

export type ClockPreviewProps = {
  type: ClockType;
};

export const ClockPreview = ({ type }: ClockPreviewProps) => {
  return (
    <View style={styles.container}>
      {type === "analog" ? (
        <View accessibilityLabel="아날로그 시계 미리보기" style={styles.clock}>
          <View style={styles.hourHand} />
          <View style={styles.minuteHand} />
          <View style={styles.centerPin} />
        </View>
      ) : (
        <View
          accessibilityLabel="디지털 시계 미리보기"
          style={styles.digitalClock}
        >
          <AppText variant="title">10:09</AppText>
        </View>
      )}
      <AppText tone="secondary" variant="label">
        {type === "analog" ? "아날로그 시계" : "디지털 시계"}
      </AppText>
    </View>
  );
};
