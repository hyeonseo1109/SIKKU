import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";

const stackScreenOptions = {
  headerShown: false,
} as const;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DalseoDarling: require("../../public/fonts/DalseoDarling.otf"),
    DalseoHealingBold: require("../../public/fonts/DalseoHealingBold.otf"),
    DalseoHealingMedium: require("../../public/fonts/DalseoHealingMedium.otf"),
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <Stack screenOptions={stackScreenOptions} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
