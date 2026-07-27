import { useState } from "react";
import { Platform } from "react-native";

import type { ClockProject } from "@/entities/clock-project";
import {
  isClockWidgetSupported,
  requestClockWidget,
} from "@/features/apply-clock-widget";
import { AppButton, useAppDialog } from "@/shared/ui";

type AddClockWidgetButtonProps = {
  project: ClockProject;
  saveProject: () => Promise<boolean>;
  disabled?: boolean;
  label?: string;
  onCompleted?: () => void | Promise<void>;
  variant?: "primary" | "secondary";
};

export const AddClockWidgetButton = ({
  disabled = false,
  label = "홈 위젯에 추가하기",
  onCompleted,
  project,
  saveProject,
  variant = "primary",
}: AddClockWidgetButtonProps) => {
  const { showDialog } = useAppDialog();
  const [busy, setBusy] = useState(false);

  const addWidget = async () => {
    if (Platform.OS !== "android") {
      showDialog({
        title: "Android 전용 기능",
        message: "홈 화면 위젯은 Android에서 지원해요.",
      });
      return;
    }
    if (!isClockWidgetSupported()) {
      showDialog({
        title: "Development Build 필요",
        message:
          "Expo Go가 아닌 Android Development Build에서 위젯을 추가해 주세요.",
      });
      return;
    }

    setBusy(true);
    try {
      if (!(await saveProject())) {
        throw new Error("프로젝트 저장에 실패했어요.");
      }

      const result = await requestClockWidget(project);
      if (result.status === "unsupported") {
        showDialog({
          title: "런처에서 바로 추가할 수 없어요",
          message: "홈 화면을 길게 눌러 위젯 목록에서 시꾸를 추가해 주세요.",
        });
        return;
      }
      if (result.status === "failed") {
        throw new Error(result.message ?? "위젯 추가 요청에 실패했어요.");
      }

      await onCompleted?.();
    } catch (error: unknown) {
      showDialog({
        title: "위젯을 추가하지 못했어요",
        message: error instanceof Error ? error.message : "다시 시도해 주세요.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppButton
      disabled={disabled || busy}
      label={busy ? "위젯 준비 중…" : label}
      onPress={() => void addWidget()}
      variant={variant}
    />
  );
};
