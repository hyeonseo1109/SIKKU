# 제3자 SDK 목록

| SDK                           | 용도                              | 라이선스 | 앱 코드 기준 네트워크/수집 |
| ----------------------------- | --------------------------------- | -------- | -------------------------- |
| Expo SDK/Modules/Router       | 앱 런타임·라우팅·파일·선택기      | MIT      | 별도 분석/광고 코드 없음   |
| React / React Native          | UI 런타임                         | MIT      | 자체 수집 기능 없음        |
| AsyncStorage                  | 프로젝트 인덱스                   | MIT      | 로컬 저장                  |
| React Native Skia             | 캔버스·PNG 처리                   | MIT      | 로컬 처리                  |
| Reanimated / Gesture Handler  | 편집 제스처                       | MIT      | 자체 수집 기능 없음        |
| Zustand                       | 상태 관리                         | MIT      | 자체 수집 기능 없음        |
| Expo Image Picker/Manipulator | 시스템 사진 선택·크기/방향 정규화 | MIT      | 로컬 처리                  |

analytics, 광고, crash reporting, 로그인, 원격 이미지 SDK는 설치되어 있지 않다. 제출 전 production AAB의 실제 dependency를 다시 확인한다.
