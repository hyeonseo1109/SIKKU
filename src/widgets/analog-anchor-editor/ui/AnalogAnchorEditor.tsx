import { useCallback, useState } from "react";
import { Image } from "expo-image";
import type { GestureResponderEvent, LayoutChangeEvent } from "react-native";
import { View } from "react-native";

import type { ClockLayer } from "@/entities/clock-layer";
import { clamp } from "@/shared/lib/geometry";
import { AppButton, AppText } from "@/shared/ui";

import { styles } from "./AnalogAnchorEditor.styles";

type Props = {
  layer: ClockLayer;
  onCommit: (anchorX: number, anchorY: number) => void;
};

export const AnalogAnchorEditor = ({ layer, onCommit }: Props) => {
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [anchor, setAnchor] = useState({
    x: layer.transform.anchorX,
    y: layer.transform.anchorY,
  });

  const updateFromEvent = useCallback(
    (event: GestureResponderEvent) => {
      const x = clamp(event.nativeEvent.locationX / size.width, 0, 1);
      const y = clamp(event.nativeEvent.locationY / size.height, 0, 1);
      setAnchor({ x, y });
      return { x, y };
    },
    [size],
  );

  const setPreset = (x: number, y: number) => {
    setAnchor({ x, y });
    onCommit(x, y);
  };

  return (
    <View style={styles.container}>
      <AppText variant="label">회전 기준점</AppText>
      <AppText tone="secondary">
        이미지 위 점을 드래그해 시곗바늘 축을 맞추세요.
      </AppText>
      <View
        onLayout={(event: LayoutChangeEvent) =>
          setSize({
            width: event.nativeEvent.layout.width,
            height: event.nativeEvent.layout.height,
          })
        }
        onMoveShouldSetResponder={() => true}
        onResponderGrant={updateFromEvent}
        onResponderMove={updateFromEvent}
        onResponderRelease={(event) => {
          const point = updateFromEvent(event);
          onCommit(point.x, point.y);
        }}
        onStartShouldSetResponder={() => true}
        style={[
          styles.preview,
          {
            aspectRatio:
              layer.transform.width / Math.max(layer.transform.height, 1),
          },
        ]}
      >
        <Image
          contentFit="contain"
          pointerEvents="none"
          source={layer.imageUri}
          style={styles.image}
        />
        <View
          pointerEvents="none"
          style={[
            styles.marker,
            {
              left: anchor.x * size.width - 8,
              top: anchor.y * size.height - 8,
            },
          ]}
        />
      </View>
      <View style={styles.row}>
        <View style={styles.action}>
          <AppButton
            label="아래 중앙"
            onPress={() => setPreset(0.5, 1)}
            variant="secondary"
          />
        </View>
        <View style={styles.action}>
          <AppButton
            label="정중앙"
            onPress={() => setPreset(0.5, 0.5)}
            variant="secondary"
          />
        </View>
      </View>
    </View>
  );
};
