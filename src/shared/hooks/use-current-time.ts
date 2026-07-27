import { useEffect, useState } from "react";
import { AppState } from "react-native";

const CLOCK_ALIGNMENT_GRACE_MS = 16;

export const useCurrentTime = (enabled = true) => {
  const [date, setDate] = useState(() => new Date());

  useEffect(() => {
    if (!enabled) return;

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const scheduleNextTick = () => {
      setDate(new Date());
      const now = Date.now();
      const delay = 1000 - (now % 1000) + CLOCK_ALIGNMENT_GRACE_MS;
      timeout = setTimeout(scheduleNextTick, delay);
    };
    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active") {
          if (timeout) clearTimeout(timeout);
          scheduleNextTick();
        }
      },
    );

    scheduleNextTick();
    return () => {
      if (timeout) clearTimeout(timeout);
      appStateSubscription.remove();
    };
  }, [enabled]);

  return date;
};
