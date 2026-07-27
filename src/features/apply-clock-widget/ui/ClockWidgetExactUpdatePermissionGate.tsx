import { useEffect } from "react";

import { storage } from "@/shared/storage";
import { useAppDialog } from "@/shared/ui";

import {
  canScheduleExactClockWidgetUpdates,
  isClockWidgetSupported,
  requestExactClockWidgetUpdatePermission,
} from "../model/applyClockWidget";

const PERMISSION_GUIDE_SHOWN_KEY =
  "sikku:clock-widget:exact-update-permission-guide-shown";

export const ClockWidgetExactUpdatePermissionGate = () => {
  const { showDialog } = useAppDialog();

  useEffect(() => {
    let active = true;

    const showPermissionGuide = async () => {
      if (
        !isClockWidgetSupported() ||
        canScheduleExactClockWidgetUpdates() ||
        (await storage.getItem<boolean>(PERMISSION_GUIDE_SHOWN_KEY))
      ) {
        return;
      }

      await storage.setItem(PERMISSION_GUIDE_SHOWN_KEY, true);
      if (!active) return;

      showDialog({
        title: "위젯 시간을 정확하게 표시할까요?",
        message:
          "시꾸가 앱을 닫은 뒤에도 홈 위젯의 커스텀 시계를 매분 갱신하려면 Android의 ‘알람 및 리마인더’ 권한이 필요해요. 이 권한은 알림을 보내는 데 사용하지 않아요.",
        actions: [
          { label: "나중에" },
          {
            label: "허용하기",
            onPress: () => {
              void requestExactClockWidgetUpdatePermission().catch(
                (error: unknown) => {
                  console.error(
                    "[ClockWidgetPermission] Failed to open settings",
                    error,
                  );
                },
              );
            },
            tone: "primary",
          },
        ],
      });
    };

    void showPermissionGuide().catch((error: unknown) => {
      console.error("[ClockWidgetPermission] Failed to show guide", error);
    });
    return () => {
      active = false;
    };
  }, [showDialog]);

  return null;
};
