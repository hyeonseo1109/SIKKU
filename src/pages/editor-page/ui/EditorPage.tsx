import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, ScrollView, View } from "react-native";

import type { ClockLayer, ClockLayerTransform } from "@/entities/clock-layer";
import { moveLayer, normalizeLayerOrder } from "@/entities/clock-layer";
import {
  clockProjectRepository,
  projectAssetRepository,
  useClockProjectStore,
} from "@/entities/clock-project";
import type {
  DigitValue,
  DigitalDisplayTransform,
} from "@/entities/digital-clock";
import { applyClockWidget } from "@/features/apply-clock-widget";
import { serializeWidgetConfig } from "@/features/export-widget-config";
import { type EditorTab, useEditorUiStore } from "@/features/editor-session";
import {
  applyImageAsset,
  type ImageTarget,
  pickProjectImage,
  usePendingImageStore,
} from "@/features/select-image";
import { AppButton, AppScreen, AppText } from "@/shared/ui";
import { AnalogAnchorEditor } from "@/widgets/analog-anchor-editor";
import { ClockCanvas, DIGITAL_SELECTION_ID } from "@/widgets/clock-canvas";

import { styles } from "./EditorPage.styles";

const TABS: { key: EditorTab; label: string }[] = [
  { key: "background", label: "배경" },
  { key: "image", label: "이미지" },
  { key: "clock", label: "시계" },
  { key: "layers", label: "레이어" },
  { key: "settings", label: "설정" },
];
const BACKGROUNDS = ["#FFFFFF", "#FFF8F2", "#F3E5D8", "#1D1B1A", "#BBD7EA"];
const DIGITS: DigitValue[] = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "colon",
];

const categoryForTarget = (target: ImageTarget) => {
  if (target.kind === "background") return "background" as const;
  if (target.kind === "digit") return "digits" as const;
  if (target.kind === "hour-hand" || target.kind === "minute-hand")
    return "hands" as const;
  return "decoration" as const;
};

export const EditorPage = () => {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router = useRouter();
  const project = useClockProjectStore((state) => state.project);
  const saveStatus = useClockProjectStore((state) => state.saveStatus);
  const past = useClockProjectStore((state) => state.past);
  const future = useClockProjectStore((state) => state.future);
  const setProject = useClockProjectStore((state) => state.setProject);
  const changeProject = useClockProjectStore((state) => state.changeProject);
  const save = useClockProjectStore((state) => state.save);
  const undo = useClockProjectStore((state) => state.undo);
  const redo = useClockProjectStore((state) => state.redo);
  const selectedLayerId = useEditorUiStore((state) => state.selectedLayerId);
  const activeTab = useEditorUiStore((state) => state.activeTab);
  const selectLayer = useEditorUiStore((state) => state.selectLayer);
  const setActiveTab = useEditorUiStore((state) => state.setActiveTab);
  const resetUi = useEditorUiStore((state) => state.reset);
  const setPending = usePendingImageStore((state) => state.setPending);
  const [loading, setLoading] = useState(true);
  const mountedProjectId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = projectId
      ? clockProjectRepository.getById(projectId)
      : Promise.resolve(null);
    void load
      .then((loaded) => {
        if (active) {
          setProject(loaded);
          mountedProjectId.current = projectId ?? null;
          setLoading(false);
        }
      })
      .catch((error: unknown) => {
        console.error("[EditorPage] Failed to load project", error);
        if (active) {
          setProject(null);
          setLoading(false);
          Alert.alert(
            "프로젝트를 열지 못했어요",
            "저장된 데이터가 손상되었거나 사라졌어요.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [project?.id, projectId, setProject]);

  useEffect(() => {
    if (saveStatus !== "dirty") return;
    const timer = setTimeout(() => void save(), 750);
    return () => clearTimeout(timer);
  }, [project?.updatedAt, save, saveStatus]);

  useEffect(
    () => () => {
      const state = useClockProjectStore.getState();
      if (
        state.project?.id === mountedProjectId.current &&
        state.saveStatus === "dirty"
      ) {
        void state.save();
      }
      resetUi();
    },
    [resetUi],
  );

  const chooseImage = useCallback(
    async (target: ImageTarget) => {
      if (!project) return;
      try {
        const result = await pickProjectImage(
          project,
          categoryForTarget(target),
        );
        if (result.status === "canceled") return;
        Alert.alert("이미지 사용 범위", "이미지 전체를 쓸까요?", [
          {
            text: "취소",
            style: "cancel",
            onPress: () =>
              void projectAssetRepository.removeAsset(project.id, result.asset),
          },
          {
            text: "영역 선택",
            onPress: () => {
              setPending({
                projectId: project.id,
                asset: result.asset,
                target,
              });
              router.push("/image-lasso");
            },
          },
          {
            text: "전체 사용",
            onPress: () => {
              changeProject((current) =>
                applyImageAsset(current, result.asset, target),
              );
            },
          },
        ]);
      } catch (error: unknown) {
        Alert.alert(
          "이미지를 가져오지 못했어요",
          error instanceof Error ? error.message : "다시 시도해 주세요.",
        );
      }
    },
    [changeProject, project, router, setPending],
  );

  const reeditLayer = (layer: ClockLayer) => {
    if (!project) return;
    const asset = project.assets.find((item) => item.id === layer.imageAssetId);
    if (!asset) {
      Alert.alert("원본 없음", "이 이미지의 원본 파일을 찾을 수 없어요.");
      return;
    }
    setPending({
      projectId: project.id,
      asset,
      target: { kind: "layer-reedit", layerId: layer.id },
    });
    router.push("/image-lasso");
  };

  const manageDigit = (digit: DigitValue) => {
    if (!project?.digitalConfig) return;
    const assetId = project.digitalConfig.digitAssetMap[digit];
    const asset = project.assets.find((item) => item.id === assetId);
    if (!asset) {
      void chooseImage({ kind: "digit", digit });
      return;
    }
    Alert.alert(
      `${digit === "colon" ? ":" : digit} 이미지`,
      "작업을 선택해 주세요.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "새 이미지로 교체",
          onPress: () => void chooseImage({ kind: "digit", digit }),
        },
        {
          text: "영역 다시 선택",
          onPress: () => {
            setPending({
              projectId: project.id,
              asset,
              target: { kind: "digit", digit },
            });
            router.push("/image-lasso");
          },
        },
        {
          text: "삭제",
          style: "destructive",
          onPress: () => {
            changeProject((current) => {
              if (!current.digitalConfig) return current;
              const digitImageMap = { ...current.digitalConfig.digitImageMap };
              const digitAssetMap = { ...current.digitalConfig.digitAssetMap };
              delete digitImageMap[digit];
              delete digitAssetMap[digit];
              return {
                ...current,
                assets: current.assets.filter((item) => item.id !== asset.id),
                digitalConfig: {
                  ...current.digitalConfig,
                  digitImageMap,
                  digitAssetMap,
                },
              };
            });
          },
        },
      ],
    );
  };

  const chooseHand = (
    kind: "hour-hand" | "minute-hand",
    replaceLayerId?: string,
  ) => {
    const choose = () => void chooseImage({ kind, replaceLayerId });
    if (!replaceLayerId) {
      choose();
      return;
    }
    Alert.alert(
      kind === "hour-hand" ? "시침 교체" : "분침 교체",
      "현재 바늘 이미지를 새 이미지로 교체할까요? 위치와 크기는 유지돼요.",
      [
        { text: "취소", style: "cancel" },
        { text: "교체", onPress: choose },
      ],
    );
  };

  const updateLayerTransform = (
    layerId: string,
    transform: ClockLayerTransform,
  ) => {
    changeProject((current) => {
      const changed = current.layers.find((layer) => layer.id === layerId);
      const isHand =
        changed?.type === "hour-hand" || changed?.type === "minute-hand";
      return {
        ...current,
        layers: current.layers.map((layer) => ({
          ...layer,
          transform:
            layer.id === layerId
              ? transform
              : isHand &&
                  (layer.type === "hour-hand" || layer.type === "minute-hand")
                ? { ...layer.transform, x: transform.x, y: transform.y }
                : layer.transform,
        })),
        analogConfig:
          isHand && current.analogConfig
            ? {
                ...current.analogConfig,
                centerX: transform.x,
                centerY: transform.y,
              }
            : current.analogConfig,
      };
    });
  };

  const removeLayer = (layer: ClockLayer) => {
    if (!project) return;
    const asset = project.assets.find((item) => item.id === layer.imageAssetId);
    changeProject((current) => ({
      ...current,
      layers: normalizeLayerOrder(
        current.layers.filter((item) => item.id !== layer.id),
      ),
      assets: current.assets.filter((item) => item.id !== asset?.id),
      analogConfig: current.analogConfig
        ? {
            ...current.analogConfig,
            hourHandLayerId:
              current.analogConfig.hourHandLayerId === layer.id
                ? undefined
                : current.analogConfig.hourHandLayerId,
            minuteHandLayerId:
              current.analogConfig.minuteHandLayerId === layer.id
                ? undefined
                : current.analogConfig.minuteHandLayerId,
          }
        : undefined,
    }));
    selectLayer(null);
  };

  const selectedLayer = useMemo(
    () => project?.layers.find((layer) => layer.id === selectedLayerId),
    [project?.layers, selectedLayerId],
  );

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centered}>
          <AppText>프로젝트를 여는 중…</AppText>
        </View>
      </AppScreen>
    );
  }

  if (!project) {
    return (
      <AppScreen>
        <View style={styles.centered}>
          <AppText variant="heading">프로젝트를 찾을 수 없어요</AppText>
          <AppButton label="목록으로" onPress={() => router.replace("/")} />
        </View>
      </AppScreen>
    );
  }

  const updateDigital = (transform: DigitalDisplayTransform) =>
    changeProject((current) => ({
      ...current,
      digitalConfig: current.digitalConfig
        ? { ...current.digitalConfig, transform }
        : undefined,
    }));

  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={styles.headerButton}>
          <AppButton
            label="뒤로"
            onPress={() => {
              void save().finally(() => router.back());
            }}
            variant="secondary"
          />
        </View>
        <View style={styles.headerTitle}>
          <AppText numberOfLines={1} variant="title">
            {project.name}
          </AppText>
          <AppText tone="secondary">
            {saveStatus === "saving"
              ? "저장 중…"
              : saveStatus === "dirty"
                ? "변경됨"
                : saveStatus === "error"
                  ? "저장 오류"
                  : "저장됨"}
          </AppText>
        </View>
        <View style={styles.headerButton}>
          <AppButton label="저장" onPress={() => void save()} />
        </View>
      </View>

      <ClockCanvas
        onSelectLayer={selectLayer}
        onTransformDigital={updateDigital}
        onTransformLayer={updateLayerTransform}
        project={project}
        selectedLayerId={selectedLayerId}
      />

      <View style={styles.toolbar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroller}
        >
          <View style={styles.tabs}>
            {TABS.map((tab) => (
              <AppButton
                key={tab.key}
                label={tab.label}
                onPress={() => setActiveTab(tab.key)}
                selected={activeTab === tab.key}
                variant="secondary"
              />
            ))}
          </View>
        </ScrollView>

        <ScrollView
          contentContainerStyle={styles.panel}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === "background" ? (
            <>
              <AppText variant="label">배경색</AppText>
              <View style={styles.wrapRow}>
                {BACKGROUNDS.map((color) => (
                  <AppButton
                    key={color}
                    label={color}
                    onPress={() =>
                      changeProject((current) => ({
                        ...current,
                        canvas: { ...current.canvas, backgroundColor: color },
                      }))
                    }
                    selected={project.canvas.backgroundColor === color}
                    variant="secondary"
                  />
                ))}
              </View>
              <AppButton
                label="배경 이미지 선택"
                onPress={() => void chooseImage({ kind: "background" })}
                variant="secondary"
              />
              {project.canvas.backgroundImageAssetId ? (
                <AppButton
                  label="배경 이미지 지우기"
                  onPress={() => {
                    const asset = project.assets.find(
                      (item) =>
                        item.id === project.canvas.backgroundImageAssetId,
                    );
                    changeProject((current) => ({
                      ...current,
                      assets: current.assets.filter(
                        (item) => item.id !== asset?.id,
                      ),
                      canvas: {
                        ...current.canvas,
                        backgroundImageAssetId: undefined,
                        backgroundImageUri: undefined,
                      },
                    }));
                  }}
                  variant="secondary"
                />
              ) : null}
            </>
          ) : null}

          {activeTab === "image" ? (
            <>
              <AppText variant="label">꾸미기 이미지</AppText>
              <AppText tone="secondary">
                사진을 전체로 쓰거나 자유롭게 둘러 그린 영역만 PNG로 추가할 수
                있어요.
              </AppText>
              <AppButton
                label="장식 이미지 추가"
                onPress={() => void chooseImage({ kind: "decoration" })}
              />
            </>
          ) : null}

          {activeTab === "clock" && project.type === "analog" ? (
            <>
              <AppText variant="label">아날로그 시계</AppText>
              <View style={styles.buttonRow}>
                <View style={styles.rowItem}>
                  <AppButton
                    label="시침 이미지"
                    onPress={() =>
                      chooseHand(
                        "hour-hand",
                        project.analogConfig?.hourHandLayerId,
                      )
                    }
                    variant="secondary"
                  />
                </View>
                <View style={styles.rowItem}>
                  <AppButton
                    label="분침 이미지"
                    onPress={() =>
                      chooseHand(
                        "minute-hand",
                        project.analogConfig?.minuteHandLayerId,
                      )
                    }
                    variant="secondary"
                  />
                </View>
              </View>
              <View style={styles.wrapRow}>
                <AppButton
                  label="현재 시간"
                  onPress={() =>
                    changeProject((current) => ({
                      ...current,
                      analogConfig: current.analogConfig
                        ? { ...current.analogConfig, previewMode: "current" }
                        : undefined,
                    }))
                  }
                  selected={project.analogConfig?.previewMode === "current"}
                  variant="secondary"
                />
                {[
                  [10, 10],
                  [3, 30],
                  [6, 0],
                ].map(([hour, minute]) => (
                  <AppButton
                    key={`${hour}:${minute}`}
                    label={`${String(hour).padStart(2, "0")}:${String(
                      minute,
                    ).padStart(2, "0")}`}
                    onPress={() =>
                      changeProject((current) => ({
                        ...current,
                        analogConfig: current.analogConfig
                          ? {
                              ...current.analogConfig,
                              previewMode: "custom",
                              previewHour: hour ?? 0,
                              previewMinute: minute ?? 0,
                            }
                          : undefined,
                      }))
                    }
                    variant="secondary"
                  />
                ))}
                <AppButton
                  label={
                    project.analogConfig?.showCenterCap
                      ? "중심점 숨기기"
                      : "중심점 보이기"
                  }
                  onPress={() =>
                    changeProject((current) => ({
                      ...current,
                      analogConfig: current.analogConfig
                        ? {
                            ...current.analogConfig,
                            showCenterCap: !current.analogConfig.showCenterCap,
                          }
                        : undefined,
                    }))
                  }
                  variant="secondary"
                />
              </View>
              {selectedLayer &&
              (selectedLayer.type === "hour-hand" ||
                selectedLayer.type === "minute-hand") ? (
                <AnalogAnchorEditor
                  key={`${selectedLayer.id}-${selectedLayer.imageUri}`}
                  layer={selectedLayer}
                  onCommit={(anchorX, anchorY) =>
                    updateLayerTransform(selectedLayer.id, {
                      ...selectedLayer.transform,
                      anchorX,
                      anchorY,
                    })
                  }
                />
              ) : (
                <AppText tone="secondary">
                  캔버스나 레이어 탭에서 시침·분침을 선택하면 회전 기준점을
                  조절할 수 있어요.
                </AppText>
              )}
            </>
          ) : null}

          {activeTab === "clock" &&
          project.type === "digital" &&
          project.digitalConfig ? (
            <>
              <AppText variant="label">디지털 시계</AppText>
              <View style={styles.wrapRow}>
                <AppButton
                  label="24시간 HH:mm"
                  onPress={() =>
                    changeProject((current) => ({
                      ...current,
                      digitalConfig: current.digitalConfig
                        ? { ...current.digitalConfig, format: "HH:mm" }
                        : undefined,
                    }))
                  }
                  selected={project.digitalConfig.format === "HH:mm"}
                  variant="secondary"
                />
                <AppButton
                  label="12시간 h:mm"
                  onPress={() =>
                    changeProject((current) => ({
                      ...current,
                      digitalConfig: current.digitalConfig
                        ? { ...current.digitalConfig, format: "h:mm" }
                        : undefined,
                    }))
                  }
                  selected={project.digitalConfig.format === "h:mm"}
                  variant="secondary"
                />
                <AppButton
                  label="간격 -"
                  onPress={() =>
                    changeProject((current) => ({
                      ...current,
                      digitalConfig: current.digitalConfig
                        ? {
                            ...current.digitalConfig,
                            digitSpacing: Math.max(
                              0,
                              current.digitalConfig.digitSpacing - 2,
                            ),
                          }
                        : undefined,
                    }))
                  }
                  variant="secondary"
                />
                <AppButton
                  label={`간격 + (${project.digitalConfig.digitSpacing})`}
                  onPress={() =>
                    changeProject((current) => ({
                      ...current,
                      digitalConfig: current.digitalConfig
                        ? {
                            ...current.digitalConfig,
                            digitSpacing:
                              current.digitalConfig.digitSpacing + 2,
                          }
                        : undefined,
                    }))
                  }
                  variant="secondary"
                />
                <AppButton
                  label={
                    project.digitalConfig.colonVisible
                      ? "콜론 숨기기"
                      : "콜론 보이기"
                  }
                  onPress={() =>
                    changeProject((current) => ({
                      ...current,
                      digitalConfig: current.digitalConfig
                        ? {
                            ...current.digitalConfig,
                            colonVisible: !current.digitalConfig.colonVisible,
                          }
                        : undefined,
                    }))
                  }
                  variant="secondary"
                />
              </View>
              <AppText variant="label">숫자 이미지</AppText>
              <View style={styles.wrapRow}>
                {DIGITS.map((digit) => (
                  <AppButton
                    key={digit}
                    label={digit === "colon" ? ":" : digit}
                    onPress={() => manageDigit(digit)}
                    selected={Boolean(
                      project.digitalConfig?.digitImageMap[digit],
                    )}
                    variant="secondary"
                  />
                ))}
              </View>
            </>
          ) : null}

          {activeTab === "layers" ? (
            <>
              <AppText variant="label">레이어</AppText>
              {project.type === "digital" ? (
                <AppButton
                  label="디지털 시계"
                  onPress={() => selectLayer(DIGITAL_SELECTION_ID)}
                  selected={selectedLayerId === DIGITAL_SELECTION_ID}
                  variant="secondary"
                />
              ) : null}
              {[...project.layers]
                .sort((a, b) => b.zIndex - a.zIndex)
                .map((layer) => (
                  <View key={layer.id} style={styles.layerCard}>
                    <AppButton
                      label={`${layer.name}${layer.locked ? " · 잠김" : ""}${
                        layer.visible ? "" : " · 숨김"
                      }`}
                      onPress={() => selectLayer(layer.id)}
                      selected={selectedLayerId === layer.id}
                      variant="secondary"
                    />
                    <View style={styles.wrapRow}>
                      <AppButton
                        label={layer.visible ? "숨기기" : "보이기"}
                        onPress={() =>
                          changeProject((current) => ({
                            ...current,
                            layers: current.layers.map((item) =>
                              item.id === layer.id
                                ? { ...item, visible: !item.visible }
                                : item,
                            ),
                          }))
                        }
                        variant="secondary"
                      />
                      <AppButton
                        label={layer.locked ? "잠금 해제" : "잠금"}
                        onPress={() =>
                          changeProject((current) => ({
                            ...current,
                            layers: current.layers.map((item) =>
                              item.id === layer.id
                                ? { ...item, locked: !item.locked }
                                : item,
                            ),
                          }))
                        }
                        variant="secondary"
                      />
                      <AppButton
                        label="앞으로"
                        onPress={() =>
                          changeProject((current) => ({
                            ...current,
                            layers: moveLayer(current.layers, layer.id, "up"),
                          }))
                        }
                        variant="secondary"
                      />
                      <AppButton
                        label="맨 앞"
                        onPress={() =>
                          changeProject((current) => ({
                            ...current,
                            layers: moveLayer(
                              current.layers,
                              layer.id,
                              "front",
                            ),
                          }))
                        }
                        variant="secondary"
                      />
                      <AppButton
                        label="뒤로"
                        onPress={() =>
                          changeProject((current) => ({
                            ...current,
                            layers: moveLayer(current.layers, layer.id, "down"),
                          }))
                        }
                        variant="secondary"
                      />
                      <AppButton
                        label="맨 뒤"
                        onPress={() =>
                          changeProject((current) => ({
                            ...current,
                            layers: moveLayer(current.layers, layer.id, "back"),
                          }))
                        }
                        variant="secondary"
                      />
                      <AppButton
                        label="영역 다시 선택"
                        onPress={() => reeditLayer(layer)}
                        variant="secondary"
                      />
                      <AppButton
                        label="삭제"
                        onPress={() =>
                          Alert.alert(
                            "레이어 삭제",
                            `${layer.name}을 삭제할까요?`,
                            [
                              { text: "취소", style: "cancel" },
                              {
                                text: "삭제",
                                style: "destructive",
                                onPress: () => void removeLayer(layer),
                              },
                            ],
                          )
                        }
                        variant="secondary"
                      />
                    </View>
                  </View>
                ))}
              {project.layers.length === 0 ? (
                <AppText tone="secondary">추가된 이미지가 없어요.</AppText>
              ) : null}
            </>
          ) : null}

          {activeTab === "settings" ? (
            <>
              <AppText variant="label">편집 기록</AppText>
              <View style={styles.buttonRow}>
                <View style={styles.rowItem}>
                  <AppButton
                    disabled={past.length === 0}
                    label="실행 취소"
                    onPress={undo}
                    variant="secondary"
                  />
                </View>
                <View style={styles.rowItem}>
                  <AppButton
                    disabled={future.length === 0}
                    label="다시 실행"
                    onPress={redo}
                    variant="secondary"
                  />
                </View>
              </View>
              <AppButton
                label="Kotlin 전달 설정 검증"
                onPress={() => {
                  try {
                    const json = serializeWidgetConfig(project);
                    Alert.alert(
                      "설정 검증 완료",
                      `네이티브에 전달할 JSON ${json.length.toLocaleString()}자를 만들었어요.`,
                    );
                  } catch (error: unknown) {
                    Alert.alert(
                      "설정 검증 실패",
                      error instanceof Error
                        ? error.message
                        : "파일을 확인해 주세요.",
                    );
                  }
                }}
                variant="secondary"
              />
              <AppButton
                label="Android 위젯 적용"
                onPress={() => {
                  try {
                    serializeWidgetConfig(project);
                    void save()
                      .then(() => applyClockWidget(project.id))
                      .catch((error: unknown) =>
                        Alert.alert(
                          "Development Build 필요",
                          error instanceof Error
                            ? error.message
                            : "네이티브 모듈을 사용할 수 없어요.",
                        ),
                      );
                  } catch (error: unknown) {
                    Alert.alert(
                      "적용할 수 없어요",
                      error instanceof Error
                        ? error.message
                        : "이미지 파일을 확인해 주세요.",
                    );
                  }
                }}
              />
            </>
          ) : null}
        </ScrollView>
      </View>
    </AppScreen>
  );
};
