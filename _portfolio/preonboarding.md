---
layout: post
title: 프리온보딩 프론트엔드 챌린지 1월 - CRUD w React Query’
feature-img: "assets/img/portfolio/onboarding01.png"
img: "assets/img/portfolio/onboarding01.png"
date: 1 January 2023
tags: [OnBoarding, React, ReactQuery, Typescript]
---

![스크린샷 2022-12-31 오후 12.46.06.png](/assets/img/portfolio/onboarding01.png)

- Wanted 프리온보딩 프론트엔드 챌린지 1월 Thumbnail Image

# 개요

- 출처 - https://www.wanted.co.kr/events/pre_challenge_fe_5
    
    ![스크린샷 2022-12-31 오후 12.50.56.png](/assets/img/portfolio/onboarding02.png)
    
- Wanted - 프리온보딩 프론트엔드 챌린지 1월
    - **12.22 (목) - 1.5 (목) (진행중)**
        
        참가 신청 및 사전 미션 수행 (사전미션 섹션 링크 참조)
        
    - **1.9 (월) - 1.20 (금)**
        
        기술 역량 향상 (2주) - 강의 : 화요일 & 금요일, 저녁 8시 (총 12시간, 온라인)
        
    - **1.23 (월) - 2.19 (일)**
        
        취업 챌린지 진행 (4주) - 이력서 지원부터 ~ 합격까지 (개별 취업 활동)
        
    - **2.20 (월) - 3월 중**
        
        챌린지 종료 및 시상
        

---

## 사전 과제

- 기간 **12.22 (목) - 1.5 (목) (진행중)**
- 과제 명세 Link
    
    https://github.com/starkoora/wanted-pre-onboarding-challenge-fe-1-api
    

- 진행중인 과제 Git Repo
    - Client - https://github.com/sdf5771/wanted-pre-onboarding-challenge-fe-1.git
    - API SERVER - https://github.com/sdf5771/wanted-pre-onboarding-challenge-fe-1-api.git

---

# 명세 본문 내용

# :: 원티드 프리온보딩 챌린지 프론트엔드 코스 사전과제 안내 & API

# 1-1) 사전과제 진행 가이드

- 제공해드리는 API Repository를 활용하여 가이드에 따라 `Todo App`을 작성, 본인의 github에 `Public`으로 올려주세요. (주의: Public이 아닐 경우 과제를 확인할 수 없습니다)
- 완성한 과제는 모집 마감 후 설문 조사를 통해 제출해주세요. (개강 시 설문 조사 링크 전달 예정)
- 제출 레파지토리 명은 `wanted-pre-onboarding-challenge-fe-1`로 생성해 주세요.
- 과제 수행 개수에 따라 기본적인 평가가 이루어지며, 커리큘럼 운영 과정에서 최소한의 수준을 파악하기 위한 용도입니다.
- 코드의 일관성, 가독성, 함수 분리, 컴포넌트 설계, 코드 퀄리티 등을 기준으로 세부적인 평가가 이루어집니다.
- 해당 과제에 대한 해설은 개강 후 진행될 예정입니다.
- `README.md`를 꼭 작성해 주세요. 본인에 대한 소개나 프로젝트 소개 등 자유롭게 작성해주시면 됩니다.
- 반드시 함수 컴포넌트로 개발해주세요. (React Hooks)

\* 문의 사항은 사전 과제 Repository의 Issue로 등록해 주세요.

# 1-2) 클라이언트 구현 과제 안내

## Assignment 1 - Login / SignUp

- /auth 경로에 로그인 / 회원가입 기능을 개발합니다
    - 로그인, 회원가입을 별도의 경로로 분리해도 무방합니다
    - [ ]  최소한 이메일, 비밀번호 input, 제출 button을 갖도록 구성해주세요
- 이메일과 비밀번호의 유효성을 확인합니다
    - [ ]  이메일 조건 : 최소 `@`, `.` 포함
    - [ ]  비밀번호 조건 : 8자 이상 입력
    - [ ]  이메일과 비밀번호가 모두 입력되어 있고, 조건을 만족해야 제출 버튼이 활성화 되도록 해주세요
- 로그인 API를 호출하고, 올바른 응답을 받았을 때 루트 경로로 이동시켜주세요
    - [ ]  응답으로 받은 토큰은 로컬 스토리지에 저장해주세요
    - [ ]  다음 번에 로그인 시 토큰이 존재한다면 루트 경로로 리다이렉트 시켜주세요
    - [ ]  어떤 경우든 토큰이 유효하지 않다면 사용자에게 알리고 로그인 페이지로 리다이렉트 시켜주세요

## Assignment 2 - Todo List

- Todo List API를 호출하여 Todo List CRUD 기능을 구현해주세요
    - [ ]  목록 / 상세 영역으로 나누어 구현해주세요
    - [ ]  Todo 목록을 볼 수 있습니다.
    - [ ]  Todo 추가 버튼을 클릭하면 할 일이 추가 됩니다.
    - [ ]  Todo 수정 버튼을 클릭하면 수정 모드를 활성화하고, 수정 내용을 제출하거나 취소할 수 있습니다.
    - [ ]  Todo 삭제 버튼을 클릭하면 해당 Todo를 삭제할 수 있습니다.
- 한 화면 내에서 Todo List와 개별 Todo의 상세를 확인할 수 있도록 해주세요.
    - [ ]  새로고침을 했을 때 현재 상태가 유지되어야 합니다.
    - [ ]  개별 Todo를 조회 순서에 따라 페이지 뒤로가기를 통하여 조회할 수 있도록 해주세요.
- 한 페이지 내에서 새로고침 없이 데이터가 정합성을 갖추도록 구현해주세요
    - [ ]  수정되는 Todo의 내용이 목록에서도 실시간으로 반영되어야 합니다

## 과제 참고 사항

1. 로컬 서버를 실행했을 때 생성되는 `db/db.json`이 DB 역할을 하게 됩니다. 해당 파일을 삭제하면 DB는 초기화 됩니다.
2. 로그인 / 회원 가입 기능은 유저를 DB에 추가하고 JWT 토큰을 응답으로 돌려줄 뿐, 실제 유저별로 Todo 목록을 관계 지어 관리하지는 않습니다. (모든 유저가 하나의 Todo를 가짐)
3. 로그아웃은 클라이언트 단에서 localStorage에 저장된 token을 삭제하는 방식으로 간단히 구현해주세요.

# 2-1) API 실행

```
> yarn

> yarn start # <http://localhost:8080>

```

# 2-2) API 스펙

## [Todos](notion://www.notion.so/Developer-Seobwoo-Kim-Portpolio-a2d2e2fb6c6e4a4b9de09c47e99f3010?p=fba4efae1e6d481fa221077ec5de9bf4&pm=c#todos)

- [getTodos](notion://www.notion.so/Developer-Seobwoo-Kim-Portpolio-a2d2e2fb6c6e4a4b9de09c47e99f3010?p=fba4efae1e6d481fa221077ec5de9bf4&pm=c#getTodos)
- [getTodoById](notion://www.notion.so/Developer-Seobwoo-Kim-Portpolio-a2d2e2fb6c6e4a4b9de09c47e99f3010?p=fba4efae1e6d481fa221077ec5de9bf4&pm=c#getTodoById)
- [createTodo](notion://www.notion.so/Developer-Seobwoo-Kim-Portpolio-a2d2e2fb6c6e4a4b9de09c47e99f3010?p=fba4efae1e6d481fa221077ec5de9bf4&pm=c#createTodo)
- [updateTodo](notion://www.notion.so/Developer-Seobwoo-Kim-Portpolio-a2d2e2fb6c6e4a4b9de09c47e99f3010?p=fba4efae1e6d481fa221077ec5de9bf4&pm=c#updateTodo)
- [deleteTodo](notion://www.notion.so/Developer-Seobwoo-Kim-Portpolio-a2d2e2fb6c6e4a4b9de09c47e99f3010?p=fba4efae1e6d481fa221077ec5de9bf4&pm=c#deleteTodo)

## [Auth](notion://www.notion.so/Developer-Seobwoo-Kim-Portpolio-a2d2e2fb6c6e4a4b9de09c47e99f3010?p=fba4efae1e6d481fa221077ec5de9bf4&pm=c#auth)

- [login](notion://www.notion.so/Developer-Seobwoo-Kim-Portpolio-a2d2e2fb6c6e4a4b9de09c47e99f3010?p=fba4efae1e6d481fa221077ec5de9bf4&pm=c#login)
- [signUp](notion://www.notion.so/Developer-Seobwoo-Kim-Portpolio-a2d2e2fb6c6e4a4b9de09c47e99f3010?p=fba4efae1e6d481fa221077ec5de9bf4&pm=c#signUp)

# 1-3) Todos

## getTodos

### URL

- GET `/todos`
- Headers
    - Authorization: login token

### 응답 예시

```
{
  "data": [
    {
      "title": "hi",
      "content": "hello",
      "id": "z3FGrcRL55qDCFnP4KRtn",
      "createdAt": "2022-07-24T14:15:55.537Z",
      "updatedAt": "2022-07-24T14:15:55.537Z"
    },
    {
      "title": "hi",
      "content": "hello",
      "id": "z3FGrcRL55qDCFnP4KRtn",
      "createdAt": "2022-07-24T14:15:55.537Z",
      "updatedAt": "2022-07-24T14:15:55.537Z"
    }
  ]
}

```

## getTodoById

### URL

- GET `/todos/:id`
- Headers
    - Authorization: login token

### 응답 예시

```
{
  "data": {
    "title": "hi",
    "content": "hello",
    "id": "z3FGrcRL55qDCFnP4KRtn",
    "createdAt": "2022-07-24T14:15:55.537Z",
    "updatedAt": "2022-07-24T14:15:55.537Z"
  }
}

```

## createTodo

### URL

- POST `/todos`
- Parameter
    - title: string
    - content: string
- Headers
    - Authorization: login token

### 응답 예시

```
{
  "data": {
    "title": "hi",
    "content": "hello",
    "id": "z3FGrcRL55qDCFnP4KRtn",
    "createdAt": "2022-07-24T14:15:55.537Z",
    "updatedAt": "2022-07-24T14:15:55.537Z"
  }
}

```

## updateTodo

### URL

- PUT `/todos/:id`
- Parameter
    - title: string
    - content: string
- Headers
    - Authorization: login token

### 응답 예시

```
{
  "data": {
    "title": "제목 변경",
    "content": "내용 변경",
    "id": "RMfi3XyOKoI5zd0A_bsPL",
    "createdAt": "2022-07-24T14:25:48.627Z",
    "updatedAt": "2022-07-24T14:25:48.627Z"
  }
}

```

## deleteTodo

### URL

- DELETE `/todos/:id`
- Headers
    - Authorization: login token

### 응답 예시

```
{
  "data": null
}

```

# 1-4) Auth

## login

### URL

- POST `/users/login`
- Parameter
    - email: string
    - password: string

### 응답 예시

```
{
  "message": "성공적으로 로그인 했습니다",
  "token": "eyJhbGciOiJIUzI1NiJ9.YXNkZkBhc2RmYXNkZi5jb20.h-oLZnV0pCeNKa_AM3ilQzerD2Uj7bKUn1xDft5DzOk"
}

```

## signUp

### URL

- POST `/users/create`
- Parameter
    - email: string
    - password: string

### 응답 예시

```
{
  "message": "계정이 성공적으로 생성되었습니다",
  "token": "eyJhbGciOiJIUzI1NiJ9.YXNkZkBhc2RmYXNkZi5jb20.h-oLZnV0pCeNKa_AM3ilQzerD2Uj7bKUn1xDft5DzOk"
}

```

---

## Client SIde 구현 (사전과제) (완료)

### /auth

- Login - 작업 완료
- SignUp - 작업 완료

https://youtu.be/GjzYHI-4sx8

- LocalStorage

![Untitled](/assets/img/portfolio/onboarding03.png)

### /todos - main page

![스크린샷 2023-01-06 오전 11.41.27.png](/assets/img/portfolio/onboarding04.png)

## getTodos - 작업완료 - 모든 todo 정보를 서버에 Request 후 렌더링

- headers - token

## createTodo - 작업 완료 - 서버에 해당하는 todo를 만드는 POST 요청 후 Request Data 기존 State에 병합 후 리렌더링

- TodoApp.tsx 코드 중
    
    ![스크린샷 2023-01-06 오전 11.03.56.png](/assets/img/portfolio/onboarding05.png)
    

### getTodoById - 작업완료 - 해당하는 할 일을 클릭할 시 상세보기 View

### updateTodo - 작업완료 - 해당하는 할 일의 내용 변경

### deleteTodo - 작업완료 - 해당하는 할 일 삭제

https://youtu.be/Ahr69YCvS_s

## 사전 과제 (제출 완료)

![Untitled](/assets/img/portfolio/onboarding06.png)

---

2023.01.10일자 교육 후일담

## [Code refactoring] - 원티드 프리온보딩 프론트엔드 챌린지 - 사전과제

원티드에서 프리온보딩 프론트엔드 챌린지를 참여하고 있다.

라이브 세션에 참가하신 개발자 분들이 500명이 넘어서 설마 내 코드가 리뷰되겠어? 라는 생각이 있었는데

사전 과제로 제출한 코드 중 유저의 토큰을 관리하는 코드에 관해 멘토님이 리뷰를 진행해주셨다.

### 멘토님이 리뷰 주신 코드

- path : modules/auth/authValidation.tsx

```tsx
export const getUserInfomation = async () => {
    let getUserInfoResult = {
        success: false,
        email: '',
        token: '',
    }
    let emailResult = await localStorage.getItem('email');
    let tokenResult = await localStorage.getItem('token');

    if(emailResult && tokenResult){
        getUserInfoResult.email = emailResult;
        getUserInfoResult.token = tokenResult;
        getUserInfoResult.success = true;
    }

    return getUserInfoResult;
}
```

> 부끄럽게도 벌써 실수가 눈에 보인다
얼마전까지 React Native를 공부하면서 ‘Async Storage’를 공부했는데
localStorage에 비동기 작업을 걸려고 await를 사용하는 아주 기초적인 실수를 해버린 것;;🫠
구현하고 제출하느라 정신 없어서 눈치를 못채고 제출했더니 이런 실수를 그대로 제출했다니..

~~저걸 라이브 세션에서 보고는 어질 어질했다..~~

하지만 실수를 했으면 고쳐야 하는 것

멘토님이 주신 해당 코드의 피드백)
- `get-` 접두사 → 동사인가?
- localStorage는 비동기일까? → 함수의 색(color) 문제 (https://willowryu.github.io/2021-05-21/)

그리고 해당 소스를 더 가독성 좋게 리팩토링 하는 것을 직접 보여주셨다.
 

### 리팩토링

- 해당 소스에서 크게 문제가 되는 점은 멘토님이 피드백 주신 두 가지
    - localStorage는 비동기인가?
    - 해당 모듈의 네이밍이 적절한가?
        
        > 우선 localStorage의 모든 작업은 동기적으로 이루어진다.
        >그렇기 때문에 비동기로 사용하려던 내용을 수정하고 해당 부분의 코드가 수정이 필요하다.
        >
        >해당 모듈의 네이밍이 적절한가?
        >항상 함수나 변수 이름 작명은 많은 고민을 낳는 것 같다..
        >우선 ’get’ 을 떠올릴 때 무엇인가를 얻어온다 라는 느낌까지는 괜찮은데
        >지금 다시 보니까 API를 호출할거 같은 느낌이 든다.
        >
        >그리고 멘토님의 리팩토링 과정을 보고 좀 더 간결하게 코드를 작성할 수 있을 것 같다.
        > 

- 정리가 된 코드

```tsx
export const getUserInfomation = () => {
		const email = localStorage.getItem('email');
		const token = localStorage.getItem('token');

		const conditions = [email, token]

		if(conditions.every(condition => !!condition)) {
			return {
        success: true,
        email,
        token,
	    }
		}

    return {
        success: false,
        email: '',
        token: '',
    }
}
```

> 비동기 사용을 위한 async await 를 코드에서 덜어내고,
>
>localStorage에서 해당 값의 정보를 가져오는 부분을 모듈 상단 부로 이동
>
>array에 localStorage에서 받아온 결과를 넣고,
>
> token과 email 값의 검사를 Array.prototype.every() 를 통해 테스트한다.
>Boolean 값을 반환하기 때문에 if 문을 통해 해당 모듈에서 반환을 해주기 위한 
>결과 값들을 바로 반환하여 줄 수 있다.
>
>구현 후 리팩토링에도 정말 많은 신경을 쓰도록 노력해봐야겠다.
>