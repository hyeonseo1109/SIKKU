import type { ClockWidgetNativeModule } from "./ClockWidgetNative.types";

export class ClockWidgetUnavailableError extends Error {
  constructor() {
    super(
      "Android 위젯 모듈은 아직 연결되지 않았습니다. Development Build에서 로컬 Expo Module을 추가한 뒤 사용할 수 있습니다.",
    );
    this.name = "ClockWidgetUnavailableError";
  }
}

const unavailable = async (): Promise<never> => {
  throw new ClockWidgetUnavailableError();
};

export const clockWidgetNative: ClockWidgetNativeModule = {
  saveWidgetConfig: unavailable,
  updateWidget: unavailable,
};
