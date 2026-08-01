import { useEffect } from "react";
import { AppState } from "react-native";

import {
  isClockWidgetSupported,
  refreshClockWidgets,
} from "../model/applyClockWidget";

const refreshInstalledWidgets = async () => {
  if (!isClockWidgetSupported()) return;

  try {
    await refreshClockWidgets();
  } catch (error) {
    console.error("[ClockWidgetRefresh] Failed to refresh widgets", error);
  }
};

export const ClockWidgetForegroundRefresh = () => {
  useEffect(() => {
    if (AppState.currentState === "active") {
      void refreshInstalledWidgets();
    }

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshInstalledWidgets();
      }
    });

    return () => subscription.remove();
  }, []);

  return null;
};
