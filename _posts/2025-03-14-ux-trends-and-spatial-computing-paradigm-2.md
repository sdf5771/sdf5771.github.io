---
layout: post
title: "2025 이전 UX/UI 트렌드 정리와 향후 Spatial UX/UI가 가져올 웹 개발의 패러다임 시프트 - WebXR: 공간적 웹 경험과 2025 미래 기술 전망 (2부)"
author: Seobisback
tags: [Web, Frontend, Design, UX, UI, VR, AR, WebXR, Apple, Google, Vision Pro, Android XR, Spatial, WebGL, Naver]
categories: Syntax
---

#### - 프론트엔드 개발자와 디자이너가 주목해야 할 WebXR과 3차원 웹의 미래

> 최근 몇 년간 웹 개발과 디자인 영역은 유례없는 속도로 진화하고 있습니다. 특히 WebXR과 같은 혁신적인 기술의 등장으로, 우리는 이제 평면적 인터페이스를 넘어 공간적 경험을 설계하는 시대를 마주하고 있습니다.

이 글에서는 '2025 이전 UX/UI 트렌드 정리와 향후 Spatial UX/UI가 가져올 웹 개발의 패러다임 시프트'라는 주제로, 지난 트렌드를 체계적으로 분석하고 앞으로 다가올 변화를 탐색해보고자 합니다. 특히 프론트엔드 개발자의 관점에서, 어떻게 하면 이러한 변화 속에서 사용자에게 더 나은 경험과 가치를 전달할 수 있을지 조사한 내용을 1부와 2부로 나누어 정리 하였습니다.

---

## 목차

### 1부

1. [최근 5년간의 UX/UI 진화: 2020-2024](/syntax/2025/03/13/ux-trends-and-spatial-computing-paradigm-1.html#section1)
2. [새로운 패러다임, Spatial UX/UI](/syntax/2025/03/13/ux-trends-and-spatial-computing-paradigm-1.html#section2)

### 2부 📌

1. [WebXR: 공간적 웹 경험의 기술적 기반](#section3)
2. [미래 전망: 2025년과 그 이후](#section4)

---

<h2 id="section3">WebXR: 공간적 웹 경험의 기술적 기반</h2>

### 1.1 WebXR Device API 기술 개요 ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API))

WebXR이란 XR 장치에서 증강 현실(AR) 및 가상 현실(VR)에 대한 액세스 지원을 웹 브라우저에서 기술하는 웹 애플리케이션 프로그래밍 인터페이스(API) 라고 정의합니다.

여기서 **XR이란 W3C(World Wide Web Consortium - 웹 표준을 개발하는 국제 컨소시엄)에서는 AR과 VR 관련 기술에 사용되는 하드웨어, 애플리케이션 및 기술의 스펙트럼을 나타낸다고 정의하고 있습니다.**

기존에 **WebVR은 가상 현실만 표현** 할 수 있는 실험적인 WebAPI였지만 **WebXR로 대체되면서 VR과 AR을 모두 지원** 하는 좀 더 포괄적인 의미가 되었습니다.


#### 지원 브라우저와 디바이스 ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API#browser_compatibility))

![VR을 서포트하지 않는 기기](/assets/images/posts/2025-03-14-ux-trends-and-spatial-computing-paradigm-2/15.png)
(MDN - WebXR 기술을 지원하는 웹 브라우저)

MDN 에서 설명하는 WebXR 기술의 공식 지원 브라우저는 다음과 같으며, 아직까지는 실험적인 API 이므로 이 부분은 좀 더 지켜볼 필요가 있습니다.

![Android XR WebXR 지원](/assets/images/posts/2025-03-14-ux-trends-and-spatial-computing-paradigm-2/16.png)
(AndroidXR - WebXR 지원)

![WWDC2024 WebXR 세션](/assets/images/posts/2025-03-14-ux-trends-and-spatial-computing-paradigm-2/17.png)
(WWDC2024 -Vision OS - WebXR)

### 1.2 구현

구현은 `Vite` 의 `React + Typescript` Template 으로 프로젝트를 초기화해서 사용하였습니다.
그리고 웹 기반의 VR 컴포넌트를 만들기 위해 `three.js` 를 사용하였습니다 ([참고 Three.js - How to create VR Content](https://threejs.org/docs/#manual/ko/introduction/How-to-create-VR-content))

```javascript
import React, { useEffect } from 'react';
import styles from './page.module.css';
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

const FOV = 75; // Camera frustum vertical field of view. Default 50.
const ASPECT = window.innerWidth / window.innerHeight; // Camera frustum aspect ratio. Default 1.
const NEAR = 0.1; // Camera frustum near plane. Default 0.1.
const FAR = 1000; // Camera frustum far plane. Default 2000.

function Home(){
	useEffect(() => {
		// Three.js 초기화
		const scene = new THREE.Scene(); // 3D 장면 생성
		const camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR); // 카메라 생성
		const renderer = new THREE.WebGLRenderer({antialias: true}); // 렌더러 생성 antialias로 계단 현상 줄임

		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.xr.enabled = true; // WebXR 활성화
		document.body.appendChild(renderer.domElement);
		document.body.appendChild(VRButton.createButton(renderer)); // VR Button

		// 간단한 큐브 추가
		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
		const cube = new THREE.Mesh(geometry, material);

		scene.add(cube);

		camera.position.z = 5;

		// animation loop
		renderer.setAnimationLoop(() => {
			cube.rotation.x += 0.01;
			cube.rotation.y += 0.01;
			renderer.render(scene, camera);
		});

	  
		// useEffect Clean up
		return () => {
			renderer.dispose();
			document.body.removeChild(renderer.domElement);
			document.body.removeChild(document.querySelector("#VRButton") as Node);
		}
	})


	return (
		<main className={styles.main}></main>
	)

}
  

export default Home;
```

(React + TypeScript + Three js + WebXR)

![VR을 서포트하지 않는 기기](/assets/images/posts/2025-03-14-ux-trends-and-spatial-computing-paradigm-2/18.png)
(VR을 서포트하지 않는 기기)

![Apple Vision Pro 시뮬레이터에서 WebXR을 활성화한 이미지](/assets/images/posts/2025-03-14-ux-trends-and-spatial-computing-paradigm-2/19.png)
![Apple Vision Pro 시뮬레이터에서 WebXR을 활성화한 이미지 2](/assets/images/posts/2025-03-14-ux-trends-and-spatial-computing-paradigm-2/20.png)
(Apple Vision Pro 시뮬레이터를 이용해 WebXR 기능을 활성화한 이미지)

### 1.3 개발자 도구와 리소스

#### 프레임워크와 라이브러리

> [Android XR - WebXR의 내용을 다루는 문서](https://developer.android.com/develop/xr/develop-with-webxr?hl=ko#prerequisite:-choose)에서는 3D 장면의 제어와 상호작용은 [three.js](https://threejs.org/) 혹은 [babylon.js](https://www.babylonjs.com/) 를 사용하는 것이 좋고, 신속한 프로토타입을 제작하거나 HTML과 유사한 문법으로 3D 장면을 정의할 경우에는 [A-Frame](https://aframe.io/docs/1.6.0/components/webxr.html) 혹은 [model-viewer](https://modelviewer.dev/examples/augmentedreality/) 를 사용하는 것이 좋다고 소개하고 있습니다.

각 라이브러리의 특징

| 라이브러리   | 장점                                                         | 단점                                   | 사용 사례              |
| ------------ | ------------------------------------------------------------ | -------------------------------------- | ---------------------- |
| Three.js     | - 풍부한 생태계<br />- 높은 자유도 <br />- 뛰어난 성능       | - 학습 곡선이 높음<br />- 저수준 API   | 복잡한 3D 시각화, 게임 |
| Babylon.js   | - 게임 엔진급 기능<br />- 물리 엔진 내장<br />- 좋은 문서화  | - 파일 크기가 큼<br />- 초기 설정 복잡 | 게임, 시뮬레이션       |
| A-Frame      | - HTML 유사 문법<br />- 빠른 프로토타입<br />- 컴포넌트 기반 | - 성능 제약<br />- 커스텀화 제한       | 간단한 VR 경험, 교육   |
| Model-viewer | - 쉬운 사용법<br />- AR 지원<br />- 최적화된 성능            | - 제한된 기능<br />- 커스텀화 어려움   | 제품 시각화, AR 프리뷰 |

#### 디버깅 도구

WebXR 개발 시 활용할 수 있는 주요 디버깅 도구들:

1. **WebXR API Emulator**

- VR/AR 하드웨어 없이 테스트 가능
- 다양한 디바이스 시뮬레이션
- 제스처 및 컨트롤러 테스트

2. **시뮬레이터**

- Apple Vision Pro 시뮬레이터
- Meta Quest 개발자 도구
- HoloLens 에뮬레이터

#### 학습

1. **공식 문서**

- [MDN WebXR Device API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
- [W3C WebXR 스펙](https://www.w3.org/TR/webxr/)
- [Google WebXR 개발자 가이드](https://developers.google.com/web/fundamentals/vr/webxr)

2. **튜토리얼 및 예제**

- [Three.js WebXR 예제](https://threejs.org/examples/?q=webxr#webxr_ar_lighting)
- [A-Frame 학습 리소스](https://aframe.io/)
- [Babylon.js WebXR 튜토리얼](https://doc.babylonjs.com/features/featuresDeepDive/webXR)

---

<h2 id="section4">2. 미래 전망: 2025년과 그 이후</h2>

### 2.1 하드웨어 진화

Apple Vision Pro에 이어 Android XR 운영체제도 완성되면 해당 OS를 이용한 새로운 기기들이 계속 발전해서 등장할 것이며, 현존하는 XR 기기들의 주요 한계점들이 빠르게 개선되고 관련한 새로운 기술 연구가 예상됩니다.

#### 디스플레이 기술

- **고해상도 마이크로 OLED**
- 더 선명한 시각적 경험
- 눈의 피로도 감소
- 현실감 있는 색상 표현
- **광학 시스템**
- 더 넓은 시야각(FOV) 구현
- 더 얇고 가벼운 렌즈
- 왜곡 현상 최소화

#### 센서 및 입력 장치

- **정확한 트래킹**
- 향상된 시선 추적
- 정밀한 제스처 인식
- 공간 매핑 고도화
- **생체 신호 통합**
- 사용자 상태 모니터링
- 건강 데이터 활용
- 개인화된 경험 제공

### 2.2 표준화 동향

WebXR을 지원하는 디바이스가 계속해서 등장하게 된다면, 이를 중심으로 한 웹 표준의 발전이 예상됩니다.

#### W3C 표준화

- **WebXR API 확장**
- 새로운 인터랙션 표준
- 성능 최적화 가이드라인
- 보안 및 프라이버시 표준

#### 브라우저의 WebXR 지원 확대

- **주요 브라우저 대응**
- Chrome, Safari, Firefox 등 지원 확대
- 모바일 브라우저 최적화
- 크로스 플랫폼 호환성 강화

### 2.3 새롭게 응용 가능할 분야

#### 업무 환경의 변화

- **가상 오피스**
- 원격 협업 공간
- 3D 문서 작업
- 실시간 회의 시스템

#### 교육과 훈련

- **실감형 교육**
- 가상 실험실
- 의료 훈련
- 기술 교육

#### 엔터테인먼트

- **새로운 형태의 콘텐츠**
- 몰입형 게임
- 소셜 VR
- 메타버스 플랫폼

---

## 끝을 맺으며

2024년 초입부터 Apple Vision Pro의 출시와 Android XR의 발표로 공간 컴퓨팅에 대한 관심이 뜨겁습니다. 이러한 흐름은 2025년에도 계속될 것으로 보이며, 여러 기업들의 새로운 XR 디바이스 출시가 예상됩니다.

물론 이러한 기술이 당장 대중화되기는 어려울 것이라 생각하고 있습니다.

이는 스마트폰이 오늘 날 우리에게 널리 보급되기 까지 역사를 보면 잘 알 수 있습니다.

스마트폰이 출시되었을 당시에도 바로 대중화로 이어지지는 않았고, 관련 기술이 발전하고 디바이스의 보급화가 이루어지면서 이제는 스마트폰은 일상 생활에서 없어서는 안될 중요한 요소가 되었습니다.

XR 디바이스 또한 비슷한 과정을 거치지 않을까 예상됩니다.
새로운 디바이스가 계속 나오면서 발전하고 세대 교체가 진행되고, 소프트웨어 기술이 발전하면서 점차 보급화가 이루어질 것이라 생각하고 있습니다.

Apple이 WWDC에서 Vision Pro를 발표하며 이야기했던 '공간 컴퓨팅 시대'가 머지않아 현실이 될 것으로 기대됩니다.

이는 단순한 기술의 진화를 넘어, 우리가 디지털 세계와 상호작용하는 방식 자체를 근본적으로 변화시키지 않을까 생각합니다.

새로운 사용자 경험과 비즈니스 모델이 등장할 것이며, 이는 우리의 일상생활과 업무 방식에도 큰 영향을 미칠 것입니다.

앞으로 펼쳐질 공간 컴퓨팅의 새로운 시대를 기대하며, 이 글을 마무리하고자 합니다.

긴 글 읽어주셔서 감사합니다.

---

## 참고 자료 출처

- [네이버, 다음 등 인터넷 사이트의 과거 모습을 보는 방법](https://m.blog.naver.com/1strider/223027321122)
- [네이버 변천사(1998년~2014년)](https://webmini.tistory.com/815)
- [네이버피셜 - 탐색을 설계하는 사람들](https://fficial.naver.com/contentDetail/104)
- [홈페이지 과거를 알 수 있다. 네이버 1998년 ~ 2020년까지 홈페이지 변천사](https://blog.naver.com/inkdj/222615334596)
- [GUI 이해하기 - 스큐어모피즘과 플랫디자인](https://ditoday.com/%EC%8A%A4%ED%81%90%EC%96%B4%EB%AA%A8%ED%94%BC%EC%A6%98%EA%B3%BC-%ED%94%8C%EB%9E%AB%EB%94%94%EC%9E%90%EC%9D%B8/)
- [Viewport meta tag(MDN)](https://developer.mozilla.org/ko/docs/Web/HTML/Viewport_meta_tag)
- [Google - Android XR](https://developer.android.com/develop/xr?hl=ko)
- [Apple - Apple Vision Pro](https://www.apple.com/kr/apple-vision-pro/)
- [WWDC2023 - 공간 디자인의 원리](https://developer.apple.com/kr/videos/play/wwdc2023/10072/)
- [W3C - WebXR Device API](https://www.w3.org/TR/webxr/)
- [Three.js - How to create VR Content](https://threejs.org/docs/#manual/ko/introduction/How-to-create-VR-content)
