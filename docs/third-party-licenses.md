# 오픈소스 및 에셋 라이선스 점검

직접 dependency의 package metadata에서 Expo, React, React Native, Expo Router/FileSystem/Image Picker/Image Manipulator, AsyncStorage, React Native Skia, Reanimated, Gesture Handler, Zustand가 MIT로 표시됨을 확인했다. 각 패키지의 배포본 LICENSE 고지를 유지한다.

`public/fonts/NoonnuBasicGothicRegular.ttf`는 앱에 번들되지만 파일 metadata에 라이선스/저작권 문구가 없다. 배포 전 원 배포 페이지, 허용 범위, 저작자 표기 의무를 확인하고 근거를 보관해야 한다. Dalseo 폰트 3개는 코드에서 참조되지 않아 현재 번들 대상은 아니지만, 저장소 유지 시에도 출처를 기록하거나 제거한다.

사용자가 직접 선택하는 이미지는 앱 기본 에셋으로 재배포하지 않는다. 스토어 스크린샷에 타인 저작물을 사용할 때는 별도 권리를 확보한다.
