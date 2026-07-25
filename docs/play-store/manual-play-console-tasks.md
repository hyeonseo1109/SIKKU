# 운영자가 직접 해야 하는 출시 작업

- 개발자 계정 본인 인증과 공개 개발자 정보 입력
- `com.hendo.sikku`로 Play Console 앱 생성
- 문의 이메일, 운영자명, 국가/지역과 배포 가격 확정
- 개인정보처리방침 placeholder를 실제 정보로 교체하고 공개 HTTPS URL에 게시
- 최종 아이콘, adaptive/monochrome 아이콘, splash, Feature Graphic, 실제 앱 스크린샷 제공
- 업로드 키를 생성·안전하게 백업하고 EAS/Play App Signing credential 설정
- 서명된 production AAB 빌드 및 내부 테스트 트랙 업로드
- Data Safety와 App Content 초안을 실제 배포본 기준으로 최종 확인·제출
- 콘텐츠 등급, 타깃 연령, 광고 여부 설문 제출
- 테스터 이메일 또는 Google 그룹 등록과 참여 링크 전달
- Play Console에 표시되는 비공개 테스트 인원·기간 요건 충족
- Pre-launch report와 Android vitals 확인
- 프로덕션 접근 신청, 출시 국가 선택, 심사 제출, 관리형 게시 여부 선택

저장소에는 signing key·비밀번호를 넣지 않는다. 이미 `com.sikku.app`으로 별도 앱을 생성했다면 새 식별자는 기존 앱의 업데이트가 아니라 새 Play 앱으로 취급된다.
