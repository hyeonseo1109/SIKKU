# Google Play 및 앱 에셋 준비 목록

현재 저장소에는 출시용 `icon`, `adaptiveIcon`, `splash` 설정과 이미지가 없다. 임시 에셋을 생성하지 않았으며 아래 파일은 디자이너/운영자가 제공해야 한다.

- 512×512 PNG 고해상도 앱 아이콘
- Adaptive Icon foreground와 단색 background, 가능하면 monochrome
- Splash 이미지와 배경색
- 1024×500 Feature Graphic
- 실제 release 앱의 스마트폰 스크린샷
- 필요 시 7/10인치 태블릿 스크린샷
- 실제 위젯 사용 결과, 편집 화면, 아날로그/디지털/올가미 예시

제공 후 `app.json`의 `icon`, `android.adaptiveIcon`, `plugins`의 `expo-splash-screen` 설정에 연결하고 원형·squircle 마스크와 다크 시스템 환경에서 잘림을 확인한다.
