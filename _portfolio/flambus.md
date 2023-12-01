---
layout: post
title: Flambus - 맛집 정보 제공 플랫폼
feature-img: "assets/img/portfolio/flambus01.png"
img: "assets/img/portfolio/flambus01.png"
date: 1 September 2023
tags: [React, React Native, Java, Typescript, Redux, React Query, Mobile Application]
---

![Untitled](/assets/img/portfolio/flambus01.png)

> ‘Flambus’ 메인 스크린
> 

Mobile Application Github : https://github.com/sdf5771/flambus

[GitHub - sdf5771/flambus: Make React Native Project Application](https://github.com/sdf5771/flambus)

Webview Github : https://github.com/sdf5771/flambus-web

[GitHub - sdf5771/flambus-web: flambus react web server](https://github.com/sdf5771/flambus-web)

프로젝트 개요

- 맛집 정보를 아카이빙하며 탐험한다는 게임적 컨셉을 녹인 게이미피케이션 ‘맛집 정보 제공 플랫폼’
- Platform
    - ios / android Mobile Application

**역할**

- 프로젝트 전체 인원
    - **Front-End Developer - 김섭우**
    - Back-End Developer - 최성우, 이시영
    - Designer - 황현우, 최지원, 이주석
- 역할과 기여도
    - 프로젝트의 전반적인 Front-End 개발
    - 모바일 어플리케이션 구조 설계

프로젝트를 진행하며 학습한 사항

- Atomic 디자인 패턴 사용을 통한 코드의 관심사 분리 및 컴포넌트 분리
- kakao map api를 webview 형태로 사용하여 어플리케이션과 webview의 데이터 전송
- React Query 사용을 통한 Server State 관리 및 캐싱
- React Native의 전반적인 써드파티 생태계 이해
- 디렉토리 구조 및 아키텍처 고민
    - 기능 및 경로 별 그룹화
        
        ![Untitled](/assets/img/portfolio/flambus02.png)
        

---

## 사용 중인 협업툴

- 태스크 관리를 위해 사용하는 툴 - Jira
- 회의록 및 필요 서류를 관리하는 툴 - Confluence

## Front-end Information

### React Native Version : 0.70.10

- Front-end Repository ReadMe
    - https://github.com/sdf5771/flambus

Developer. [sdf5771 - Overview](https://github.com/sdf5771)

## 설치 및 실행

- 메인 기능 중 카카오맵을 사용한 웹뷰를 사용하기 위해 flambus-web 리포지토리의 웹뷰 서버 실행 필요

```jsx
// 종속성 패키지 설치
npm install

cd ios && pod install
cd ..

npm run ios // iPhone
npm run android // Android 
```

## 프로젝트 디렉토리 구조

```jsx
.
├──📁 Stores
│   ├── index.ts
│   ├── useAcornViewStore.ts
│   └── useStoreDetailScreenStore.tsx
├──📁 assets
│   ├──📁 bottom-tab-navigator
│   │   └── svg-components
│   │       ├── CommunityLogo.tsx
│   │       ├── LocationLogo.tsx
│   │       ├── MyPageLogo.tsx
│   │       ├── SearchLogo.tsx
│   │       └── index.ts
│   ├──📁 public
│   │   └── flambus-logo.png
│   └──📁 svg-components
│       ├── AcornButtonLineActive.tsx
│       ├── AcornButtonLineDefault.tsx
│       ├── AcornChargeLogoActive.tsx
│       ├── AcornChargeLogoDefault.tsx
│       ├── AcornLogoActive.tsx
│       ├── AcornLogoDefault.tsx
│       ├── FlagBlackLogo.tsx
│       ├── FlambusLogo.tsx
│       ├── LeftArrow.tsx
│       ├── index.ts
│       ├──📁 journalFilter
│       │   ├── MenuLogoActive.tsx
│       │   ├── MoodLogoActive.tsx
│       │   ├── ServiceLogoActive.tsx
│       │   └── index.ts
│       └──📁 social
│           ├── Google.tsx
│           ├── Kakao.tsx
│           ├── Naver.tsx
│           └── index.ts
├──📁 components
│   ├──📁 Atoms
│   │   ├── ProgressBar.tsx
│   │   ├── PublicBorderInputBox.tsx
│   │   └── index.ts
│   ├──📁 Molecules
│   │   ├── AcornCountButton.tsx
│   │   ├── LocationTextInput.tsx
│   │   └── index.ts
│   ├──📁 Organisms
│   │   ├── AcornView.tsx
│   │   ├── KakaoMapView.tsx
│   │   ├── LocationSearch.tsx
│   │   ├── RadioButton.tsx
│   │   ├── SignUpTest.tsx
│   │   ├── SocialLogin.tsx
│   │   ├── StoreThumbnailView.tsx
│   │   ├── StoreTitleView.tsx
│   │   └── index.ts
│   ├──📁 Screen
│   │   ├── CommunityScreen.tsx
│   │   ├── CreateAccount
│   │   │   ├── EmailAuthScreen.tsx
│   │   │   ├── EmailInputScreen.tsx
│   │   │   ├── NickNameInputScreen.tsx
│   │   │   ├── PasswordInputScreen.tsx
│   │   │   ├── SignUpCompleteScreen.tsx
│   │   │   └── index.ts
│   │   ├── LocationScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── MyPage.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── StoreDetailScreen.tsx
│   │   └── index.ts
│   └──📁 Templates
│       ├── BottomSheet.tsx
│       ├──📁 CreateAccount
│       │   ├── CreateAccountHeader.tsx
│       │   └── index.ts
│       └── index.ts
├──📁 hooks
│   ├── handleWebview.ts
│   ├── index.ts
│   ├── useAuth.ts
│   └── useInterval.js
├──📁 navigator
│   ├── BottomTabNavigator.tsx
│   ├── RootNavigator.tsx
│   └── index.ts
├──📁 queries
│   ├── authLogin.ts
│   ├── createAccount.ts
│   ├── getCheckEmail.ts
│   ├── getStoreDetailData.ts
│   ├── getStoreMapData.ts
│   └── index.ts
└──📁 types
    └── index.ts

21 directories, 73 files
```

## package.json

```jsx
{
  "name": "flambus",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx"
  },
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.19.0",
    "@react-native-community/geolocation": "^3.1.0",
    "@react-native-firebase/app": "^18.4.0",
    "@react-native-firebase/messaging": "^18.4.0",
    "@react-navigation/bottom-tabs": "^6.5.8",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.13",
    "@react-navigation/stack": "^6.3.17",
    "@tanstack/react-query": "^4.29.25",
    "jshint": "^2.13.6",
    "lottie-ios": "3.4.1",
    "lottie-react-native": "^5.1.6",
    "react": "18.1.0",
    "react-native": "0.70.10",
    "react-native-gesture-handler": "^2.13.4",
    "react-native-location": "^2.5.0",
    "react-native-reanimated": "^3.5.4",
    "react-native-safe-area-context": "^4.7.1",
    "react-native-screens": "^3.24.0",
    "react-native-svg": "^13.13.0",
    "react-native-tab-view": "^3.5.2",
    "react-native-webview": "^13.6.0",
    "recoil": "^0.7.7",
    "zustand": "^4.4.1"
  },
  "devDependencies": {
    "@babel/core": "^7.12.9",
    "@babel/runtime": "^7.12.5",
    "@react-native-community/eslint-config": "^2.0.0",
    "@tsconfig/react-native": "^2.0.2",
    "@types/jest": "^26.0.23",
    "@types/react": "^18.0.21",
    "@types/react-native": "^0.70.6",
    "@types/react-test-renderer": "^18.0.0",
    "@typescript-eslint/eslint-plugin": "^5.37.0",
    "@typescript-eslint/parser": "^5.37.0",
    "babel-jest": "^26.6.3",
    "eslint": "^7.32.0",
    "jest": "^26.6.3",
    "metro-react-native-babel-preset": "0.72.3",
    "react-native-svg-transformer": "^1.1.0",
    "react-test-renderer": "18.1.0",
    "typescript": "^4.8.3"
  },
  "jest": {
    "preset": "react-native",
    "moduleFileExtensions": [
      "ts",
      "tsx",
      "js",
      "jsx",
      "json",
      "node"
    ]
  }
}
```


## 메인 스크린

![Untitled](/assets/img/portfolio/flambus03.png)

## 로그인

![Untitled](/assets/img/portfolio/flambus04.png)

## 회원가입

![Untitled](/assets/img/portfolio/flambus05.png)

![Untitled](/assets/img/portfolio/flambus06.png)

![Untitled](/assets/img/portfolio/flambus07.png)

![Untitled](/assets/img/portfolio/flambus08.png)

![Untitled](/assets/img/portfolio/flambus09.png)