import { useEffect, useState } from "react";

export const useCurrentTime = (enabled = true) => {
  const [date, setDate] = useState(() => new Date());

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const interval = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(interval);
  }, [enabled]);

  return date;
};
