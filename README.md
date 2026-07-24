# 시꾸: 나만의 시계 꾸미기

**SIKKU**는 디지털·아날로그 시계를 꾸미고 완성한 시계를 Android
홈 화면 위젯으로 적용하기 위한 React Native 앱입니다. 현재는 편집기와
네이티브 위젯 기능을 확장할 수 있는 안정적인 기반만 구현합니다.

## 기술 스택

- Expo SDK 57, React Native, Expo Router, TypeScript
- Zustand
- React Native Gesture Handler, Reanimated
- Expo Image, Image Picker, File System
- AsyncStorage
- ESLint, Prettier
- npm

SDK 57은 React Native New Architecture만 사용합니다. 따라서
`newArchEnabled` 플래그는 설정하지 않았습니다. Babel과 Metro도 현재
구성에서는 커스텀이 필요 없어 기본 Expo 설정을 사용합니다.

## 시작하기

Node.js 20.19.4 이상이 필요합니다.

```bash
npm install
npm start
```

플랫폼별 실행:

```bash
npm run android
npm run ios
```

검증:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run doctor
```

패키지 매니저는 npm만 사용합니다. Expo SDK 및 React Native 네이티브
패키지는 `npx expo install <package>`로 설치해 SDK 호환 버전을
선택합니다. `.npmrc`는 네이티브 전용 프로젝트에서 Expo의 선택적 웹
peer인 ReactDOM이 자동 설치되는 것을 막기 위해
`legacy-peer-deps=true`를 사용합니다.

## 구조와 의존성

```text
src/
├── app/                    # Expo Router route entry
├── pages/                  # 화면 조합
├── widgets/                # 독립적인 큰 UI 블록
├── features/               # 사용자 행동
├── entities/               # 핵심 데이터 모델과 상태
└── shared/
    ├── config/theme/       # React Native 디자인 토큰
    ├── native/             # 네이티브 호출 어댑터
    ├── storage/            # AsyncStorage 어댑터
    └── ui/                 # 최소 공통 UI
modules/
└── clock-widget/           # 향후 로컬 Expo Module 경계
```

FSD 의존성은 `app → pages → widgets → features → entities → shared`
방향만 허용합니다. Slice 외부에서는 각 `index.ts` public API를
사용합니다. Expo Router의 `src/app`은 라우트만 포함하고 실제 UI는
`src/pages`에 둡니다.

Alias:

| Alias         | 경로             |
| ------------- | ---------------- |
| `@/*`         | `src/*`          |
| `@app/*`      | `src/app/*`      |
| `@pages/*`    | `src/pages/*`    |
| `@widgets/*`  | `src/widgets/*`  |
| `@features/*` | `src/features/*` |
| `@entities/*` | `src/entities/*` |
| `@shared/*`   | `src/shared/*`   |

## React Native 스타일

웹 CSS와 Vanilla Extract는 제거했습니다. React Native는 CSS 변수,
브라우저 reset, class name을 사용하지 않으므로 기존 스타일 도구를
유지하면 실행 환경과 타입 모델이 섞이기 때문입니다.

화면과 컴포넌트 스타일은 `Component.tsx`와
`Component.styles.ts`로 나누고 `StyleSheet.create()`와
`src/shared/config/theme`의 숫자 기반 토큰을 사용합니다. CSS 단위,
CSS module, styled-components, Tailwind는 사용하지 않습니다.

기존 Vite 진입점, ReactDOM, HTML, Vanilla Extract 전역 스타일,
웹 전용 자산·설정·DOM 타입은 모두 제거했습니다. 라우팅은
Expo Router, 저장 경계는 AsyncStorage, 네이티브 UI는 View/Text/
Pressable/SafeAreaView로 교체했습니다.

## Expo Go와 Development Build

현재의 홈/편집기 UI, 상태 선택, JavaScript 기반 개발은 Expo Go에서
실행할 수 있습니다. 실제 Kotlin Expo Module과 `AppWidgetProvider`가
추가되면 Expo Go 바이너리에 해당 네이티브 코드가 없으므로
Development Build가 필요합니다.

네이티브 작업을 시작할 때만 다음을 실행합니다.

```bash
npx expo prebuild
npx expo run:android
```

현재는 managed 상태를 유지하며 `android/`, `ios/` 폴더를 생성하지
않습니다. Android package와 iOS bundle identifier도 사용자
namespace가 정해질 때 `app.json`에 추가해야 합니다.

## Android 위젯 아키텍처

React Native는 편집 UI, 프로젝트 모델, 직렬화된 설정 전달을
담당합니다. Kotlin은 AppWidget 생명주기, 인스턴스별 저장, Bitmap
합성, `RemoteViews` 갱신을 담당합니다.

예정된 책임:

- `ClockWidgetModule.kt`: Expo Module API
- `ClockWidgetProvider.kt`: AppWidget 생명주기
- `ClockWidgetUpdater.kt`: 특정/전체 위젯 갱신
- `ClockWidgetRenderer.kt`: 시계 렌더링 조정
- `BitmapComposer.kt`: 이미지 레이어 합성
- `WidgetConfigRepository.kt`: `appWidgetId`별 설정 저장

React Native 코드는 Kotlin 구현을 직접 참조하지 않고
`src/shared/native/clock-widget` 어댑터만 호출합니다. 현재 어댑터는
성공을 흉내 내지 않고 명시적인 미지원 오류를 반환합니다.

레이어 좌표와 크기는 캔버스 픽셀 좌표, 회전은 시계 방향 degree,
`anchorX`/`anchorY`는 레이어 경계 기준 `0–1` 정규화 값으로
정의합니다. 모델은 JSON 직렬화 가능한 값만 가집니다.

Image Picker가 반환한 캐시 URI를 위젯 설정에 영구 저장하면 안 됩니다.
향후 File System 계층에서 앱 영구 저장소로 복사한 뒤 Kotlin이 접근
가능한 URI와 메타데이터를 전달해야 합니다. 위젯 설정은 단일 전역
값이 아니라 `appWidgetId`별로 저장합니다.

## 현재 범위와 다음 작업

구현됨:

- 홈 화면과 `/editor` 라우팅
- 아날로그/디지털 최소 미리보기와 유형 선택
- 공통 화면·텍스트·버튼
- 프로젝트, 레이어, 위젯 설정 타입
- Zustand 상태 경계와 AsyncStorage 어댑터
- 네이티브 위젯 어댑터 및 로컬 모듈 예정 위치

아직 구현하지 않음:

- 이미지 선택·영구 파일 복사
- 레이어 이동/확대/회전/순서 변경
- 프로젝트 저장 및 복원 흐름
- 완성 이미지 렌더링
- Kotlin Expo Module과 Android AppWidget
- Android package 및 iOS bundle identifier 확정

다음 단계는 편집기 도메인 동작과 영구 저장을 구현한 뒤, Android
namespace를 결정하고 `modules/clock-widget`을 실제 로컬 Expo Module로
전환하는 것입니다.
