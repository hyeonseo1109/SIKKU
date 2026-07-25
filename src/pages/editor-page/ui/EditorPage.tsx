import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

import type { ClockLayer, ClockLayerTransform } from "@/entities/clock-layer";
import { moveLayer, normalizeLayerOrder } from "@/entities/clock-layer";
import {
  clockProjectRepository,
  projectAssetRepository,
  resolveCanvasCornerRadius,
  resolveCanvasShadow,
  useClockProjectStore,
} from "@/entities/clock-project";
import type { ClockCanvasShadow } from "@/entities/clock-project";
import type {
  DigitValue,
  DigitalDisplayTransform,
  DigitalSeparatorStyle,
  DigitalSlotId,
} from "@/entities/digital-clock";
import {
  DIGITAL_SLOT_IDS,
  DIGITAL_SLOT_LABELS,
  getDigitalSeparatorStyle,
  resolveDigitalSlotTransforms,
} from "@/entities/digital-clock";
import {
  isClockWidgetSupported,
  updateClockWidgets,
} from "@/features/apply-clock-widget";
import { serializeWidgetConfig } from "@/features/export-widget-config";
import { type EditorTab, useEditorUiStore } from "@/features/editor-session";
import {
  applyImageAsset,
  type ImageTarget,
  pickProjectImage,
  usePendingImageStore,
} from "@/features/select-image";
import { updateProjectPreview } from "@/features/update-project-preview";
import { AppButton, AppScreen, AppText, useAppDialog } from "@/shared/ui";
import { AnalogAnchorEditor } from "@/widgets/analog-anchor-editor";
import {
  ClockCanvas,
  getDigitalSelectionId,
  getSelectedDigitalSlotId,
} from "@/widgets/clock-canvas";
import { ClockLayerPanel } from "@/widgets/clock-layer-panel";
import {
  AddClockWidgetButton,
  ClockWidgetSettings,
} from "@/widgets/clock-widget-settings";
import { DigitalSlotEditor } from "@/widgets/digital-slot-editor";

import { styles } from "./EditorPage.styles";

const TABS: { key: EditorTab; label: string }[] = [
  { key: "background", label: "배경" },
  { key: "image", label: "이미지" },
  { key: "clock", label: "시계" },
  { key: "layers", label: "레이어" },
  { key: "settings", label: "설정" },
];
const BACKGROUNDS = [
  "transparent",
  "#FFFFFF",
  "#FFF8F2",
  "#F3E5D8",
  "#1D1B1A",
  "#BBD7EA",
] as const;
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
const SEPARATORS: { label: string; value: DigitalSeparatorStyle }[] = [
  { label: ":", value: "colon" },
  { label: "|", value: "pipe" },
  { label: "작은 |", value: "small-pipe" },
  { label: "-", value: "dash" },
  { label: "공백", value: "space" },
  { label: "없음", value: "none" },
];
const SHADOW_COLORS = [
  { label: "차콜", value: "#18312E" },
  { label: "민트", value: "#2F6F68" },
  { label: "블루", value: "#315B7D" },
  { label: "로즈", value: "#8A5263" },
  { label: "골드", value: "#8A6A32" },
] as const;

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
  const { showDialog } = useAppDialog();
  const project = useClockProjectStore((state) => state.project);
  const saveStatus = useClockProjectStore((state) => state.saveStatus);
  const past = useClockProjectStore((state) => state.past);
  const future = useClockProjectStore((state) => state.future);
  const setProject = useClockProjectStore((state) => state.setProject);
  const changeProject = useClockProjectStore((state) => state.changeProject);
  const replaceProjectWithoutHistory = useClockProjectStore(
    (state) => state.replaceProjectWithoutHistory,
  );
  const save = useClockProjectStore((state) => state.save);
  const undo = useClockProjectStore((state) => state.undo);
  const redo = useClockProjectStore((state) => state.redo);
  const selectedLayerId = useEditorUiStore((state) => state.selectedLayerId);
  const selectedDigitalSlotId = getSelectedDigitalSlotId(selectedLayerId);
  const activeTab = useEditorUiStore((state) => state.activeTab);
  const selectLayer = useEditorUiStore((state) => state.selectLayer);
  const setActiveTab = useEditorUiStore((state) => state.setActiveTab);
  const resetUi = useEditorUiStore((state) => state.reset);
  const setPending = usePendingImageStore((state) => state.setPending);
  const [loading, setLoading] = useState(true);
  const [anchorDragging, setAnchorDragging] = useState(false);
  const [capturingPreview, setCapturingPreview] = useState(false);
  const mountedProjectId = useRef<string | null>(null);
  const canvasSnapshotRef = useRef<View>(null);
  const saveInFlightRef = useRef<Promise<boolean> | null>(null);

  const saveEditorProject = useCallback((): Promise<boolean> => {
    if (saveInFlightRef.current) return saveInFlightRef.current;

    const saveTask = (async () => {
      let currentProject = useClockProjectStore.getState().project;
      if (!currentProject) return false;

      if (canvasSnapshotRef.current) {
        setCapturingPreview(true);
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
        try {
          const previewImageUri = await updateProjectPreview(
            currentProject,
            canvasSnapshotRef,
          );
          const latestProject = useClockProjectStore.getState().project;
          currentProject = {
            ...(latestProject?.id === currentProject.id
              ? latestProject
              : currentProject),
            previewImageUri,
          };
          replaceProjectWithoutHistory(currentProject);
        } catch (error: unknown) {
          console.error("[EditorPage] Failed to update preview", error);
        } finally {
          setCapturingPreview(false);
        }
      }

      const saved = await save();
      const savedProject = useClockProjectStore.getState().project;
      if (saved && savedProject && isClockWidgetSupported()) {
        try {
          await updateClockWidgets(savedProject);
        } catch (error: unknown) {
          console.error("[EditorPage] Failed to update widgets", error);
        }
      }
      return saved;
    })().finally(() => {
      saveInFlightRef.current = null;
    });

    saveInFlightRef.current = saveTask;
    return saveTask;
  }, [replaceProjectWithoutHistory, save]);

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
          showDialog({
            title: "프로젝트를 열지 못했어요",
            message: "저장된 데이터가 손상되었거나 사라졌어요.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [project?.id, projectId, setProject, showDialog]);

  useEffect(() => {
    if (saveStatus !== "dirty") return;
    const timer = setTimeout(() => void saveEditorProject(), 2000);
    return () => clearTimeout(timer);
  }, [project?.updatedAt, saveEditorProject, saveStatus]);

  useEffect(
    () => () => {
      const state = useClockProjectStore.getState();
      if (
        state.project?.id === mountedProjectId.current &&
        state.saveStatus === "dirty"
      ) {
        const projectToSync = state.project;
        void state.save().then((saved) => {
          if (saved && isClockWidgetSupported()) {
            return updateClockWidgets(projectToSync).catch((error: unknown) => {
              console.error("[EditorPage] Failed to update widgets", error);
            });
          }
        });
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
        showDialog({
          title: "이미지 사용 범위",
          message: "이미지 전체를 쓸까요?",
          actions: [
            {
              label: "취소",
              onPress: () =>
                void projectAssetRepository.removeAsset(
                  project.id,
                  result.asset,
                ),
            },
            {
              label: "영역 선택",
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
              label: "전체 사용",
              tone: "primary",
              onPress: () => {
                changeProject((current) =>
                  applyImageAsset(current, result.asset, target),
                );
              },
            },
          ],
        });
      } catch (error: unknown) {
        showDialog({
          title: "이미지를 가져오지 못했어요",
          message:
            error instanceof Error ? error.message : "다시 시도해 주세요.",
        });
      }
    },
    [changeProject, project, router, setPending, showDialog],
  );

  const reeditLayer = (layer: ClockLayer) => {
    if (!project) return;
    const asset = project.assets.find((item) => item.id === layer.imageAssetId);
    if (!asset) {
      showDialog({
        title: "원본 없음",
        message: "이 이미지의 원본 파일을 찾을 수 없어요.",
      });
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
    if (digit === "colon" && project.digitalConfig.separatorStyle !== "image") {
      changeProject((current) => ({
        ...current,
        digitalConfig: current.digitalConfig
          ? {
              ...current.digitalConfig,
              colonVisible: true,
              separatorStyle: "image",
            }
          : undefined,
      }));
      return;
    }
    showDialog({
      title: `${digit === "colon" ? ":" : digit} 이미지`,
      message: "작업을 선택해 주세요.",
      actions: [
        { label: "취소" },
        {
          label: "새 이미지로 교체",
          onPress: () => void chooseImage({ kind: "digit", digit }),
        },
        {
          label: "영역 다시 선택",
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
          label: "삭제",
          tone: "danger",
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
                  ...(digit === "colon" &&
                  current.digitalConfig.separatorStyle === "image"
                    ? { separatorStyle: "colon" as const }
                    : {}),
                  digitImageMap,
                  digitAssetMap,
                },
              };
            });
          },
        },
      ],
    });
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
    showDialog({
      title: kind === "hour-hand" ? "시침 교체" : "분침 교체",
      message:
        "현재 바늘 이미지를 새 이미지로 교체할까요? 위치와 크기는 유지돼요.",
      actions: [
        { label: "취소" },
        { label: "교체", onPress: choose, tone: "primary" },
      ],
    });
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

  const editHand = (layerId: string | undefined, label: string) => {
    if (!layerId) {
      showDialog({
        title: `${label} 없음`,
        message: `먼저 ${label} 이미지를 추가해 주세요.`,
      });
      return;
    }
    selectLayer(layerId);
    setActiveTab("clock");
  };

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

  const updateDigital = (
    slotId: DigitalSlotId,
    transform: DigitalDisplayTransform,
  ) =>
    changeProject((current) => ({
      ...current,
      digitalConfig: current.digitalConfig
        ? {
            ...current.digitalConfig,
            slotTransforms: {
              ...current.digitalConfig.slotTransforms,
              [slotId]: transform,
            },
          }
        : undefined,
    }));
  const digitalSlotTransforms = project.digitalConfig
    ? resolveDigitalSlotTransforms(project.digitalConfig, project.canvas)
    : null;
  const digitalSeparatorStyle = project.digitalConfig
    ? getDigitalSeparatorStyle(project.digitalConfig)
    : "colon";
  const canvasCornerRadius = resolveCanvasCornerRadius(project.canvas);
  const canvasShadow = resolveCanvasShadow(project.canvas);
  const updateCanvasShadow = (
    getNext: (shadow: ClockCanvasShadow) => ClockCanvasShadow,
  ) =>
    changeProject((current) => ({
      ...current,
      canvas: {
        ...current.canvas,
        shadow: getNext(resolveCanvasShadow(current.canvas)),
      },
    }));

  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={styles.headerButton}>
          <AppButton
            label="뒤로"
            onPress={() => {
              void saveEditorProject().finally(() => router.back());
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
          <AppButton label="저장" onPress={() => void saveEditorProject()} />
        </View>
      </View>

      <View style={styles.widgetAction}>
        <AddClockWidgetButton
          project={project}
          saveProject={saveEditorProject}
        />
      </View>

      <ClockCanvas
        onSelectLayer={selectLayer}
        onTransformDigital={updateDigital}
        onTransformLayer={updateLayerTransform}
        project={project}
        selectedLayerId={capturingPreview ? null : selectedLayerId}
        snapshotRef={canvasSnapshotRef}
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
          scrollEnabled={!anchorDragging}
        >
          {activeTab === "background" ? (
            <>
              <AppText variant="label">배경색</AppText>
              <View style={styles.wrapRow}>
                {BACKGROUNDS.map((color) => (
                  <AppButton
                    key={color}
                    label={color === "transparent" ? "투명" : color}
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
              <AppText variant="label">배경 박스 모양</AppText>
              <View style={styles.wrapRow}>
                <AppButton
                  label={`모서리 − (${Math.round(canvasCornerRadius)})`}
                  onPress={() =>
                    changeProject((current) => ({
                      ...current,
                      canvas: {
                        ...current.canvas,
                        cornerRadius: Math.max(
                          0,
                          resolveCanvasCornerRadius(current.canvas) - 4,
                        ),
                      },
                    }))
                  }
                  variant="secondary"
                />
                <AppButton
                  label="모서리 +"
                  onPress={() =>
                    changeProject((current) => ({
                      ...current,
                      canvas: {
                        ...current.canvas,
                        cornerRadius: Math.min(
                          Math.min(
                            current.canvas.width,
                            current.canvas.height,
                          ) / 2,
                          resolveCanvasCornerRadius(current.canvas) + 4,
                        ),
                      },
                    }))
                  }
                  variant="secondary"
                />
                <AppButton
                  label={canvasShadow.enabled ? "그림자 끄기" : "그림자 켜기"}
                  onPress={() =>
                    changeProject((current) => {
                      const shadow = resolveCanvasShadow(current.canvas);
                      return {
                        ...current,
                        canvas: {
                          ...current.canvas,
                          shadow: { ...shadow, enabled: !shadow.enabled },
                        },
                      };
                    })
                  }
                  selected={canvasShadow.enabled}
                  variant="secondary"
                />
              </View>
              {canvasShadow.enabled ? (
                <View style={styles.controlGroup}>
                  <AppText tone="secondary" variant="label">
                    그림자 색상
                  </AppText>
                  <View style={styles.wrapRow}>
                    {SHADOW_COLORS.map((color) => (
                      <AppButton
                        key={color.value}
                        label={color.label}
                        onPress={() =>
                          updateCanvasShadow((shadow) => ({
                            ...shadow,
                            color: color.value,
                          }))
                        }
                        selected={canvasShadow.color === color.value}
                        variant="secondary"
                      />
                    ))}
                  </View>
                  <View style={styles.wrapRow}>
                    <AppButton
                      label={`농도 − (${Math.round(canvasShadow.opacity * 100)}%)`}
                      onPress={() =>
                        updateCanvasShadow((shadow) => ({
                          ...shadow,
                          opacity: Math.max(0.04, shadow.opacity - 0.04),
                        }))
                      }
                      variant="secondary"
                    />
                    <AppButton
                      label="농도 +"
                      onPress={() =>
                        updateCanvasShadow((shadow) => ({
                          ...shadow,
                          opacity: Math.min(0.5, shadow.opacity + 0.04),
                        }))
                      }
                      variant="secondary"
                    />
                    <AppButton
                      label={`퍼짐 − (${Math.round(canvasShadow.blur)})`}
                      onPress={() =>
                        updateCanvasShadow((shadow) => ({
                          ...shadow,
                          blur: Math.max(0, shadow.blur - 3),
                        }))
                      }
                      variant="secondary"
                    />
                    <AppButton
                      label="퍼짐 +"
                      onPress={() =>
                        updateCanvasShadow((shadow) => ({
                          ...shadow,
                          blur: Math.min(48, shadow.blur + 3),
                        }))
                      }
                      variant="secondary"
                    />
                  </View>
                  <AppText tone="secondary" variant="label">
                    그림자 위치
                  </AppText>
                  <View style={styles.wrapRow}>
                    <AppButton
                      label={`X − (${Math.round(canvasShadow.offsetX)})`}
                      onPress={() =>
                        updateCanvasShadow((shadow) => ({
                          ...shadow,
                          offsetX: Math.max(-40, shadow.offsetX - 2),
                        }))
                      }
                      variant="secondary"
                    />
                    <AppButton
                      label="X +"
                      onPress={() =>
                        updateCanvasShadow((shadow) => ({
                          ...shadow,
                          offsetX: Math.min(40, shadow.offsetX + 2),
                        }))
                      }
                      variant="secondary"
                    />
                    <AppButton
                      label={`Y − (${Math.round(canvasShadow.offsetY)})`}
                      onPress={() =>
                        updateCanvasShadow((shadow) => ({
                          ...shadow,
                          offsetY: Math.max(-40, shadow.offsetY - 2),
                        }))
                      }
                      variant="secondary"
                    />
                    <AppButton
                      label="Y +"
                      onPress={() =>
                        updateCanvasShadow((shadow) => ({
                          ...shadow,
                          offsetY: Math.min(40, shadow.offsetY + 2),
                        }))
                      }
                      variant="secondary"
                    />
                  </View>
                </View>
              ) : null}
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
              <View style={styles.buttonRow}>
                <View style={styles.rowItem}>
                  <AppButton
                    label="시침 레이어 편집"
                    onPress={() =>
                      editHand(project.analogConfig?.hourHandLayerId, "시침")
                    }
                    selected={
                      selectedLayerId === project.analogConfig?.hourHandLayerId
                    }
                    variant="secondary"
                  />
                </View>
                <View style={styles.rowItem}>
                  <AppButton
                    label="분침 레이어 편집"
                    onPress={() =>
                      editHand(project.analogConfig?.minuteHandLayerId, "분침")
                    }
                    selected={
                      selectedLayerId ===
                      project.analogConfig?.minuteHandLayerId
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
                  onDragStateChange={setAnchorDragging}
                  onCommit={({ pivotX, pivotY, tipX, tipY }) =>
                    updateLayerTransform(selectedLayer.id, {
                      ...selectedLayer.transform,
                      anchorX: pivotX,
                      anchorY: pivotY,
                      tipX,
                      tipY,
                    })
                  }
                  onResize={(factor, axis) =>
                    (() => {
                      const { width, height } = selectedLayer.transform;
                      const endpointDeltaX = Math.abs(
                        (selectedLayer.transform.tipX ?? 0.5) -
                          selectedLayer.transform.anchorX,
                      );
                      const endpointDeltaY = Math.abs(
                        (selectedLayer.transform.tipY ?? 0) -
                          selectedLayer.transform.anchorY,
                      );
                      const lengthUsesWidth = endpointDeltaX > endpointDeltaY;
                      const resizeWidth =
                        axis === "both" ||
                        (axis === "length" && lengthUsesWidth) ||
                        (axis === "thickness" && !lengthUsesWidth);
                      const resizeHeight =
                        axis === "both" ||
                        (axis === "length" && !lengthUsesWidth) ||
                        (axis === "thickness" && lengthUsesWidth);
                      const nextWidth = !resizeWidth
                        ? width
                        : Math.max(
                            12,
                            Math.min(project.canvas.width * 2, width * factor),
                          );
                      const nextHeight = !resizeHeight
                        ? height
                        : Math.max(
                            12,
                            Math.min(
                              project.canvas.height * 2,
                              height * factor,
                            ),
                          );
                      updateLayerTransform(selectedLayer.id, {
                        ...selectedLayer.transform,
                        width: nextWidth,
                        height: nextHeight,
                      });
                    })()
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
              </View>
              <AppText variant="label">시간 구분자</AppText>
              <View style={styles.wrapRow}>
                {SEPARATORS.map((separator) => (
                  <AppButton
                    key={separator.value}
                    label={separator.label}
                    onPress={() =>
                      changeProject((current) => ({
                        ...current,
                        digitalConfig: current.digitalConfig
                          ? {
                              ...current.digitalConfig,
                              colonVisible: separator.value !== "none",
                              separatorStyle: separator.value,
                            }
                          : undefined,
                      }))
                    }
                    selected={digitalSeparatorStyle === separator.value}
                    variant="secondary"
                  />
                ))}
              </View>
              {digitalSeparatorStyle === "image" ? (
                <AppText tone="secondary">
                  구분자 이미지를 사용 중이에요. 위의 문자 구분자를 선택하면
                  이미지 모드가 해제됩니다.
                </AppText>
              ) : null}
              <AppText variant="label">숫자 자리별 위치</AppText>
              <AppText tone="secondary">
                각 자리를 선택한 뒤 캔버스에서 따로 끌어서 배치할 수 있어요.
              </AppText>
              <View style={styles.wrapRow}>
                {DIGITAL_SLOT_IDS.map((slotId) => (
                  <AppButton
                    key={slotId}
                    label={DIGITAL_SLOT_LABELS[slotId]}
                    onPress={() => selectLayer(getDigitalSelectionId(slotId))}
                    selected={selectedDigitalSlotId === slotId}
                    variant="secondary"
                  />
                ))}
                <AppButton
                  label="자리 배치 초기화"
                  onPress={() =>
                    changeProject((current) => ({
                      ...current,
                      digitalConfig: current.digitalConfig
                        ? {
                            ...current.digitalConfig,
                            slotTransforms: undefined,
                          }
                        : undefined,
                    }))
                  }
                  variant="secondary"
                />
              </View>
              {selectedDigitalSlotId && digitalSlotTransforms ? (
                <DigitalSlotEditor
                  canvasHeight={project.canvas.height}
                  canvasWidth={project.canvas.width}
                  label={DIGITAL_SLOT_LABELS[selectedDigitalSlotId]}
                  onChange={(transform) =>
                    updateDigital(selectedDigitalSlotId, transform)
                  }
                  transform={digitalSlotTransforms[selectedDigitalSlotId]}
                />
              ) : null}
              <AppText variant="label">숫자 이미지</AppText>
              <View style={styles.wrapRow}>
                {DIGITS.map((digit) => (
                  <AppButton
                    key={digit}
                    label={digit === "colon" ? "구분자 이미지" : digit}
                    onPress={() => manageDigit(digit)}
                    selected={
                      digit === "colon"
                        ? digitalSeparatorStyle === "image"
                        : Boolean(project.digitalConfig?.digitImageMap[digit])
                    }
                    variant="secondary"
                  />
                ))}
              </View>
            </>
          ) : null}

          {activeTab === "layers" ? (
            <>
              {project.type === "digital" ? (
                <>
                  <AppText variant="label">디지털 숫자 자리</AppText>
                  <View style={styles.wrapRow}>
                    {DIGITAL_SLOT_IDS.map((slotId) => (
                      <AppButton
                        key={slotId}
                        label={DIGITAL_SLOT_LABELS[slotId]}
                        onPress={() =>
                          selectLayer(getDigitalSelectionId(slotId))
                        }
                        selected={selectedDigitalSlotId === slotId}
                        variant="secondary"
                      />
                    ))}
                  </View>
                </>
              ) : null}
              <ClockLayerPanel
                layers={project.layers}
                onEditHand={(layer) => editHand(layer.id, layer.name)}
                onMove={(layerId, direction) =>
                  changeProject((current) => ({
                    ...current,
                    layers: moveLayer(current.layers, layerId, direction),
                  }))
                }
                onReedit={reeditLayer}
                onRemove={removeLayer}
                onSelect={selectLayer}
                onToggleLock={(layerId) =>
                  changeProject((current) => ({
                    ...current,
                    layers: current.layers.map((layer) =>
                      layer.id === layerId
                        ? { ...layer, locked: !layer.locked }
                        : layer,
                    ),
                  }))
                }
                onToggleVisibility={(layerId) =>
                  changeProject((current) => ({
                    ...current,
                    layers: current.layers.map((layer) =>
                      layer.id === layerId
                        ? { ...layer, visible: !layer.visible }
                        : layer,
                    ),
                  }))
                }
                selectedLayerId={selectedLayerId}
              />
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
                    showDialog({
                      title: "설정 검증 완료",
                      message: `네이티브에 전달할 JSON ${json.length.toLocaleString()}자를 만들었어요.`,
                    });
                  } catch (error: unknown) {
                    showDialog({
                      title: "설정 검증 실패",
                      message:
                        error instanceof Error
                          ? error.message
                          : "파일을 확인해 주세요.",
                    });
                  }
                }}
                variant="secondary"
              />
              <ClockWidgetSettings
                project={project}
                saveProject={saveEditorProject}
              />
            </>
          ) : null}
        </ScrollView>
      </View>
    </AppScreen>
  );
};
