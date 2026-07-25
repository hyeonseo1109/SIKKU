import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import { TextInput, View } from "react-native";

import type { CanvasPreset, ClockType } from "@/entities/clock-project";
import { createClockProject } from "@/features/create-clock-project";
import { AppButton, AppScreen, AppText, useAppDialog } from "@/shared/ui";

import { styles } from "./CreateProjectPage.styles";

const DEFAULT_PROJECT_NAME = "나의 시계";

const clockTypes: { label: string; value: ClockType }[] = [
  { label: "아날로그", value: "analog" },
  { label: "디지털", value: "digital" },
];

const presets: { label: string; value: CanvasPreset }[] = [
  { label: "정사각형", value: "square" },
  { label: "가로형", value: "landscape" },
  { label: "세로형", value: "portrait" },
];

export const CreateProjectPage = () => {
  const router = useRouter();
  const { showDialog } = useAppDialog();
  const nameRef = useRef(DEFAULT_PROJECT_NAME);
  const [type, setType] = useState<ClockType>("analog");
  const [preset, setPreset] = useState<CanvasPreset>("square");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    const name = nameRef.current.trim();
    if (!name) {
      showDialog({
        title: "이름을 입력해 주세요",
        message: "시계 이름은 비워둘 수 없어요.",
      });
      return;
    }

    setCreating(true);
    try {
      const project = await createClockProject({
        name,
        preset,
        type,
      });
      router.replace({
        pathname: "/editor/[projectId]",
        params: { projectId: project.id },
      });
    } catch (error: unknown) {
      showDialog({
        title: "프로젝트 생성 실패",
        message:
          error instanceof Error
            ? error.message
            : "잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppScreen scrollable>
      <View style={styles.header}>
        <AppButton
          label="취소"
          onPress={() => router.back()}
          variant="secondary"
        />
        <AppText variant="title">새 시계 만들기</AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="label">프로젝트 이름</AppText>
        <TextInput
          accessibilityLabel="프로젝트 이름"
          defaultValue={DEFAULT_PROJECT_NAME}
          onChangeText={(text) => {
            nameRef.current = text;
          }}
          placeholder="나의 시계"
          style={styles.input}
        />
      </View>

      <View style={styles.section}>
        <AppText variant="label">시계 유형</AppText>
        <View style={styles.options}>
          {clockTypes.map((option) => (
            <View key={option.value} style={styles.option}>
              <AppButton
                label={option.label}
                onPress={() => setType(option.value)}
                selected={type === option.value}
                variant="secondary"
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="label">캔버스 비율</AppText>
        <View style={styles.presetOptions}>
          {presets.map((option) => (
            <View key={option.value} style={styles.presetOption}>
              <AppButton
                label={option.label}
                onPress={() => setPreset(option.value)}
                selected={preset === option.value}
                variant="secondary"
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.submit}>
        <AppButton
          disabled={creating}
          label={creating ? "만드는 중…" : "편집 시작"}
          onPress={() => void handleCreate()}
        />
      </View>
    </AppScreen>
  );
};
