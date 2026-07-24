# 시꾸: 나만의 시계 꾸미기

**SIKKU**는 디지털·아날로그 시계를 직접 꾸미는 React Native
편집기입니다. 프로젝트 생성부터 이미지 올가미 편집, 실제 시간
미리보기, 로컬 저장과 Kotlin 전달용 설정 생성까지 구현되어 있습니다.

## 기술 스택

- Expo SDK 57, React Native, Expo Router, TypeScript
- Zustand
- React Native Gesture Handler, Reanimated
- Expo Image, Image Picker, File System
- React Native Skia(올가미 마스크와 투명 PNG 생성)
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

현재 사용 중인 Skia 2.6.2는 Expo SDK 57의 Expo Go에 포함되어 있어
프로젝트 관리, 편집 제스처와 올가미 PNG 생성을 Expo Go에서 확인할 수
있습니다. 실제 Kotlin Expo Module과 `AppWidgetProvider`가 추가되면
Expo Go 바이너리에 해당 네이티브 코드가 없으므로 Development Build가
필요합니다.

네이티브 작업을 시작할 때만 다음을 실행합니다.

```bash
npx expo prebuild
npx expo run:android
```

현재는 managed 상태를 유지하며 `android/`, `ios/` 폴더를 생성하지
않습니다. Android package와 iOS bundle identifier도 사용자
namespace가 정해질 때 `app.json`에 추가해야 합니다.

## 구현된 사용자 흐름

- 프로젝트 이름, 아날로그/디지털 유형, 정사각형·가로형·세로형 생성
- 프로젝트 목록, 재진입, 독립 파일 복제, 확인 후 삭제
- 배경색·배경 이미지·장식 이미지 추가
- 이미지 전체 사용 또는 자유곡선 올가미 선택
- Skia offscreen surface에서 선택 외부 alpha를 제거한 실제 PNG 생성
- pan/pinch/rotation 동시 제스처, 레이어 잠금·숨김·삭제·순서 변경
- 시침·분침의 정규화 anchor 드래그와 현재/지정 시간 미리보기
- 숫자 0–9 및 콜론 이미지, fallback 문자, 12/24시간, 간격과 표시 변형
- 최대 30단계 undo/redo, 750ms 자동 저장, 명시적 저장
- 숨김 레이어를 제외하고 파일을 검증하는 Kotlin 전달 JSON 생성

## 데이터와 파일 저장

AsyncStorage에는 `sikku.project-index.v1` 프로젝트 인덱스만 저장합니다.
프로젝트 상세 데이터와 이미지는 Expo File System의 앱 document
directory에 저장합니다.

```text
documentDirectory/
└── projects/
    └── {projectId}/
        ├── project.json
        └── assets/
            ├── originals/
            └── processed/
```

Image Picker의 임시 URI는 저장하지 않습니다. 선택 즉시
`originals/`로 복사하며, 올가미 결과는 원본을 덮어쓰지 않고
`processed/lasso-*.png`로 저장합니다. 복제 시 프로젝트 디렉터리와
asset/layer ID를 모두 새로 만들고 모든 URI를 복제본 경로로 치환합니다.

프로젝트 `schemaVersion`은 현재 1이며 읽기 시 migration 진입점과
런타임 검증을 거칩니다. 손상된 프로젝트 하나는 목록 로딩에서
제외되어 다른 프로젝트를 막지 않습니다. 홈 미리보기 PNG 생성은
안정성을 위해 아직 선택 사항으로 두며, 없을 때 카드는 placeholder를
사용합니다.

## 좌표와 제스처 규칙

저장되는 좌표는 기기 화면 픽셀이 아닌 preset 논리 좌표입니다.
정사각형 400×400, 가로형 600×400, 세로형 400×600이며 화면에는
공통 geometry 함수로 scale을 적용합니다. 레이어의 `x`, `y`는 중심,
`width`, `height`는 논리 크기, `rotation`은 시계 방향 degree입니다.
`anchorX`, `anchorY`는 이미지 내부 0–1 값이며 `(0.5, 1)`은 아래
중앙을 뜻합니다.

Gesture Handler의 `Gesture.Pan()`, `Gesture.Pinch()`,
`Gesture.Rotation()`을 동시에 구성합니다. 진행 중에는 Reanimated
shared value만 갱신하고 손을 뗄 때 최종 논리 transform 한 번만
Zustand history에 commit합니다. 올가미 점도 원본 이미지 기준 0–1로
정규화되며 프로젝트에는 적용 완료 후에만 저장됩니다.

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

`src/features/export-widget-config`는 최종 가공 이미지 경로와 논리
transform을 JSON 직렬화 가능한 데이터로 변환합니다. 숨김 레이어를
제외하고 zIndex를 정렬하며, picker 캐시나 사라진 파일은 내보내지 않고
오류로 안내합니다. Kotlin은 올가미를 다시 계산하지 않고 완성된 PNG를
사용하면 됩니다.

아직 구현하지 않은 범위는 실제 Kotlin Expo Module,
`AppWidgetProvider`, `RemoteViews`, iOS WidgetKit과 프로젝트 카드용
자동 preview 캡처입니다. Android namespace를 결정한 뒤
`modules/clock-widget`을 실제 로컬 Expo Module로 전환하는 것이 다음
단계입니다.
