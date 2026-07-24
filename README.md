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
└── clock-widget/           # Android AppWidget 로컬 Expo Module
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

편집기 대부분은 Expo Go에서 확인할 수 있지만, 홈 화면 위젯은 앱에
포함된 Kotlin 코드와 `AppWidgetProvider`를 사용하므로 Android
Development Build가 필요합니다.

```bash
npx expo prebuild --platform android
npm run android
```

`android/`는 CNG로 생성되는 산출물이라 Git에 저장하지 않습니다.
네이티브 원본은 `app.json`과 `modules/clock-widget`에 있습니다.
Expo Go에서는 위젯 영역이 Development Build가 필요하다는 안내를
표시하며 성공한 것처럼 동작하지 않습니다.

## 구현된 사용자 흐름

- 프로젝트 이름, 아날로그/디지털 유형, 정사각형·가로형·세로형 생성
- 프로젝트 목록, 재진입, 독립 파일 복제, 확인 후 삭제
- 배경색·배경 이미지·장식 이미지 추가
- 이미지 전체 사용 또는 여러 번 더해 그리는 자유곡선 올가미 선택
- 올가미 경계로 실제 캔버스를 잘라낸 PNG와 선택 후 자동 배경 제거
- pan/pinch/rotation 동시 제스처, 레이어 잠금·숨김·삭제·순서 변경
- 시침·분침의 중심축·방향 꼭짓점 드래그, 중심 고정 비율 크기 조절
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
정규화됩니다. 여러 번 둘러 그린 영역은 합집합으로 계속 추가되며
프로젝트에는 적용 완료 후에만 저장됩니다. 이미지 가장자리와 연결된
유사 배경색은 Expo Go에서도 자동으로 투명 처리할 수 있습니다. 사람,
동물, 복잡한 사물을 의미 단위로 분리하는 ML 모델은 향후 Development
Build 네이티브 모듈 범위입니다.

## Android 위젯 아키텍처

React Native는 편집 UI, 프로젝트 모델, 직렬화된 설정 전달을
담당합니다. Kotlin은 AppWidget 생명주기, 인스턴스별 저장, Bitmap
합성, `RemoteViews` 갱신을 담당합니다.

각 클래스는 다음 한 가지 책임을 가집니다.

- `ClockWidgetModule.kt`: Expo Module API
- `ClockWidgetProvider.kt`: AppWidget 생명주기
- `ClockWidgetUpdater.kt`: 특정/전체 위젯 갱신
- `ClockWidgetRenderer.kt`: 시계 렌더링 조정
- `BitmapComposer.kt`: 이미지 레이어 합성
- `AnalogClockRenderer.kt`: 시침·분침 시간 회전
- `DigitalClockRenderer.kt`: 숫자 이미지와 fallback 문자 배치
- `ClockMath.kt`: 각도와 다음 분 경계 순수 계산
- `WidgetUpdateScheduler.kt`: 앱 전체에 하나인 다음 분 알람
- `WidgetConfigRepository.kt`: `appWidgetId`별 설정 저장

React Native 코드는 Kotlin 구현을 직접 참조하지 않고
`src/shared/native/clock-widget` 어댑터만 호출합니다.

레이어 좌표와 크기는 캔버스 픽셀 좌표, 회전은 시계 방향 degree,
`anchorX`/`anchorY`는 레이어 경계 기준 `0–1` 정규화 값으로
정의합니다. 모델은 JSON 직렬화 가능한 값만 가집니다.

`src/features/export-widget-config`는 최종 가공 이미지 경로와 논리
transform을 JSON 직렬화 가능한 데이터로 변환합니다. 숨김 레이어를
제외하고 zIndex를 정렬하며, picker 캐시나 사라진 파일은 내보내지 않고
오류로 안내합니다. Kotlin은 올가미를 다시 계산하지 않고 완성된 PNG를
사용하면 됩니다.

### 위젯 적용과 저장

편집기의 `새 위젯 추가`는 Android 8 이상에서 런처의 pin 확인창을
요청합니다. 런처 목록에서 직접 추가한 미설정 위젯은 편집기에서
`이 시계로 연결`할 수 있습니다. 설정은
`sikku_clock_widgets` SharedPreferences에 `appWidgetId`별로 저장되어
여러 크기와 여러 프로젝트를 독립적으로 처리합니다.

프로젝트 저장 후 `기존 위젯 업데이트`를 누르면 같은 `projectId`의
인스턴스만 각각의 현재 크기로 다시 렌더링합니다. 프로젝트 삭제 전에는
사용 중인 위젯 수를 안내하고, 삭제된 프로젝트의 위젯은 설정 JSON을
정리한 뒤 기본 안내 화면으로 전환합니다. 홈 화면에서 위젯을 제거하면
해당 ID의 설정만 삭제합니다.

### 렌더링과 갱신 정책

Kotlin은 투명 ARGB Bitmap에 배경과 zIndex 순서의 레이어를 합성합니다.
아날로그 바늘은 사용자 rotation, anchor→tip 방향 보정, 현재 시간
회전을 합산합니다. 디지털 시계는 `HH:mm`/`h:mm`, 콜론, 간격과 전체
transform을 적용하며 누락된 숫자는 시스템 글꼴로 표시합니다.
배경 이미지는 앱 미리보기처럼 중앙 `cover` 규칙을 사용합니다.

리사이즈 시 `onAppWidgetOptionsChanged`에서 새 Bitmap을 만들며 단순
확대하지 않습니다. 시간은 모든 인스턴스가 공유하는 한 개의 one-shot
AlarmManager 예약으로 다음 분 경계마다 갱신하고 실행 후 다음 예약을
만듭니다. Android 12 이상에서 정확한 알람 권한이 허용되지 않으면
`setAndAllowWhileIdle`로 자동 대체되므로 절전 상태에서는 갱신이 다소
늦을 수 있습니다. 재부팅, 앱 교체, 시스템 시간·시간대 변경 시 저장된
설정을 다시 렌더링하고 예약을 복원합니다.

현재 네이티브 위젯은 Android 전용이며 iOS WidgetKit은 범위에 포함하지
않습니다.
