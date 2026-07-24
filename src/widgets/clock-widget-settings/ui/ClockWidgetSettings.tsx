import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, View } from "react-native";

import type { ClockProject } from "@/entities/clock-project";
import {
  configureUnassignedClockWidgets,
  getClockWidgets,
  isClockWidgetSupported,
  requestClockWidget,
  updateClockWidgets,
} from "@/features/apply-clock-widget";
import type { InstalledClockWidget } from "@/shared/native/clock-widget";
import { AppButton, AppText } from "@/shared/ui";

import { styles } from "./ClockWidgetSettings.styles";

type Props = {
  project: ClockProject;
  saveProject: () => Promise<boolean>;
};

export const ClockWidgetSettings = ({ project, saveProject }: Props) => {
  const supported = isClockWidgetSupported();
  const [widgets, setWidgets] = useState<InstalledClockWidget[]>([]);
  const [busy, setBusy] = useState(false);
  const projectWidgets = useMemo(
    () => widgets.filter((widget) => widget.projectId === project.id),
    [project.id, widgets],
  );
  const unassignedWidgets = useMemo(
    () => widgets.filter((widget) => !widget.configured),
    [widgets],
  );

  const refresh = useCallback(async () => {
    if (!supported) return;
    setWidgets(await getClockWidgets());
  }, [supported]);

  useEffect(() => {
    if (!supported) return;
    let active = true;
    void getClockWidgets()
      .then((installed) => {
        if (active) setWidgets(installed);
      })
      .catch((error: unknown) => {
        console.error("[ClockWidgetSettings] Failed to load widgets", error);
      });
    return () => {
      active = false;
    };
  }, [supported]);

  const runSavedAction = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      if (!(await saveProject())) {
        throw new Error("프로젝트 저장에 실패했어요.");
      }
      await action();
      await refresh();
    } catch (error: unknown) {
      Alert.alert(
        "위젯 작업 실패",
        error instanceof Error ? error.message : "다시 시도해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  };

  const requestPin = () =>
    runSavedAction(async () => {
      const result = await requestClockWidget(project);
      if (result.status === "unsupported") {
        Alert.alert(
          "런처에서 지원하지 않아요",
          "홈 화면을 길게 눌러 위젯 목록에서 시꾸를 추가해 주세요.",
        );
        return;
      }
      if (result.status === "failed") {
        throw new Error(result.message ?? "위젯 추가 요청에 실패했어요.");
      }
      Alert.alert(
        "위젯 추가 요청됨",
        "홈 화면의 확인 창에서 시꾸 위젯을 추가해 주세요.",
      );
    });

  const updateExisting = () =>
    runSavedAction(async () => {
      const updatedIds = await updateClockWidgets(project);
      Alert.alert(
        "위젯 업데이트 완료",
        `${updatedIds.length}개의 홈 화면 위젯을 업데이트했어요.`,
      );
    });

  const configureUnassigned = () =>
    runSavedAction(async () => {
      const configuredIds = await configureUnassignedClockWidgets(project);
      Alert.alert(
        "위젯 연결 완료",
        `${configuredIds.length}개의 위젯에 이 시계를 적용했어요.`,
      );
    });

  const latestUpdate = projectWidgets.reduce<number | undefined>(
    (latest, widget) =>
      widget.updatedAt && (!latest || widget.updatedAt > latest)
        ? widget.updatedAt
        : latest,
    undefined,
  );

  if (Platform.OS !== "android") {
    return (
      <AppText tone="secondary">
        홈 화면 위젯은 현재 Android에서만 지원해요.
      </AppText>
    );
  }

  if (!supported) {
    return (
      <AppText tone="secondary">
        홈 화면 위젯은 Expo Go가 아닌 Android Development Build에서 사용할 수
        있어요.
      </AppText>
    );
  }

  return (
    <View style={styles.container}>
      <AppText variant="label">홈 화면 위젯</AppText>
      <AppText tone="secondary">
        이 프로젝트로 사용 중인 위젯 {projectWidgets.length}개
      </AppText>
      <AppText tone="secondary">
        {latestUpdate
          ? `마지막 업데이트: ${new Date(latestUpdate).toLocaleString()}`
          : "아직 적용된 위젯이 없어요."}
      </AppText>
      {projectWidgets.map((widget, index) => (
        <AppText key={widget.appWidgetId} tone="secondary">
          위젯 {index + 1} · {widget.width ?? "?"}×{widget.height ?? "?"} · 정상
        </AppText>
      ))}
      {unassignedWidgets.length > 0 ? (
        <View>
          <AppText tone="secondary">
            설정이 필요한 위젯 {unassignedWidgets.length}개
          </AppText>
          <AppButton
            disabled={busy}
            label="이 시계로 연결"
            onPress={() => void configureUnassigned()}
            variant="secondary"
          />
        </View>
      ) : null}
      <View style={styles.row}>
        <View style={styles.action}>
          <AppButton
            disabled={busy}
            label={busy ? "처리 중…" : "새 위젯 추가"}
            onPress={() => void requestPin()}
          />
        </View>
        <View style={styles.action}>
          <AppButton
            disabled={busy || projectWidgets.length === 0}
            label="기존 위젯 업데이트"
            onPress={() => void updateExisting()}
            variant="secondary"
          />
        </View>
      </View>
    </View>
  );
};
