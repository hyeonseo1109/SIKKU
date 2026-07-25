import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { View } from "react-native";

import {
  projectAssetRepository,
  useClockProjectStore,
} from "@/entities/clock-project";
import {
  createAutoBackgroundPng,
  createAutoBackgroundPngFromBytes,
  createLassoPng,
} from "@/features/apply-lasso-mask";
import { useImageLassoStore } from "@/features/select-image-area";
import { applyImageAsset, usePendingImageStore } from "@/features/select-image";
import type { Size } from "@/shared/lib/geometry";
import { isValidPolygon } from "@/shared/lib/geometry";
import { AppButton, AppScreen, AppText, useAppDialog } from "@/shared/ui";
import { ImageLassoEditor } from "@/widgets/image-lasso-editor";

import { styles } from "./ImageLassoPage.styles";

export const ImageLassoPage = () => {
  const router = useRouter();
  const { showDialog } = useAppDialog();
  const pending = usePendingImageStore((state) => state.pending);
  const clearPending = usePendingImageStore((state) => state.clear);
  const project = useClockProjectStore((state) => state.project);
  const changeProject = useClockProjectStore((state) => state.changeProject);
  const regions = useImageLassoStore((state) => state.regions);
  const restore = useImageLassoStore((state) => state.restore);
  const undo = useImageLassoStore((state) => state.undo);
  const reset = useImageLassoStore((state) => state.reset);
  const [size, setSize] = useState<Size>({ width: 1, height: 1 });
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    restore(
      pending?.asset.lassoRegions ??
        (pending?.asset.lassoPoints ? [pending.asset.lassoPoints] : []),
    );
    return () => reset();
  }, [pending?.asset.lassoPoints, pending?.asset.lassoRegions, reset, restore]);

  const cancel = async () => {
    if (
      pending &&
      !project?.assets.some((asset) => asset.id === pending.asset.id)
    ) {
      await projectAssetRepository.removeAsset(
        pending.projectId,
        pending.asset,
      );
    }
    clearPending();
    router.back();
  };

  const apply = async () => {
    if (!pending || !project || pending.projectId !== project.id) {
      showDialog({
        title: "편집 정보 없음",
        message: "이미지를 다시 선택해 주세요.",
      });
      return;
    }
    if (!regions.some(isValidPolygon)) {
      showDialog({
        title: "선택 영역이 너무 작아요",
        message: "사용할 영역의 테두리를 조금 더 크게 그려주세요.",
      });
      return;
    }

    setApplying(true);
    try {
      const cropped = await createLassoPng(pending.asset, regions);
      const saved = await projectAssetRepository.saveProcessedImage(
        project.id,
        pending.asset,
        cropped.bytes,
        regions,
      );
      const processed = {
        ...saved,
        width: cropped.width,
        height: cropped.height,
        originalWidth: pending.asset.originalWidth ?? pending.asset.width,
        originalHeight: pending.asset.originalHeight ?? pending.asset.height,
        cropBounds: cropped.cropBounds,
      };
      changeProject((current) =>
        applyImageAsset(current, processed, pending.target),
      );
      clearPending();
      router.back();
    } catch (error: unknown) {
      console.error("[ImageLasso] Failed to apply mask", error);
      showDialog({
        title: "투명 PNG 생성 실패",
        message:
          error instanceof Error
            ? error.message
            : "잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setApplying(false);
    }
  };

  const applyAutoBackgroundRemoval = async () => {
    if (!pending || !project || pending.projectId !== project.id) {
      showDialog({
        title: "편집 정보 없음",
        message: "이미지를 다시 선택해 주세요.",
      });
      return;
    }
    setApplying(true);
    try {
      const hasSelection = regions.some(isValidPolygon);
      const cropped = hasSelection
        ? await createLassoPng(pending.asset, regions)
        : null;
      const bytes = cropped
        ? createAutoBackgroundPngFromBytes(cropped.bytes)
        : await createAutoBackgroundPng(pending.asset);
      const saved = await projectAssetRepository.saveProcessedImage(
        project.id,
        pending.asset,
        bytes,
        hasSelection ? regions : [],
        "auto",
      );
      const processed = cropped
        ? {
            ...saved,
            width: cropped.width,
            height: cropped.height,
            originalWidth: pending.asset.originalWidth ?? pending.asset.width,
            originalHeight:
              pending.asset.originalHeight ?? pending.asset.height,
            cropBounds: cropped.cropBounds,
          }
        : {
            ...saved,
            width: pending.asset.originalWidth ?? pending.asset.width,
            height: pending.asset.originalHeight ?? pending.asset.height,
            cropBounds: undefined,
          };
      changeProject((current) =>
        applyImageAsset(current, processed, pending.target),
      );
      clearPending();
      router.back();
    } catch (error: unknown) {
      console.error("[AutoBackground] Failed to remove background", error);
      showDialog({
        title: "자동 배경 제거 실패",
        message: error instanceof Error ? error.message : "다시 시도해 주세요.",
      });
    } finally {
      setApplying(false);
    }
  };

  if (!pending) {
    return (
      <AppScreen>
        <View style={styles.missing}>
          <AppText variant="heading">편집할 이미지가 없어요</AppText>
          <AppButton label="돌아가기" onPress={() => router.back()} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <AppText variant="heading">사용할 영역 선택</AppText>
        <AppText tone="secondary">
          영역을 여러 번 둘러 그리면 선택 범위가 계속 더해져요. 선택 영역 바깥은
          투명하게 만들어져요.
        </AppText>
      </View>

      <View style={styles.editor}>
        <ImageLassoEditor
          asset={pending.asset}
          onLayout={(event) =>
            setSize({
              width: event.nativeEvent.layout.width,
              height: event.nativeEvent.layout.height,
            })
          }
          size={size}
        />
      </View>

      <AppButton
        disabled={applying}
        label={
          applying
            ? "처리 중…"
            : regions.some(isValidPolygon)
              ? "선택 영역 잘라서 자동 배경 제거"
              : "전체 이미지 자동 배경 제거"
        }
        onPress={() => void applyAutoBackgroundRemoval()}
        variant="secondary"
      />

      <View style={styles.actions}>
        <View style={styles.action}>
          <AppButton
            label="취소"
            onPress={() => void cancel()}
            variant="secondary"
          />
        </View>
        <View style={styles.action}>
          <AppButton label="초기화" onPress={reset} variant="secondary" />
        </View>
        <View style={styles.action}>
          <AppButton label="실행 취소" onPress={undo} variant="secondary" />
        </View>
      </View>
      <AppButton
        disabled={applying || !regions.some(isValidPolygon)}
        label={applying ? "PNG 만드는 중…" : "선택 영역 적용"}
        onPress={() => void apply()}
      />
    </AppScreen>
  );
};
