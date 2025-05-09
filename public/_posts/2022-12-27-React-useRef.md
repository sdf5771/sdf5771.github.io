---
layout: post
title: "ReactHook_useRef"
author: Seobisback
tags: [React, Hooks, useRef]
categories: Syntax
---


## useRef 는 언제 사용이 되는가?

- useRef를 사용하는 대표적인 두 가지 상황
- ref는 state와 비슷하게 어떠한 값을 저장해두는 저장공간으로 사용한다.
- State
  - 함수형 컴포넌트는 결국 함수이기 때문에 state 변경에 의한 리렌더링은 함수를 다시 호출하는 것을 의미한다. 고로 state가 변경되면 아래와 같은 절차를 따르게 된다.
  - 절차 : State의 변화 → 렌더링 → 컴포넌트 내부 변수들 초기화
  - 이 현상 때문에 함수 내부의 변수들이 다시 초기화 되는 경우가 발생하여 개발자가 원하지 않는 순간에 함수가 리렌더링 되는 현상에 곤란해지는 경우가 있다.
- Ref
  - Ref의 유용한 점은 개발자가 Ref 안에 있는 값을 아무리 변경해도 Component는 다시 렌더링 되지 않는다는 장점이 있다.
  - 변경 시 렌더링을 발생시키지 말아야 하는 값을 다룰 때 가장 편리하다.
  - Ref의 변화 → No 렌더링 → 변수들의 값이 유지됨
  - 또한 Component가 아무리 리렌더링 되어도 Ref 안에 값은 변하지 않고 유지가 된다.
- State의 변화 → 렌더링 → 하지만 Ref의 값은 유지됨.
- Ref를 통해 DOM 요소에 접근할 수 있다.
  - Ref를 사용하면 DOM 요소에 접근하여 focus() 같은 DOM 요소에 사용하는 메서드를 사용할 수 있다.
  - Vanilla JS의 document.querySelector()와 비슷하다.

```jsx
const ref = useRef(value);

console.log(ref) // { current : value }

//ref Object는 value 값을 수정이 가능하다
ref.current = "hello"
console.log(ref) // { current : "hello" }

ref.current = "nice"
console.log(ref) // { current : "nice" }
```

- 반환된 ‘ref’ 는 Component의 전생애주기를 통해 유지되기 때문에 Component가 리렌더링 되어도 언마운트 되기 전까지는 해당 값이 유지가 된다.

## Ref를 이용한 데이터 저장 및 컴포넌트 렌더링 관리

```jsx
import React, { useState, useRef } from 'react';

const App = () => {
	const [count, setCount] = useState(0);
	const countRef = useRef(0);

	console.log('Rerendering now!!')

	const increaseCountState = () => {
		setCount(count + 1);
	}

	const increaseCountRef = () => {
		countRef.current = countRef.current + 1;
	}

	return (
		<div>
			<p>State: {count}</p>
			<p>Ref: {countRef.current}</p>
			<button onClick={increaseCountState}>State Plus</button>
			<button onClick={increaseCountRef}>Ref Plus</button>
		</div>
	);
}

export default App;
```

## Ref를 이용한 DOM 접근