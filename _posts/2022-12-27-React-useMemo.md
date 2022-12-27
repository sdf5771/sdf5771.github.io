---
layout: single
title:  "**ReactHook_useMemo**"
categories: React
---

## useMemo

- **Memo 는 Memoization(메모이제이션)을 뜻한다.**
  - Memoization - 동일한 값을 return 하는 함수를 반복적으로 호출해야 된다면, 해당 값을 메모리에 저장해서 필요할 때 마다 메모리에서 꺼내서 재사용을 하는 기법이다 (메모리에 캐싱)
  - 쉽게 말하면 자주 필요한 값을 맨 처음 계산할 때 캐싱을 해두고, 다시 계산 하는 것이 아니라 캐시에서 꺼내쓰는 방법
  - React에서 함수형 컴포넌트는 함수이기 때문에 state 나 props의 변화로 인해 자동으로 렌더링 될 때 항상 재 실행된다. 그 때마다 무거운 로직을 가졌지만 변경이 되지 않을 계산 값을 맨 처음에만 계산하여 useMemo로 ‘메모이제이션’ 해두고 필요한 곳에 캐싱해둔 값을 재사용하여 해당 컴포넌트가 렌더링 되어도 무거운 로직은 다시 사용하지 않은 채 렌더링하여 컴포넌트의 성능을 최적화 시킬 수 있는 것이다.

- **useMemo 는 꼭 필요한 곳에서만 사용해야한다.**
  - useMemo를 남용하면 오히려 성능에 무리가 될 수 있다.
  - useMemo를 사용한다는 것은 값을 재활용해서 사용하기 위해 따로 메모리를 사용하여 저장을 해놓는 것이기 때문에 불필요한 값들까지 모두 Memoization 해버리면 오히려 성능이 악화 될 수 있다.

```jsx
/*

 - useMemo는 2개의 인자를 받는다.

첫 번째는 callback 함수 - Memoization 해줄 값을 계산해서 return 하는 용도,
	callback 함수가 return 하는 값이 useMemo가 return 하는 값이다.

두 번째는 배열 - '의존성 배열(Dependency array)' 이라고도 불린다.
	배열에 담긴 요소에 값이 update될 때만 callback 함수를 다시 호출해서 Memoization 된 값을 update 후
	다시 Memoization 해준다.
	만약 빈 배열을 그대로 넘겨줄 경우 Component가 Mount 되었을 때만 검사하고, 이 후에는 update하지 않는다.

*/
const value = useMemo(()=>{
	return calculate();
}, [item])
```

## Example 1

```jsx
import React, { useMemo, useState } from 'react';

const hardCalculate = (number) => {
	for (let i = 0; i < 999999999; i++){} //계산에 딜레이를 주기 위한 의미 없는 for 문
	return number + 10000;
}

const easyCalculate = (number) => {
	return number + 1;
}

function App(){
	const [hardNumber, setHardNumber] = useState(1);
	const [easyNumber, setEasyNumber] = useState(1);

	//const hardSum = hardCalculate(hardNumber);
	/*
		Dependency Array에 hardNumber를 추가하여,
		hardNumber가 변경될 때만, useMemo가 callback 함수에서 hardCalculate 실행시켜서 재연산한다.
		만약에 hardNumber가 변경되지 않았다면 기존에 hardSum에 가지고 있던 값을 재사용하게 된다.
	*/
	const hardSum = useMemo(() => {
		return hardCalculate(hardNumber);
	}, [hardNumber])
	const easySum = easyCalculate(easyNumber);

	return (
		<div>
			<p>Hard Calculater</p>
			<input
				type="number"
				value={hardNumber}
				onChange={(event) => setHardNumber(parseInt(event.target.value))} 
			/>
			<span> + 10000 = {hardSum}</span>

			<br />

			<p>Easy Calculater</p>
				<input
					type="number"
					value={hardNumber}
					onChange={(event) => easyCalculate(parseInt(event.target.value))} 
				/>
				<span> + 1 = {easySum}</span>
			</div>
	);
}

export default App;
```

## Example 2