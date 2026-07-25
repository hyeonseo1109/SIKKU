# Android 권한 및 Release Manifest 감사

검사 기준은 `release` 변형의 merged manifest와 AAB이며, debug 전용 manifest는 출시 권한 목록에 포함하지 않는다.

## 최종 권한

| 권한                                                        | 선언 출처                     | 사용 목적                                                      | 런타임 요청 | 판단      |
| ----------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------- | ----------- | --------- |
| `android.permission.INTERNET`                               | Expo/React Native 앱 manifest | Expo 런타임 호환성. 앱 코드에는 서버 API·분석·광고 통신이 없음 | 없음        | 유지      |
| `android.permission.ACCESS_NETWORK_STATE`                   | Expo dependency               | 네트워크 상태 확인을 위한 dependency 선언                      | 없음        | 유지      |
| `android.permission.RECEIVE_BOOT_COMPLETED`                 | clock-widget 모듈             | 재부팅 후 홈 위젯 갱신 예약 복원                               | 없음        | 유지      |
| `${applicationId}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` | AndroidX                      | 내보내지 않은 동적 receiver 보호용 signature 권한              | 없음        | 자동 생성 |

카메라, 마이크, 광범위한 사진/저장소, 알림, 정확한 알람, 위치, 연락처, 광고 ID, 다른 앱 목록 조회 권한은 사용하지 않는다. `app.json`의 `blockedPermissions`와 main manifest의 `tools:node="remove"`로 dependency 병합 시 재유입도 차단한다.

## 사진 선택 흐름

- 앱 최초 실행 시 사진 권한을 요청하지 않는다.
- 사용자가 이미지 추가를 눌렀을 때 `expo-image-picker`의 시스템 사진 선택 UI를 연다.
- Android에서는 전체 갤러리 권한을 미리 요청하지 않고 사용자가 고른 URI만 처리한다.
- 취소하거나 선택 결과가 없으면 앱 상태를 변경하지 않는다.
- 선택 이미지는 EXIF 방향과 과도한 크기를 정규화한 뒤 앱 전용 프로젝트 폴더로 복사한다.

## Release 구성요소

- Exported activity: launcher/deep-link를 처리하는 `MainActivity` 1개
- Deep link: `sikku://`, `exp+sikku://`; 앱 내부에서 project id를 허용된 형식으로 검증
- AppWidget receiver: 위젯 provider/configuration 및 시간·부팅 복원 receiver는 clock-widget manifest에서 제한된 action만 처리
- Boot receiver: `RECEIVE_BOOT_COMPLETED`로 위젯 갱신만 복원
- FileProvider: Expo FileSystem, ImagePicker, cropper가 각각 `exported=false` provider를 선언하고 URI 권한을 임시 부여
- 패키지 visibility: HTTPS `VIEW`, 문서 선택, 이미지/동영상 캡처, 일반 콘텐츠 선택 intent query를 dependency가 선언
- Backup: `allowBackup=false`, `fullBackupContent=false`
- Release cleartext: `usesCleartextTraffic=false`
- 정확한 알람: 선언하지 않으며 `setAndAllowWhileIdle` 기반 비정확 예약 사용
- 기타 exported component: AndroidX Profile Installer receiver는 `android.permission.DUMP`로 보호되며, 앱 코드의 위젯 provider와 launcher/deep-link activity 외 receiver/provider/activity는 외부 호출이 차단됨

최종 AAB를 새로 만들 때마다 `bundletool dump manifest` 결과와 이 문서를 대조한다.
