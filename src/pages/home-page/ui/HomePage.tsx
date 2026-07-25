import { useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { View } from "react-native";

import {
  clearClockWidgetsForProject,
  getClockWidgets,
  isClockWidgetSupported,
} from "@/features/apply-clock-widget";
import { useProjectListStore } from "@/features/manage-clock-projects";
import { AppButton, AppScreen, AppText, useAppDialog } from "@/shared/ui";
import { ProjectList } from "@/widgets/project-list";

import { styles } from "./HomePage.styles";

export const HomePage = () => {
  const router = useRouter();
  const { showDialog } = useAppDialog();
  const projects = useProjectListStore((state) => state.projects);
  const loading = useProjectListStore((state) => state.loading);
  const error = useProjectListStore((state) => state.error);
  const duplicateStatuses = useProjectListStore(
    (state) => state.duplicateStatuses,
  );
  const load = useProjectListStore((state) => state.load);
  const duplicate = useProjectListStore((state) => state.duplicate);
  const remove = useProjectListStore((state) => state.remove);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const confirmDelete = (projectId: string, widgetCount: number) => {
    const message =
      widgetCount > 0
        ? `이 프로젝트를 사용하는 홈 화면 위젯이 ${widgetCount}개 있어요. 프로젝트를 삭제하면 해당 위젯은 설정이 필요한 기본 화면으로 변경됩니다.`
        : "시계와 저장된 이미지를 모두 삭제할까요?";
    showDialog({
      title: "프로젝트 삭제",
      message,
      actions: [
        { label: "취소" },
        {
          label: "삭제",
          tone: "danger",
          onPress: () => {
            void (async () => {
              try {
                const removed = await remove(projectId);
                if (removed && widgetCount > 0) {
                  await clearClockWidgetsForProject(projectId);
                }
              } catch {
                showDialog({
                  title: "위젯 정리 실패",
                  message:
                    "프로젝트는 삭제됐지만 홈 화면 위젯을 정리하지 못했어요.",
                });
              }
            })();
          },
        },
      ],
    });
  };

  const handleDelete = async (projectId: string) => {
    if (!isClockWidgetSupported()) {
      confirmDelete(projectId, 0);
      return;
    }
    try {
      const widgets = await getClockWidgets();
      confirmDelete(
        projectId,
        widgets.filter((widget) => widget.projectId === projectId).length,
      );
    } catch {
      showDialog({
        title: "위젯 상태 확인 실패",
        message:
          "홈 화면 위젯 상태를 확인하지 못해 프로젝트를 삭제하지 않았어요.",
      });
    }
  };

  const handleDuplicate = async (projectId: string) => {
    const succeeded = await duplicate(projectId);
    if (succeeded) {
      showDialog({
        title: "복사 완료",
        message: "시계 복사본을 만들었어요.",
      });
    }
  };

  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <AppText variant="title">시꾸</AppText>
            <AppText tone="secondary">나만의 시계 꾸미기</AppText>
          </View>
          <View style={styles.badge}>
            <AppText variant="label" style={styles.badgeLabel}>
              SIKKU
            </AppText>
          </View>
        </View>
        <AppButton
          label="새 시계 만들기"
          onPress={() => router.push("/create")}
        />
        {error ? <AppText style={styles.error}>{error}</AppText> : null}
      </View>

      <View style={styles.list}>
        {loading && projects.length === 0 ? (
          <View style={styles.loading}>
            <AppText tone="secondary">프로젝트를 불러오는 중…</AppText>
          </View>
        ) : (
          <ProjectList
            duplicateStatuses={duplicateStatuses}
            onDelete={(projectId) => void handleDelete(projectId)}
            onDuplicate={(projectId) => void handleDuplicate(projectId)}
            onOpen={(projectId) =>
              router.push({
                pathname: "/editor/[projectId]",
                params: { projectId },
              })
            }
            projects={projects}
          />
        )}
      </View>
    </AppScreen>
  );
};
