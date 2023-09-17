---
layout: single
title:  "**(Deep Dive Study)웹 브라우저에 naver.com URL을 입력하면 어떤 일이 생기나요? + 이론을 통한 렌더링 최적화 고민**"
categories: Javascript, Browser, Rendering
toc: true
toc_label: "Table of Contents"
toc_icon: "bookmark"
---

# 🌱  이 토픽에 관해

스터디에서 발표 자료를 준비하기 위해 정리하였으며, 프론트엔드 엔지니어 포지션으로 면접을 보며 많이 받은 질문이다. 

**“웹 브라우저에 naver.com URL을 입력하면 어떤 일이 생기나요?”**

이론상으로 외우며 공부한 부분을 좀 더 깊게 파해쳐서 정리해보기로 했다.

우선적으로, 해당 부분을 깊게 정리하려면 사전에 웹 브라우저가 사이트에 접속할 경우의 동작 순서를 간략하게 정리할 필요가 있다고 생각한다.

---

# 🌑 웹 브라우저와 웹 브라우저의 동작에 관해

우리가 웹 서핑을 위해 익히 사용하는 웹 브라우저는 보통 웹 서버와 통신하고 다양한 사이트 내부의 컨텐츠를 볼 수 있도록 지원하는 소프트웨어이다.

![Untitled](/assets/images/posts/2023-09-17-Browser-rendering/browser01.png)

브라우저는 다양한 종류의 브라우저가 있으며, 해당 브라우저마다 엔진이 다르기 때문에 퍼블리셔와 프론트엔드 엔지니어는 Cross Browsing에 유의하며 자바스크립트와 CSS를 작성해야 한다.

![Untitled](/assets/images/posts/2023-09-17-Browser-rendering/browser02.png)

출처 : [mozilla.org](http://mozilla.org) (MDN web docs)

---

# 🌒 그럼 웹 브라우저는 어떻게 동작해 ? (웹 브라우저의 동작 순서)

## 동작 순서와 토픽 정리

1. 사용자가 웹 브라우저 주소창에 URL을 입력하면, 웹 브라우저는 **DNS**에게 해당 호스트의 IP주소를 묻게 된다.
    1. 일반 사용자는 **`naver.com`**과 같은 Domain Name을 통해 정보에 엑세스하게 되는데, 웹 브라우저는 인터넷 프로토콜(IP) 주소를 통해 상호작용 하므로 DNS는 브라우저가 인터넷 자원을 로드할 수 있도록 도메인 이름을 IP주소로 변환하는 작업을 행해준다.
    2. DNS(Domain Name System) : IP 주소 및 기타 데이터를 저장하고 이름별로 쿼리할 수 있게 해주는 분산 데이터베이스이다. 쉽게 표현하면 인터넷 상의 전화번호부와 같다.
2. 브라우저는 해당 호스트의 IP주소로 서버를 찾아간다. 이때 브라우저는 번호표 역할을 하는 ISN(Random Sequence)를 가지고 간다.
    1. ISN (Random Sequence) : TCP 기반 데이터 통신에서 각각의 새 연결에 할당된 고유한 32비트 시퀀스 번호를 나타낸다. TCP 연결을 통해 전송되는 다른 데이터 바이트와 충돌하지 않는 시퀀스 번호를 할당하는데 도움이 된다. ( 통신마다 충돌이 일어나지 않기 위한 목적 )
3. 서버는 ISN(Random Sequence)를 가지고 1을 더한 후 다시 브라우저에게 주고, 브라우저는 서버에게 응답받은 ISN(Random Sequence)에 다시 한 번 1을 더해 서버에 보내며 데이터를 주고 받기 위한 3 Way-Handshake 를 완료한다.
    1. 3 Way-Handshake : 3개의 단계를 기반으로 TCP의 연결을 성립하는 것
        1. (그림) 3 Way-Handshake 연결 성립 단계
            
            ![Untitled](/assets/images/posts/2023-09-17-Browser-rendering/browser03.png)
            
            1. SYN(synchronization) : 연결 요청 플래그
            2. ACK(acknowledgement) : 응답 플래그 
        2. (그림) Wireshark 패킷 분석 도구에서 요청의 Sequence Number를 조회
            
            ![Untitled](/assets/images/posts/2023-09-17-Browser-rendering/browser04.png)
            
        3. SYN 단계 : 클라이언트는 서버에 클라이언트의 ISN(Random Sequence)을 담아 SYN을 보낸다.
        4. SYN + ACK 단계 : 서버는 클라이언트의 SYN을 수신하고 서버의 ISN을 보내며 승인번호로 클라이언트의 ISN + 1을 보낸다.
        5. ACK 단계 : 클라이언트는 서버의 ISN + 1한 값인 승인번호를 담아 ACK를 서버에 보낸다.
4. 3 Way-Handshake 과정이 끝난 이후 브라우저는 서버에게 데이터를 요청한다. (HTTP Request)
5. 서버는 브라우저에게 받은 요청에 응답하여 데이터를 보낸다. (HTTP Response)

### **Construction** - 가져온 HTML, CSS를 Parsing하고 합쳐진 하나의 Tree를 생성하는 단계

1. 서버로 부터 받은 데이터를 출력하기 위해 해당 데이터를 W3C 명세에 따라 해석한다. (Parsing)
    1. W3C (World Wide Web Consortium) : 웹의 창시자 팀 버너스리를 중심으로 설립된 웹 표준화 기구, 웹에서 사용되는 HTML, SOAP, XML 등의 표준을 개발한다.
2. 브라우저의 렌더링 엔진은 HTML을 Parsing해서 DOM Tree를 생성한다.
    1. (그림) DOM Tree & CSSOM Tree & Render Tree
        
        ![Untitled](/assets/images/posts/2023-09-17-Browser-rendering/browser05.png)
        
    2. DOM Tree(Document Object Model Tree) : HTML 문서를 태그나 속성의 계층 구조(트리 구조)로 간주하여 참조하는 개념, 웹 문서를 node 구조의 tree 형태로 표시한다. 웹 브라우저는 DOM을 사용하기 때문에 자바스크립트와 CSS를 사용해서 상호작용이 가능하다.
3. HTML을 Parsing하는 과정에서 렌더링 엔진이 스타일 태그(<style>)를 만난다면 HTML Parsing 작업을 중지하고, CSS Parsing 작업을 시작하여 CSSOM Tree를 생성한다.
    1. CSSOM Tree(CSS Object Model Tree) : HTML 문서를 DOM Tree로 만든 것처럼, CSS도 브라우저가 이해하고 처리할 수 있도록 변환해서 만든 계층 구조
4. CSS Parsing을 종료하고 HTML Parsing이 중단된 지점부터 다시 Parsing을 진행한다. 그러다가 스크립트 태그(<script>)를 만나면 다시 HTML Parsing을 중단하고 자바스크립트 엔진에게 제어 권한을 넘긴다.
5. 자바스크립트 엔진은 코드를 해석하여 AST를 생성한 후 실행한다.
    1. (그림) 자바스크립트 코드와 해당 코드를 바탕으로 생성된 AST
        
        ![Untitled](/assets/images/posts/2023-09-17-Browser-rendering/browser06.png)
        
    2. AST(Abstract Syntax Tree) 추상 구문 트리 : 각 노드는 소스코드에서 발생되는 구조를 나타내고, 소스코드를 문법에 맞게 노드로 쪼개서 만든 트리이다. 추상적이라는 의미는 실제 구문에서 나타나는 세세한 정보를 나타내지 않는다는 것을 의미한다.
1. 다음으로 중단되었던 HTML Parsing 작업을 완료한다.
2. 앞서 만든 DOM Tree와 CSSOM Tree를 합쳐서 Render Tree를 생성한다.
    
    ![Untitled](/assets/images/posts/2023-09-17-Browser-rendering/browser07.png)
    

### **Operation - 시각화 단계 (layout, paint, composition**

1. 이후 렌더링 엔진은 Layout 작업을 시작하는데 이 작업은 Render Tree의 노드들을 화면의 올바른 위치에 표시하는 것을 의미한다. (layout)
2. UI Backend가 Render Tree의 노드들을 돌면서 UI를 그린다. (paint)
3. 노드들의 레이어를 순서대로 구성한다. z-index가 낮은 요소를 먼저 놓고, 그 다음 높은 요소를 놓는다. (composition)
    1. z-index : CSS 스타일 코드 중, 창을 순서대로 배치하는 스타일

> “Better UX” 좀 더 나은 사용자 경험

이러한 Parsing과 배치(Layout), UI를 paint 하는 과정은 브라우저가 사용자에게 더 빠르게 화면을 출력해주기 위해 서버로부터 데이터의 일부를 받고 나서 화면에 표시하고 또 데이터를 받게 되면 화면에 표시하는 것을 반복한다.

이 때문에 웹 페이지의 화면은 한 번에 렌더링 되지 않고, 부분적으로 렌더링 되는 현상이 나타나는 것이다.
> 
1. 최종적으로 웹의 사용자에게 결과 화면을 출력한다.

---

# 이론을 통한 렌더링 최적화 🧐

```jsx
<script src="script.js"></script>
```

여담으로 script 태그를 head가 아닌 body의 끝에 삽입하거나 defer 옵션을 사용하라는 말을 한 번쯤은 들어봤을 것이다.

NHN Cloud 에서 발표한 ‘[2018] 프런트엔드 성능 최적화’ 라는 영상이 있는데, 

<script> 태그의 삽입 위치를 통해서도 렌더링 최적화를 경험할 수 있는 부분이다.

![Untitled](/assets/images/posts/2023-09-17-Browser-rendering/browser08.png)

자료 URL : https://www.youtube.com/watch?v=G1IWq2blu8c&t=970s

이 부분은 브라우저 렌더링 과정을 살펴보면 이해할 수 있는 부분인데,

결론부터 말하면 HTML을 Parsing하는 과정에서 script 태그를 만나 parsing을 중단하고 AST를 생성하고 실행하는 과정이 있기 때문에 스크립트 삽입 위치에 따라 렌더링 시간이 달라진다는 것이다.

## <head> 에 스크립트를 배치할 경우

<head>에 스크립트를 포함할 경우 parsing을 멈추고, JS 파일을 받아오고 실행한 뒤 다시 HTML을 parsing 하는 과정을 진행할텐데..

Javascript 크기가 클 경우 렌더링이 너무 오래걸려서 사용자가 페이지를 보기까지 많은 시간이 소요될 것이다..

그러므로 <head> 태그 안에 스크립트 파일을 배치하는 것은 좋은 방법이라고 볼 수 없다.

## <body> 에 스크립트를 배치할 경우

<body> 하단에 스크립트를 배치할 경우 HTML parsing을 먼저 진행하고 JS파일을 받아와 실행하게 된다.

<body>에 삽입할 경우 화면 렌더링에 <head> 보다 좀 더 효과적일 수 있으나, Javascript가 포함된 콘텐츠를 보기 위해서는 오래 걸릴 것이다.

## async 속성 사용

```jsx
<script async src="script.js"></script>
```

async 속성은 <head>태그 안에 스크립트 태그를 배치하고 async 속성과 함께 사용하게 된다.

async 속성은 파싱과 Javascript 불러오기를 병렬적으로 진행하기 때문에 기존 방법들보다는 다운로드 시간이 절약되어 효율적이긴 하지만, 결국 JS를 실행하는 단계에서 HTML Parsing이 중단되기 때문에 의존성이 있는 페이지라면 문제가 될 수 있으므로 유의해서 사용해야 하는 속성이다.

## defer 속성 사용

```jsx
<script defer src="script.js"></script>
```

defer 속성은 async 속성과 마찬가지로 <head>에 스크립트 태그를 배치하고 defer 속성과 함께 사용하게 된다.

병렬적으로 파싱과 Javascript 불러오기를 진행하게 되고, 파싱이 모두 끝나면 Javascript를 실행한다.

병렬적으로 진행되기 때문에 다운로드 시간도 절약되고 async 속성과 다르게 파싱하는 도중에 Javscript 파일을 모두 다운 받고, 파싱이 끝난 후 순서대로 파일을 실행하기 때문에 원하는 방향대로 스크립트를 실행할 수 있다.

결론적으로 외부 스크립트를 다운받아 불러와야할 경우에는 defer 속성을 사용하는 것이 최선이라고 생각할 수 있다.