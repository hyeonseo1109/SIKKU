import { FlatList, View } from "react-native";

import type {
  DuplicateProjectStatus,
  ProjectIndexItem,
} from "@/entities/clock-project";
import { AppText } from "@/shared/ui";
import { ProjectCard } from "@/widgets/project-card";

import { styles } from "./ProjectList.styles";

export type ProjectListProps = {
  projects: ProjectIndexItem[];
  duplicateStatuses: Record<string, DuplicateProjectStatus>;
  onOpen: (projectId: string) => void;
  onDuplicate: (projectId: string) => void;
  onDelete: (projectId: string) => void;
};

export const ProjectList = ({
  duplicateStatuses,
  onDelete,
  onDuplicate,
  onOpen,
  projects,
}: ProjectListProps) => {
  if (projects.length === 0) {
    return (
      <View style={styles.empty}>
        <AppText variant="heading">아직 만든 시계가 없어요</AppText>
        <AppText tone="secondary">
          첫 번째 시계를 만들고 이미지로 꾸며보세요.
        </AppText>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={projects}
      keyExtractor={(project) => project.id}
      renderItem={({ item }) => (
        <ProjectCard
          duplicateLabel={duplicateStatuses[item.id] ? "복사 중…" : "복제"}
          isDuplicating={Boolean(duplicateStatuses[item.id])}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onOpen={onOpen}
          project={item}
        />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
};
