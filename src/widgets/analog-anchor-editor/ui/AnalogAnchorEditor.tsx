import { useRef, useState } from "react";
import { Image } from "expo-image";
import type { GestureResponderEvent, LayoutChangeEvent } from "react-native";
import { View } from "react-native";

import type { ClockLayer } from "@/entities/clock-layer";
import { spacing } from "@/shared/config/theme";
import { clamp } from "@/shared/lib/geometry";
import { AppButton, AppText } from "@/shared/ui";

import { styles } from "./AnalogAnchorEditor.styles";

type HandEndpoints = {
  pivotX: number;
  pivotY: number;
  tipX: number;
  tipY: number;
};

type Props = {
  layer: ClockLayer;
  onCommit: (endpoints: HandEndpoints) => void;
  onDragStateChange?: (dragging: boolean) => void;
  onResize: (factor: number, axis: "both" | "length" | "thickness") => void;
};

type Marker = "pivot" | "tip";

export const AnalogAnchorEditor = ({
  layer,
  onCommit,
  onDragStateChange,
  onResize,
}: Props) => {
  const [frameWidth, setFrameWidth] = useState(280);
  const [pivot, setPivot] = useState({
    x: layer.transform.anchorX,
    y: layer.transform.anchorY,
  });
  const [tip, setTip] = useState({
    x: layer.transform.tipX ?? 0.5,
    y: layer.transform.tipY ?? 0,
  });
  const pivotRef = useRef(pivot);
  const tipRef = useRef(tip);
  const activeMarker = useRef<Marker>("pivot");
  const aspectRatio =
    layer.transform.width / Math.max(layer.transform.height, 1);
  const availableWidth = Math.max(frameWidth - spacing.lg * 2 - 2, 1);
  const previewWidth = Math.min(availableWidth, 240 * aspectRatio);
  const previewHeight = previewWidth / aspectRatio;

  const pointFromEvent = (event: GestureResponderEvent) => ({
    x: clamp(event.nativeEvent.locationX / previewWidth, 0, 1),
    y: clamp(event.nativeEvent.locationY / previewHeight, 0, 1),
  });

  const updateMarker = (marker: Marker, event: GestureResponderEvent) => {
    const point = pointFromEvent(event);
    if (marker === "pivot") {
      pivotRef.current = point;
      setPivot(point);
    } else {
      tipRef.current = point;
      setTip(point);
    }
  };

  const commit = () =>
    onCommit({
      pivotX: pivotRef.current.x,
      pivotY: pivotRef.current.y,
      tipX: tipRef.current.x,
      tipY: tipRef.current.y,
    });

  const setPreset = (nextPivot: typeof pivot, nextTip: typeof tip) => {
    pivotRef.current = nextPivot;
    tipRef.current = nextTip;
    setPivot(nextPivot);
    setTip(nextTip);
    onCommit({
      pivotX: nextPivot.x,
      pivotY: nextPivot.y,
      tipX: nextTip.x,
      tipY: nextTip.y,
    });
  };

  return (
    <View style={styles.container}>
      <AppText variant="label">바늘 방향점 설정</AppText>
      <AppText tone="secondary">
        청록점은 시간을 가리킬 꼭짓점, 분홍점은 시계 중앙에 붙을 꼭짓점이에요.
        가까운 점을 잡아 드래그하세요.
      </AppText>
      <View
        onLayout={(event: LayoutChangeEvent) =>
          setFrameWidth(event.nativeEvent.layout.width)
        }
        onTouchCancel={() => onDragStateChange?.(false)}
        onTouchEnd={() => onDragStateChange?.(false)}
        onTouchStart={() => onDragStateChange?.(true)}
        style={styles.previewFrame}
      >
        <View
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(event) => {
            onDragStateChange?.(true);
            const point = pointFromEvent(event);
            const pivotDistance = Math.hypot(
              point.x - pivotRef.current.x,
              point.y - pivotRef.current.y,
            );
            const tipDistance = Math.hypot(
              point.x - tipRef.current.x,
              point.y - tipRef.current.y,
            );
            activeMarker.current =
              tipDistance < pivotDistance ? "tip" : "pivot";
            updateMarker(activeMarker.current, event);
          }}
          onResponderMove={(event) => updateMarker(activeMarker.current, event)}
          onResponderRelease={(event) => {
            updateMarker(activeMarker.current, event);
            commit();
            onDragStateChange?.(false);
          }}
          onResponderTerminate={() => onDragStateChange?.(false)}
          onResponderTerminationRequest={() => false}
          onMoveShouldSetResponderCapture={() => true}
          onStartShouldSetResponder={() => true}
          onStartShouldSetResponderCapture={() => true}
          style={[
            styles.preview,
            {
              height: previewHeight,
              width: previewWidth,
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
              styles.tipMarker,
              {
                left: tip.x * previewWidth - 9,
                top: tip.y * previewHeight - 9,
              },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.marker,
              styles.pivotMarker,
              {
                left: pivot.x * previewWidth - 9,
                top: pivot.y * previewHeight - 9,
              },
            ]}
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.action}>
          <AppButton
            label="세로 바늘"
            onPress={() => setPreset({ x: 0.5, y: 1 }, { x: 0.5, y: 0 })}
            variant="secondary"
          />
        </View>
        <View style={styles.action}>
          <AppButton
            label="가로 바늘 →"
            onPress={() => setPreset({ x: 0, y: 0.5 }, { x: 1, y: 0.5 })}
            variant="secondary"
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.action}>
          <AppButton
            label="바늘 크기 −"
            onPress={() => onResize(0.9, "both")}
            variant="secondary"
          />
        </View>
        <View style={styles.action}>
          <AppButton
            label="바늘 크기 +"
            onPress={() => onResize(1.1, "both")}
            variant="secondary"
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.action}>
          <AppButton
            label="바늘 길이 −"
            onPress={() => onResize(0.9, "length")}
            variant="secondary"
          />
        </View>
        <View style={styles.action}>
          <AppButton
            label="바늘 길이 +"
            onPress={() => onResize(1.1, "length")}
            variant="secondary"
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.action}>
          <AppButton
            label="바늘 두께 −"
            onPress={() => onResize(0.9, "thickness")}
            variant="secondary"
          />
        </View>
        <View style={styles.action}>
          <AppButton
            label="바늘 두께 +"
            onPress={() => onResize(1.1, "thickness")}
            variant="secondary"
          />
        </View>
      </View>
    </View>
  );
};
