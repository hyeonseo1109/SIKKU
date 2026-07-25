# 시꾸 Android 출시 체크리스트

## 코드와 빌드

- [x] 앱 버전 `1.0.0`, Android `versionCode` 1
- [x] Expo SDK 57 / targetSdk 36 / compileSdk 36
- [x] production 프로필은 AAB, remote version 자동 증가
- [x] 릴리스 빌드에서 디버그 키를 사용하지 않음
- [ ] `eas credentials -p android`로 업로드 키 생성·백업
- [ ] `eas build -p android --profile production` 성공 및 서명 확인
- [x] 로컬 AAB의 bundletool 16KB ZIP 정렬 및 64-bit ELF 정렬 검사
- [ ] 실제 release APK로 핵심 흐름 검증

## 스토어 자산과 정책

- [ ] 최종 앱 아이콘, adaptive/monochrome 아이콘, splash 제공
- [ ] Feature Graphic 및 실제 앱 스크린샷 제공
- [ ] 개발자명, 문의 이메일 확정
- [ ] 개인정보처리방침을 공개 HTTPS URL에 게시하고 앱/Play Console에 연결
- [ ] NoonnuBasicGothicRegular 폰트와 배포 이미지의 라이선스 근거 보관
- [ ] Data Safety와 App Content를 실제 release 동작에 맞게 입력
- [ ] 내부 테스트 후 비공개 테스트 요구사항을 Play Console에서 확인

## 수동 QA

- [ ] 새 설치, 권한 거부, 프로젝트 생성/편집/저장/재실행
- [ ] 이미지 포함 프로젝트 복사와 원본·복사본 독립성
- [ ] 손상 JSON, 누락 이미지, 저장 공간 부족
- [ ] 위젯 추가/복수 인스턴스/리사이즈/시간 변경/재부팅/앱 업데이트
- [ ] Android 7(minSdk 24), 12, 13, 14, 15, 16
- [ ] Pixel Launcher, Samsung One UI Home
- [ ] Play Pre-launch report와 Android vitals 확인

앱 식별자는 개발자 브랜드를 반영한 `com.hendo.sikku`로 확정했다. Play Console에서 이 식별자로 앱을 만든 뒤에는 변경할 수 없으므로 최초 등록 전에 마지막으로 확인한다.
