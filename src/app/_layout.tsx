import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";

import { ClockWidgetExactUpdatePermissionGate } from "@/features/apply-clock-widget";
import { AppDialogProvider, AppErrorBoundary } from "@/shared/ui";

const stackScreenOptions = {
  headerShown: false,
} as const;

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AppErrorBoundary>
        <AppDialogProvider>
          <ClockWidgetExactUpdatePermissionGate />
          <StatusBar style="dark" />
          <Stack screenOptions={stackScreenOptions} />
        </AppDialogProvider>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
