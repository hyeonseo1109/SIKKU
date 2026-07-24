# Clock Widget local Expo module

Android 홈 화면 AppWidget을 제공하는 로컬 Expo Module입니다.

- `ClockWidgetModule`: React Native 브리지
- `ClockWidgetProvider`: 위젯 수명주기와 리사이즈
- `ClockWidgetUpdater`: `RemoteViews` 갱신과 fallback
- `ClockWidgetRenderer`: 렌더러 조합
- `AnalogClockRenderer` / `DigitalClockRenderer`: 시계 유형별 렌더링
- `BitmapComposer`: Bitmap 레이어 합성
- `WidgetConfigParser`: 방어적 JSON·파일 검증
- `WidgetConfigRepository`: `appWidgetId`별 영속 설정
- `WidgetUpdateScheduler`: 앱 전체가 공유하는 다음 분 갱신

앱의 `android/` 디렉터리는 CNG 산출물입니다. 네이티브 변경은 이
모듈에 작성한 뒤 아래 명령으로 Development Build에 반영합니다.

```bash
npx expo prebuild --platform android
npm run android
```

순수 시간·각도 계산 테스트:

```bash
cd android
./gradlew :clock-widget:testDebugUnitTest
```
