import { useState } from "react";
import { Pressable, View } from "react-native";

import type { ClockLayer } from "@/entities/clock-layer";
import {
  AppButton,
  AppText,
  ColorField,
  HelpTip,
  OpacityControl,
  useAppDialog,
} from "@/shared/ui";

import { styles } from "./ClockLayerPanel.styles";

type LayerDirection = "up" | "down" | "front" | "back";

const LAYER_TYPE_LABEL: Record<ClockLayer["type"], string> = {
  decoration: "장식",
  digit: "숫자",
  "hour-hand": "시침",
  "minute-hand": "분침",
};

type ClockLayerPanelProps = {
  layers: ClockLayer[];
  selectedLayerId: string | null;
  onEditHand: (layer: ClockLayer) => void;
  onOpacityChange: (layerId: string, opacity: number) => void;
  onTintColorChange: (layerId: string, color?: string) => void;
  onMove: (layerId: string, direction: LayerDirection) => void;
  onReedit: (layer: ClockLayer) => void;
  onRemove: (layer: ClockLayer) => void;
  onSelect: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
};

export const ClockLayerPanel = ({
  layers,
  onEditHand,
  onMove,
  onOpacityChange,
  onReedit,
  onRemove,
  onSelect,
  onToggleLock,
  onToggleVisibility,
  onTintColorChange,
  selectedLayerId,
}: ClockLayerPanelProps) => {
  const { showDialog } = useAppDialog();
  const [collapsedLayerId, setCollapsedLayerId] = useState<string | null>(null);
  const orderedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);
  const layerOrderById = new Map(
    [...layers]
      .sort((a, b) => a.zIndex - b.zIndex)
      .map((layer, index) => [layer.id, index + 1]),
  );
  const selectedLayer = layers.find((layer) => layer.id === selectedLayerId);
  const isFront = selectedLayer?.id === orderedLayers[0]?.id;
  const isBack = selectedLayer?.id === orderedLayers.at(-1)?.id;
  const isHand =
    selectedLayer?.type === "hour-hand" ||
    selectedLayer?.type === "minute-hand";
  const detailsExpanded = collapsedLayerId !== selectedLayerId;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <AppText variant="label">레이어</AppText>
        <HelpTip
          message="위에 표시된 항목일수록 시계 화면에서도 앞에 보여요."
          title="레이어 순서"
        />
      </View>

      {selectedLayer ? (
        <View style={styles.selectedCard}>
          <Pressable
            accessibilityLabel={`${selectedLayer.name} 편집 설정 ${
              detailsExpanded ? "접기" : "펼치기"
            }`}
            accessibilityRole="button"
            onPress={() =>
              setCollapsedLayerId((collapsedId) =>
                collapsedId === selectedLayer.id ? null : selectedLayer.id,
              )
            }
            style={({ pressed }) => [
              styles.selectedTitle,
              pressed && styles.selectedTitlePressed,
            ]}
          >
            <AppText variant="label" style={styles.selectedTitleLabel}>
              {selectedLayer.name} - {LAYER_TYPE_LABEL[selectedLayer.type]} (
              {layerOrderById.get(selectedLayer.id)})
            </AppText>
            <AppText tone="secondary">{detailsExpanded ? "▲" : "▼"}</AppText>
          </Pressable>
          {detailsExpanded ? (
            <>
              <View style={styles.orderActions}>
                <View style={styles.orderAction}>
                  <AppButton
                    disabled={isFront}
                    label="앞 +1"
                    onPress={() => onMove(selectedLayer.id, "up")}
                    variant="secondary"
                  />
                </View>
                <View style={styles.orderAction}>
                  <AppButton
                    disabled={isFront}
                    label="맨 앞"
                    onPress={() => onMove(selectedLayer.id, "front")}
                    variant="secondary"
                  />
                </View>
                <View style={styles.orderAction}>
                  <AppButton
                    disabled={isBack}
                    label="뒤 -1"
                    onPress={() => onMove(selectedLayer.id, "down")}
                    variant="secondary"
                  />
                </View>
                <View style={styles.orderAction}>
                  <AppButton
                    disabled={isBack}
                    label="맨 뒤"
                    onPress={() => onMove(selectedLayer.id, "back")}
                    variant="secondary"
                  />
                </View>
              </View>
              <View style={styles.actions}>
                {isHand ? (
                  <AppButton
                    label="바늘 편집"
                    onPress={() => onEditHand(selectedLayer)}
                    variant="secondary"
                  />
                ) : null}
                <AppButton
                  label={selectedLayer.visible ? "숨기기" : "보이기"}
                  onPress={() => onToggleVisibility(selectedLayer.id)}
                  variant="secondary"
                />
                <AppButton
                  label={selectedLayer.locked ? "잠금 해제" : "잠금"}
                  onPress={() => onToggleLock(selectedLayer.id)}
                  variant="secondary"
                />
                <AppButton
                  label="영역 다시 선택"
                  onPress={() => onReedit(selectedLayer)}
                  variant="secondary"
                />
                <AppButton
                  label="삭제"
                  onPress={() =>
                    showDialog({
                      title: "레이어 삭제",
                      message: `${selectedLayer.name}을 삭제할까요?`,
                      actions: [
                        { label: "취소" },
                        {
                          label: "삭제",
                          tone: "danger",
                          onPress: () => onRemove(selectedLayer),
                        },
                      ],
                    })
                  }
                  variant="secondary"
                />
              </View>
              <ColorField
                label={`${selectedLayer.name} 색상`}
                onChange={(color) => onTintColorChange(selectedLayer.id, color)}
                value={selectedLayer.tintColor ?? "#18312E"}
              />
              {selectedLayer.tintColor ? (
                <AppButton
                  label="원본 이미지 색상 사용"
                  onPress={() => onTintColorChange(selectedLayer.id, undefined)}
                  variant="secondary"
                />
              ) : null}
              <OpacityControl
                label={`${selectedLayer.name} 투명도`}
                onChange={(opacity) =>
                  onOpacityChange(selectedLayer.id, opacity)
                }
                value={selectedLayer.opacity}
              />
            </>
          ) : null}
        </View>
      ) : (
        <AppText tone="secondary">편집할 요소를 선택해 주세요.</AppText>
      )}

      <View style={styles.layerList}>
        {orderedLayers.map((layer) => (
          <AppButton
            key={layer.id}
            label={`${layer.name} - ${LAYER_TYPE_LABEL[layer.type]} (${layerOrderById.get(layer.id)})${
              layer.locked ? " · 잠김" : ""
            }${layer.visible ? "" : " · 숨김"}`}
            onPress={() => onSelect(layer.id)}
            selected={selectedLayerId === layer.id}
            variant="secondary"
          />
        ))}
      </View>

      {layers.length === 0 ? (
        <AppText tone="secondary">추가된 이미지가 없어요.</AppText>
      ) : null}
    </View>
  );
};
