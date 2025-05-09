---
layout: post
title: "Typescript를 사용하는 이유"
author: Seobisback
tags: [Typescript, Javascript]
categories: Syntax
---

## 개요

- TypeScript는 JavaScript를 기반으로 만들어진 언어이다.
- JavaScript가 가지고 있는 여러 문제를 해결하고 보완하기 위해 만들어짐
- TypeScript를 사용하면 타입의 안정성에 있어서 Java나 C#과 비슷한 개발 경험을 제공한다.
- JavaScript 개발자가 버그나 코드의 안정성 그리고 생산성을 높이고 싶다면 배우기 좋은 언어이다.
  - JS의 문제점 (TypeScript를 사용하는 이유)
    - 가장 큰 이유로는 자바스크립트가 매우 유연한 언어임이 크다.
    - 해당 코드로 예를 들어보자

      ```jsx
      let javaScriptResult = [1, 2, 3, 4] + false
      /*
        위 코드는 숫자가 담겨있는 배열에 
      Boolean Type의 false를 더하려고 하는 코드이다.
      */
      
      console.log('JS Result ', javaScriptResult)
      // JS Result '1,2,3,4false'
      
      /*
        그리고 해당 코드의 결과로는 console.log 의 결과처럼 출력이 된다.
      
        [문제점]
        1. 첫 번째 문제로는 배열이 사라진다. 
        결과 값이 그냥 String Type이 되어버린다.
        2. 두 번째 문제로는 Boolean Type의 false는
        String이 되어버린다. 
        3. 세 번째 문제로는 결론적으로 JS는 위의 코드를 그대로 허용해버린다.
        다른 언어에서는 위와 같은 코드를 허용하지 않고 에러를 띄워주는데,
        JS는 이런 말도 안되는 코드를 허용해서 결과를 만들어 버리는 문제에 있다.
      
        즉, Data Type에 대한 강제가 없다.
        이런 코드를 쓰는 개발자는 없겠지만 이걸 그대로 
        결과 값으로 치는 것에 문제가 있다.
      */
      ```

      ```jsx
      //이번에는 divide라는 function을 만들어보겠다.
      function divide(a, b){
        return a / b
      }
      
      /*
        위와 같은 함수를 이상적으로 사용하는 방법은 당연하게도
        숫자 타입의 데이터를 a와 b에 넣어주는 것이다.
        즉 입력 값이 숫자일 때만 해당 함수가 실행이 되어야 한다는 것이다.
        
        하지만 자바스크립트는 이 함수를 올바르게 사용하도록 강제하지 않는다.
      */
      
      //올바른 함수 사용
      let result1 = divide(2, 3);
      console.log('result1', result1);
      // result1 0.6666666666666666
      
      //잘못된 함수 사용
      let result2 = divide("xxxxxx");
      console.log('result2 ', result2);
      // result2 NaN
      // 숫자 타입의 인자를 받아야 하는데 문자열을 입력 받고도 에러가 나지 않고,
      // Not a Number를 출력한다.
      // 그리고 입력 값이 두 개인데 하나만 보내도 이걸 실행해준다.
      ```

    - 위 코드 예제를 보면 JavaScript는 divide 함수에서 a와 b가 Number Type이어야 하는지, 그리고 함수의 필수 입력 값이 두 개인지 아니면 선택사항인지를 전혀 고려하지 않는다.
    - 가장 심각한 Error는 바로 런타임 에러이다.

      ```jsx
      const objectVar = { name: 'seobisback' }
      
      objectVar.email()
      /*
        위와 같은 에러는 그나마 감사하게도 TypeError 메세지를 띄우고,
        이런 함수는 없다라고 에러를 띄워줄 것이다.
      
        하지만 문제는 이런 코드는 컴파일 자체가 되면 안되는데,
        실행이 되고 난 후 유저가 해당 코드가 포함된 기능을 사용할 때
        에러가 발생한다는 것이다.
      
        다른 언어같으면 이런 식으로 코드를 작성하면 실행조차 되지 않고
        컴파일을 시도하는 순간에 막힐 것이다.
      */
      ```

    - 위와 같은 문제 때문에 JS 개발자가 TypeScript로 넘어가는 것이다.
- TypeScript를 사용하면 **VS Code IDE**가 좋은 개발 경험을 준다고 한다. (노마드 코더 강의 중) 이유로는 TS와 VS Code는 Microsoft에서 만들었고, 편한 자동완성을 지원하며 위 코드처럼 런타임 에러가 발생할 수 있는 코드에는 해당 코드를 실행하면 유저에게 런타임 에러가 일어난다고 경고도 해준다고 한다.

TypeScript가 도움을 주는 방식

TypeScript로 작성한 코드를 컴파일하면, 자바스크립트 코드가 된다.

여기서 생기는 의문으로는 ‘타입스크립트 코드가 결국 자바스크립트 코드가 되면 어떻게 에러를 핸들링 해준다는 건데?’ 이다.

- TypeScript는 에러가 있으면 JavaScript 코드로 컴파일 되지 않는다.
- TypeScript는 에러가 발생할 것 같은 코드를 감지하면, 아예 JavaScript로 컴파일 되지 않는다. 이런 기능은 유저가 코드를 실행하는 런타임에 발생하는 것이 아니기 때문에 만약 TypeScript가 성공적으로 컴파일 되어서 JavaScript 코드를 주면 TypeScript 코드가 제대로 작성이 된 것이고, Data의 Type에도 문제가 없다는 뜻이 된다. 즉 유저가 실행하는 JavaScript 코드에는 해당 에러가 존재하지 않는다는 의미가 된다.
- TypeScript에는 두 가지의 접근 방식이 있다.
  - Java처럼 데이터와 **변수의 타입을 명시적으로 정의**할 수 있고,
  - JavaScript처럼 변수만 **생성하고 타입을 명시하지 않을 수도 있다.**
    - 위와 같이 타입을 명시하지 않을 경우 TypeScript가 해당 **변수의 타입을 추론해준다는 것**이다.
    - Type Checker 가 Type을 확인하는 방식

      ```jsx
      // 타입을 명시하지 않는 방식
      let a = 'Hello';
      /*
        이렇게 코드를 작성하는 것만으로 Typescript는 a의 타입을 추론해준다.
        a에 담긴 데이터를 보고는 a는 string type 이어야 한다 라는 것을
        Typescript가 추론하는 것이다.
      */
      
      // 타입을 명시하는 방식
      let b : boolean = false;
      /*
        이렇게 코드를 작성하면 Typescript는 b의 타입을 추론할 필요 없이
        개발자가 해당 변수의 타입을 명시하고 생성하였기 때문에 다른 타입으로
        변수의 값을 수정하려고 할 경우 에러를 발생시켜준다.
      */
      ```

- 많은 타입을 재사용할 수 있게 만들 경우 Alias 타입을 생성하면 된다.

```jsx
// Alias(별칭) 타입을 생성한 경우
/*
	Alias 타입을 생성할 경우

	타입 명은 대문자로 시작한다. - Pascal case
*/ 
type Player = {
	name: string,
	age? : number // 선택적 입력 가능
}

const playerOne : Player = {
	name: 'PlayerOne'
}

const playerTwo : Player = {
	name: 'PlayerTwo',
	age: 20
}

// Alias(별칭) 타입을 생성하지 않고 타입을 명시할 경우
const playerThree : {
	name: string,
	age? : number
} = {
	name: 'PlayerThree'
}
```

- 함수가 return 하는 값의 타입을 설정하는 방법

```jsx
type Player = {
	name: string,
	age?: number
}

function playerMaker(name: string) : Player {
	return {
		name
	}
}

// Arrow Function을 사용할 경우
const playerMaker = (name: string) : Player => {{name}}

const playerOne = playerMaker('PlayerOne');

playerOne.age = 20;
```

## ReadOnly

TypeScript에는 readonly를 설정하는 기능이 있다.

말 그대로 readonly 설정된 변수 등에 write 기능을 허용하지 않는 것이다.

readonly가 설정된 것은 immutability(불변성)을 갖게 된다.

```jsx
// use reedonly
const numbers: readonly number[] = [1,2,3,4];

numbers.push(1) //Error 

// can write
const numbers: number[] = [1,2,3,4];

numbers.push(1) // work
```

## Tuple

Tuple은 Array를 생성할 수 있게 하는데 있어서 최소한의 길이를 가져야 하고,

특정 위치에 특정 타입이 존재해야 한다.

```jsx
const player: [string, number, boolean] = ['seobisback', 1, true];

player[0] = 1 // Error 
```

## any

Typescript 에서는 여러가지 타입이 존재하는데 그것은 Javascript 타입이 많다

하지만 Typescript에서만 사용할 수 있는 타입이 있고 그것은 ‘any’ 이다.

any는 Typescript의 보호장치에서 벗어날 수 있게 해준다.

**가장 좋은 것은 any를 사용하지 않는 것이다.** (~~당연하게도 Typescript의 보호 장치를 사용하고 바보같은 실수를 하지 않기 위해서 Typescript를 사용하기 때문~~)

하지만 Typescript에는 ‘any’가 존재하고 그렇기 때문에 공부할 필요는 있다.

‘any’를 사용하면 말 그대로 모든 타입을 허용하는 것이다.

**코드를 보자**

```jsx
// if use 'any'
const a : any[] = [1,2,3,4]
const b : any = true

a + b // 원래라면 에러를 던져야 하는 Typescript지만 이 코드를 허용해버린다.

// 현재 코드에서 'any'를 지우면 Typescript는 바로 에러를 던진다.
```

## unknown

Typescript에만 존재하는 타입이다.

만약 API에게 응답 데이터를 받는데 해당 데이터의 타입을 알 수 없을 경우

‘unknown’이라는 타입을 사용한다.

```jsx
let a: unknown;

let b = a + 1; //Error

// typescript에서 unknown을 사용하려면 type을 check해야한다.

if(typeof a === 'number'){
	let b = a + 1; // 허용
}
// 위와 같이 타입을 체크 후 사용할 경우 typescript는 이를 허용한다.
// 왜냐하면 해당 범위 안에서의 a는 number이기 때문이다.

let b = a.toUpperCase() // Error

if(typeof a === 'string'){
	let b = a.toUpperCase() // 허용
}
// 위와 같이 타입을 체크 후 사용할 경우 typescript는 이를 허용한다.
// 왜냐하면 해당 범위 안에서의 a는 stringr이기 때문이다.
```

위와 같이 변수의 타입을 미리 알 수 없을 경우 ‘unknown’을 사용한다.

## void

Typescript에만 존재하는 타입이다.

void는 아무것도 return하지 않는 함수를 대상으로 사용한다.

보통은 void를 따로 지정해줄 필요가 없다.

```jsx
/*region Same Code*/
function hello(){
	console.log('say hello');
}

function hello(): void{
	console.log('say hello');
}
/*endregion Same Code*/

const a = hello();
a.toUpperCase(); // Error
```

## never

Typescript에만 존재하는 타입이다.

‘never’ 는 함수가 절대 return하지 않을 때 발생한다.

예를 들자면 함수에서 exception(예외)이 발생할 때 등이 있다.

```jsx
// 에러가 발생하는 함수
function hello():never{
	console.log('x')
}

// 정상적으로 동작하는 함수
function hello():never{
	throw new Error('xxx');
}
// 이 함수는 return 하지 않고 오류를 발생시키는 함수이다.
// 위와 같은 상황일 때, never를 사용한다.

function hello(name: string|number){
	if(typeof name === 'string'){
		name // (parameter) name: string
	} else if(typeof name === 'number'){
		name // (parameter) name: number
	} else {
		// 이 코드는 절대 실행되지 않아야 한다라는 뜻
		name // (parameter) name: never
	}
}
```