import { useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Alert, View } from "react-native";

import { useProjectListStore } from "@/features/manage-clock-projects";
import { AppButton, AppScreen, AppText } from "@/shared/ui";
import { ProjectList } from "@/widgets/project-list";

import { styles } from "./HomePage.styles";

export const HomePage = () => {
  const router = useRouter();
  const projects = useProjectListStore((state) => state.projects);
  const loading = useProjectListStore((state) => state.loading);
  const error = useProjectListStore((state) => state.error);
  const load = useProjectListStore((state) => state.load);
  const duplicate = useProjectListStore((state) => state.duplicate);
  const remove = useProjectListStore((state) => state.remove);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleDelete = (projectId: string) => {
    Alert.alert("프로젝트 삭제", "시계와 저장된 이미지를 모두 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => void remove(projectId),
      },
    ]);
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
            onDelete={handleDelete}
            onDuplicate={(projectId) => void duplicate(projectId)}
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
