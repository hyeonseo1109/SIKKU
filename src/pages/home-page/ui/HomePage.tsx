import { useRouter } from "expo-router";
import { View } from "react-native";

import { AppButton, AppScreen, AppText } from "@/shared/ui";

import { styles } from "./HomePage.styles";

export const HomePage = () => {
  const router = useRouter();

  return (
    <AppScreen>
      <View style={styles.content}>
        <View style={styles.intro}>
          <View style={styles.badge}>
            <AppText variant="label" style={styles.badgeLabel}>
              SIKKU
            </AppText>
          </View>
          <AppText variant="title">시꾸</AppText>
          <AppText tone="secondary">나만의 시계 꾸미기</AppText>
        </View>
        <AppButton
          label="시계 만들기"
          onPress={() => router.navigate("/editor")}
        />
      </View>
    </AppScreen>
  );
};
