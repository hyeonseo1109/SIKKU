import { memo } from "react";
import { Image } from "expo-image";
import { Text, View } from "react-native";

import {
  formatTime,
  type DigitalClockConfig,
  type DigitValue,
} from "@/entities/digital-clock";

import { styles } from "./ClockCanvas.styles";

type DigitalClockViewProps = {
  config: DigitalClockConfig;
  date: Date;
};

const toDigitValue = (character: string): DigitValue =>
  character === ":" ? "colon" : (character as DigitValue);

const DigitalClockViewComponent = ({ config, date }: DigitalClockViewProps) => {
  const value = formatTime({
    date,
    format: config.format,
    colonVisible: config.colonVisible,
  });

  return (
    <View style={[styles.digitalRow, { gap: config.digitSpacing }]}>
      {[...value].map((character, index) => {
        const digit = toDigitValue(character);
        const uri = config.digitImageMap[digit];
        return uri ? (
          <Image
            accessibilityLabel={`${digit} 숫자 이미지`}
            contentFit="contain"
            key={`${character}-${index}`}
            source={uri}
            style={styles.digitImage}
          />
        ) : (
          <Text key={`${character}-${index}`} style={styles.digitFallback}>
            {character}
          </Text>
        );
      })}
    </View>
  );
};

export const DigitalClockView = memo(DigitalClockViewComponent);
