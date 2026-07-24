import { useRouter } from "expo-router";
import { Alert, View } from "react-native";

import { applyClockWidget } from "@/features/apply-clock-widget";
import { useClockTypeSelection } from "@/features/select-clock-type";
import { AppButton, AppScreen, AppText } from "@/shared/ui";
import { ClockPreview } from "@/widgets/clock-preview";

import { styles } from "./EditorPage.styles";

const showPlannedFeature = (feature: string) => {
  Alert.alert("준비 중", `${feature} 기능은 다음 편집 단계에서 추가됩니다.`);
};

export const EditorPage = () => {
  const router = useRouter();
  const selectedType = useClockTypeSelection((state) => state.selectedType);
  const selectType = useClockTypeSelection((state) => state.selectType);

  const handleApplyWidget = async () => {
    try {
      await applyClockWidget("draft-project");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "위젯을 적용할 수 없습니다.";
      Alert.alert("Development Build 필요", message);
    }
  };

  return (
    <AppScreen scrollable>
      <View style={styles.header}>
        <AppButton
          label="뒤로"
          onPress={() => router.back()}
          variant="secondary"
        />
        <AppText variant="heading">시계 편집</AppText>
      </View>

      <ClockPreview type={selectedType} />

      <View style={styles.section}>
        <AppText variant="label">시계 유형</AppText>
        <View style={styles.buttonRow}>
          <View style={styles.rowItem}>
            <AppButton
              label="아날로그"
              onPress={() => selectType("analog")}
              selected={selectedType === "analog"}
              variant="secondary"
            />
          </View>
          <View style={styles.rowItem}>
            <AppButton
              label="디지털"
              onPress={() => selectType("digital")}
              selected={selectedType === "digital"}
              variant="secondary"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <AppButton
          label="이미지 추가"
          onPress={() => showPlannedFeature("이미지 추가")}
          variant="secondary"
        />
        <AppButton
          label="배경 선택"
          onPress={() => showPlannedFeature("배경 선택")}
          variant="secondary"
        />
        <AppButton label="위젯 적용" onPress={handleApplyWidget} />
      </View>
    </AppScreen>
  );
};
