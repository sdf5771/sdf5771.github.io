---
layout: post
title: "[Code refactoring] - 원티드 프리온보딩 프론트엔드 챌린지 - 사전과제 리팩토링"
author: Seobisback
tags: [React, Refactoring, CodeReview]
categories: Syntax
---

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
- localStorage는 비동기일까? → 함수의 색(color) 문제 ([https://willowryu.github.io/2021-05-21/](https://willowryu.github.io/2021-05-21/))

그리고 해당 소스를 더 가독성 좋게 리팩토링 하는 것을 직접 보여주셨다.
>

### 리팩토링

- 해당 소스에서 크게 문제가 되는 점은 멘토님이 피드백 주신 두 가지
  - localStorage는 비동기인가?
  - 해당 모듈의 네이밍이 적절한가?

    > 우선 localStorage의 모든 작업은 동기적으로 이루어진다.
    그렇기 때문에 비동기로 사용하려던 내용을 수정하고 해당 부분의 코드가 수정이 필요하다.

    해당 모듈의 네이밍이 적절한가?
    항상 함수나 변수 이름 작명은 많은 고민을 낳는 것 같다..
    우선 ’get’ 을 떠올릴 때 무엇인가를 얻어온다 라는 느낌까지는 괜찮은데
    지금 다시 보니까 API를 호출할거 같은 느낌이 든다.

    그리고 멘토님의 리팩토링 과정을 보고 좀 더 간결하게 코드를 작성할 수 있을 것 같다.
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

localStorage에서 해당 값의 정보를 가져오는 부분을 모듈 상단 부로 이동

array에 localStorage에서 받아온 결과를 넣고,

token과 email 값의 검사를 **Array.prototype.every() 를 통해 테스트한다.
Boolean 값을 반환하기 때문에 if 문을 통해 해당 모듈에서 반환을 해주기 위한
결과 값들을 바로 반환하여 줄 수 있다.

구현 후 리팩토링에도 정말 많은 신경을 쓰도록 노력해봐야겠다.**
>