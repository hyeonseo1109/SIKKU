import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";

import { AppDialogProvider } from "@/shared/ui";

const stackScreenOptions = {
  headerShown: false,
} as const;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    NoonnuBasicGothicRegular: require("../../public/fonts/NoonnuBasicGothicRegular.ttf"),
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <AppDialogProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={stackScreenOptions} />
      </AppDialogProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
