import { useCallback, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";

import {
  ClockWidgetExactUpdatePermissionGate,
  ClockWidgetForegroundRefresh,
} from "@/features/apply-clock-widget";
import { AppDialogProvider, AppErrorBoundary } from "@/shared/ui";
import { AppLaunchScreen } from "@/widgets/app-launch-screen";

const stackScreenOptions = {
  headerShown: false,
} as const;

export default function RootLayout() {
  const [showLaunchScreen, setShowLaunchScreen] = useState(true);
  const hideLaunchScreen = useCallback(() => setShowLaunchScreen(false), []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <AppErrorBoundary>
        <AppDialogProvider>
          <ClockWidgetExactUpdatePermissionGate />
          <ClockWidgetForegroundRefresh />
          <StatusBar style="dark" />
          <Stack screenOptions={stackScreenOptions} />
          {showLaunchScreen ? (
            <AppLaunchScreen onFinish={hideLaunchScreen} />
          ) : null}
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
