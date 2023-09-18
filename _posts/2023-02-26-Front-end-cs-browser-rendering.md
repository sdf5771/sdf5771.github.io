---
layout: post
title: "[Front-end CS] 브라우저 렌더링 프로세스"
author: Seobisback
tags: [Front-end, Computer Science, Browser]
categories: Syntax
---

# Browser Rendering Process

- Browser Elements
- Browser Rendering Process
  - rendering engine(webkit) working process
  - HTML, CSS parsing process
  - render process

## 브라우저 기본 구조 (Browser Elements)

![rendering01](/assets/images/posts/2023-02-26-Front-end-cs-browser-rendering/browser-rendering01.png)

1. 사용자 인터페이스 - 주소 표시줄, 이전/다음 버튼, 북마크 메뉴 등. 요청한 페이지를 보여주는 창을 제외한 나머지 모든 부분
2. 브라우저 엔진 - 사용자 인터페이스와 렌더링 엔진 사이의 동작을 제어
3. 렌더링 엔진 - 요청한 콘텐츠를 표시. 예를 들어 HTML을 요청하면 HTML과 CSS를 파싱하여 화면에 표시 (요청한 URI를 브라우저 엔진에게 받아서 server에게 요청한다.(통신) server로 부터 URI에 해당하는 데이터(HTML,CSS,JavaScript)를 받아서 파싱한 후 렌더링한다. (chrome webkit)
4. 통신 - HTTP 요청과 같은 네트워크 호출에 사용됨. 이것은 플랫폼 독립적인 인터페이스이고, 각 플랫폼 하부에서 실행된다. (렌더링 엔진으로부터 HTTP 요청 등을 받아서 네트워크 처리 후 응답을 전달한다.)
5. UI 백엔드 - render tree를 browser에 그리는 역할을 담담 (콤보 박스와 창 같은 기본적인 장치를 그린다. 플랫폼에서 명시하지 않은 일반적인 인터페이스로서, OS 사용자 인터페이스 체계를 사용한다.)
6. 자바스크립트 해석기 - 자바스크립트 코드를 해석하고 실행한다. (chrome V8 엔진)
7. 자료 저장소 - 쿠키 등의 자료를 컴퓨터 하드디스크에 저장한다. (HTML5 부터 Web Database에 저장가능)

## 브라우저가 렌더링하는 과정 (Browser Rendering Process)

1. 사용자가 사용자 인터페이스 내부 주소표시줄에 URI를 입력하여 브라우저 엔진에 전달
2. 브라우저 엔진은 자료 저장소에서 URI에 해당하는 자료를 찾고, 해당 자료를 쿠키로 저장했다면 그 자료를 렌더링 엔진에 전달
3. 렌더링 엔진은 브라우저 엔진에서 가져온 자료(HTML, CSS, Image 등)를 분석하고, 동시에 URI 데이터를 통신, 자바스크립트 해석기, UI 백엔드로 전파한다.
4. 또한 렌더링 엔진은 통신 레이어에 URI에 대한 추가 데이터(있을 경우)를 요청하고 응답할 때까지 기다린다.
5. 응답받은 데이터에서 HTML, CSS는 렌더링 엔진이 파싱한다.
6. 응답받은 데이터에서 JavaScript는 JavaScript 해석기가 파싱한다.
7. JavaScript 해석기는 파싱한 결과를 렌더링 엔진에 전달하여 3번과 5번에서 파싱한 HTML의 결과인 DOM tree를 조작한다.
8. 조작이 완료된 DOM node(DOM tree의 구성요소)는 render object(render tree 구성요소)로 변한다.
9. UI 백엔드는 render object를 브라우저 렌더링 화면에 띄워준다.

## webkit (rendering engine working process)

- 렌더링 엔진은 URI를 통해 요청을 받아서 해당하는 데이터를 렌더링하는 역할을 담당한다.
- chrome 과 IOS는 ‘webkit’ 이라는 rendering engine을 사용한다.

### 대략적인 rendering engine 동작 과정

![rendering02](/assets/images/posts/2023-02-26-Front-end-cs-browser-rendering/browser-rendering02.png)

1. DOM tree 구축을 위한 HTML parsing, CSS, Javascript parsing : HTML 문서를 파싱한 후, content tree 내부에서 tag(a, div)를 DOM node 로 변환한다. 그 다음 CSS 파일과 함께 모든 스타일 요소를 파싱한다. 스타일 요소와 HTML 표시 규칙, Javascript 의 파싱 결과물은 render tree를 생성한다.
2. render tree 구축 : HTML 과 CSS 를 파싱해서 만들어진 render tree 는 색상 또는 면적 등 시각적 속성을 갖는 사각형을 포함한다. 정해진 순서대로 렌더링한다.
3. render tree 배치 : render tree가 생성이 끝나면, 배치가 시작된다. 각 node가 정확한 위치에 표시되기 위해 이동한다.
4. render tree 그리기 : 각 node 배치를 완료하면 UI 백엔드에서 각 node를 가로지르며 paint 작업을 한다.

해당 작업 1번과 2, 3, 4번은 병력적으로 진행된다.

통신 레이어에서 data를 계속 받아오면서(통신 레이어)

받아온 HTML, CSS, Javascript 를 parsing 하면서 (1번)

render tree에 node를 그린다 (2, 3, 4번)

### webkit의 동작 과정

![rendering03](/assets/images/posts/2023-02-26-Front-end-cs-browser-rendering/browser-rendering03.png)

1. HTML을 parsing 하여 DOM tree 를 생성한다.
  - 아래와 같은 HTML을 parsing하여 DOM tree를 생성한다. (DOM 으로 바꾼 HTML은 Javascript가 조작할 수 있다.)
  -

    ```html
    <html>
    	<body>
    		<p>Hello World</p>
    		<div>
    			<img src="example.png" />
    		</div>
    		<script></script>
    	</body>
    </html>
    ```


![rendering04](/assets/images/posts/2023-02-26-Front-end-cs-browser-rendering/browser-rendering04.png)

브라우저는 tag의 parsing과 실행을 동시에 진행한다.

그러므로 아래 과정으로 HTML tag를 parsing 한다.

> <script> tag는 가장 마지막 위치에 위치하는 것이 좋다. <script> 코드를 parsing하고 실행하는 동안 추가적으로 parsing할 HTML tag가 남지 않기 때문 - ‘모든 tag가 parsing과 동시에 실행된 후 <script>로 해당 tag에게 인터렉션을 주거나 조작’
>

1. <script> tag를 parsing한다.
2. <script> tag를 실행한다.
3. 실행이 완료된 후 다음 tag를 파싱한다.

> <script> tag의 실행이 완료된 후, 다음 tag를 parsing 한다.
>

그러므로

HTML5에서 추가된 기능이 있다.

> HTML5에서는 <script> tag를 비동기로 처리하는 속성을 추가했다.
>
1. CSS(style sheets)를 parsing 하여 스타일 규칙을 얻는다.
  - ‘webkit’ 은 CSS 문법 파일로부터 자동으로 파서를 생성하기 위해 플렉스와 바이슨 파서 생성기를 사용한다. 파서 소개에서 언급했던 것처럼 바이슨은 상향식 이동 감소 파서를 생성한다. 파이어폭스는 직접 작성한 하향식 파서를 사용한다. 두 경우 모두 각 CSS 파일은 스타일 시트 객체로 파싱되고 각 객체는 CSS 규칙을 포함한다. CSS 규칙 객체는 선택자와 선언 객체 그리고 CSS 문법과 일치하는 다른 객체를 포함한다.
  - css parsing 하여 CSSOM 생성
2. DOM tree를 생성하는 동시에, 이미 생성된 DOM tree와 스타일 규칙(CSSOM)을 Attachment 한다.
  - DOM tree를 구성하는 하나의 DOM node는 attach 라는 method를 가진다. (새로운 DOM node가 추가되면 attach가 호출되어 render object를 생성한다.)
  - render object는 render tree의 구성요소로써, 자신과 자식 요소를 어떻게 배치하고 그려야할지 안다.
  - node의 css box를 표시할 정보를 가지고 있다.
  - 모든 DOM node가 전부 render obejct로 생성되는 것은 아니다.(ex head tag, display none tag 등)
  - <htmll>과 <body> DOM node 또한 render object로 구성되는데 이들은 render tree root 로써 render view 라고 부른다.
  - 나머지 DOM node 들은 render object로 생성되어 이 render tree root에 추가된다.
3. 구축한 render tree를 배치(layout)한다.
  - 배치는 <html> 요소에 해당하는 최상위 render object에서 시작한다. 화면에 왼쪽 위부터 render object에 해당하는 DOM node를 그려나간다.
4. 배치가 끝난 render tree를 그린다.
  - render tree 탐색 후 해당하는 render object의 paint method 를 호출한다.

### 모질라의 게코 렌더링 엔진 동작 과정

![rendering05](/assets/images/posts/2023-02-26-Front-end-cs-browser-rendering/browser-rendering05.png)

---

참고 내용 및 출처 표시

[브라우저는 어떻게 동작하는가?](https://d2.naver.com/helloworld/59361)

[Browser rendering process 1편 - Browser 구성 요소](https://youtu.be/oLC_QYPmtS0)

[Browser rendering process 2편 - 렌더링 엔진 동작과정](https://youtu.be/EBe-OHkf9w8)