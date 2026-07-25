import { Image } from "expo-image";
import { Pressable, View } from "react-native";

import type { ProjectIndexItem } from "@/entities/clock-project";
import { AppButton, AppText } from "@/shared/ui";

import { styles } from "./ProjectCard.styles";

export type ProjectCardProps = {
  duplicateLabel?: string;
  isDuplicating?: boolean;
  project: ProjectIndexItem;
  onOpen: (projectId: string) => void;
  onDuplicate: (projectId: string) => void;
  onDelete: (projectId: string) => void;
};

const formatUpdatedAt = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "수정 시각 없음"
    : date.toLocaleString("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

export const ProjectCard = ({
  duplicateLabel = "복제",
  isDuplicating = false,
  onDelete,
  onDuplicate,
  onOpen,
  project,
}: ProjectCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardSurface}>
        <Pressable
          accessibilityLabel={`${project.name} 프로젝트 열기`}
          accessibilityRole="button"
          onPress={() => onOpen(project.id)}
          style={styles.preview}
        >
          {project.previewImageUri ? (
            <Image
              contentFit="cover"
              source={project.previewImageUri}
              style={styles.previewImage}
            />
          ) : (
            <View style={styles.placeholder}>
              <AppText variant="heading">
                {project.type === "analog" ? "◷" : "10:09"}
              </AppText>
            </View>
          )}
        </Pressable>

        <View style={styles.content}>
          <View style={styles.meta}>
            <AppText variant="heading">{project.name}</AppText>
            <AppText tone="secondary" variant="label">
              {project.type === "analog" ? "아날로그" : "디지털"} ·{" "}
              {formatUpdatedAt(project.updatedAt)}
            </AppText>
          </View>
          <View style={styles.actions}>
            <View style={styles.action}>
              <AppButton
                label="열기"
                onPress={() => onOpen(project.id)}
                variant="secondary"
              />
            </View>
            <View style={styles.action}>
              <AppButton
                disabled={isDuplicating}
                label={duplicateLabel}
                onPress={() => onDuplicate(project.id)}
                variant="secondary"
              />
            </View>
            <View style={styles.action}>
              <AppButton
                label="삭제"
                onPress={() => onDelete(project.id)}
                variant="secondary"
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
