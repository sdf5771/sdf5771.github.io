---
layout: single
title:  "**Javascript Test - Jest**"
categories: Javascript, Test, Jest
toc: true
toc_label: "Table of Contents"
toc_icon: "bookmark"
---

# Jest 란?

- Facebook에서 만든 테스트 도구이다.
- zero config 철학을 가지고 있기 때문에 별도의 설정 없이 빠르게 Test Case를 작성할 수 있다.

## Test를 위한 프로젝트 세팅 및 설치

- 나는 github/jest_tutorial 이라는 폴더에 프로젝트를 세팅했다.
- package.json 세팅을 위해 npm init을 사용하고 jest를 설치한다.
- jest는 테스트 도구로써 개발에서만 사용할 것이기 때문에 ‘devDependencies’ 에 추가한다.

```jsx
npm init

npm install jest --save-dev
```

## package.json

```jsx
{
  "name": "jest_tutorial",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "jest"
  },
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "jest": "^29.7.0"
  }
}
```

> 테스트 케이스를 작성할 파일의 경우 ‘test.js’로 끝나거나, ‘__tests__’ 폴더에 있는 파일들은 자동으로 인식한다. 만약 직접 선택한 파일만 test하고 싶다면 npm test 뒤에 파일 명 혹은 경로를 입력하면 된다.
> 

## 함수를 모아두고 테스트하기 위한 파일

### fn.js

```jsx
const fn = {
    add : (num1, num2) => num1 + num2,
    makeUser : (name, age) => ({name, age, gender : undefined}),
    throwErr : () => {
        throw new Error("xx");
    },
    getName: (callback) => {
        const name = "Mike";

        setTimeout(() => {
            callback(name);
        }, 3000);
    },
    getAge: () => {
        const age = 30;

        return new Promise((res, rej) => {
            setTimeout(() => {res(age)}, 3000);
        })
    },
    getAgeError: () => {
        const age = 30;

        return new Promise((res, rej) => {
            setTimeout(() => {
                rej('error')
            }, 3000)
        })
    }
}

module.exports = fn;
```

## 만들어둔 함수를 테스트 하기 위한 파일

### fn.test.js

```jsx
const fn = require('./fn');

test('1은 1이다.', () => {
    //expect : 검증할 값
    //toBe : 기대 값
    expect(1).toBe(1);
})

test('2 더하기 3은 5다.', () => {
    expect(fn.add(2, 3)).toBe(5);
});

test('2 더하기 3은 5다.', () => {
    expect(fn.add(2, 3)).toEqual(5);
});

test('3 더하기 3은 5가 아니다.', () => {
    expect(fn.add(3, 3)).not.toBe(5);
})

// (1) 객체나 배열은 재귀적으로 돌면서 값을 확인해야 하기 때문에 toEqual을 사용해야한다.
// 보다 엄격하게 검사하려면 toStrictEqual을 사용하는게 좋다.
test('이름과 나이를 전달받아서 객체를 반환해줘', () => {
    expect(fn.makeUser('Mike', 30)).toEqual(
        {
            name : 'Mike',
            age : 30,
        }
    );
})

// (2) 객체나 배열은 재귀적으로 돌면서 값을 확인해야 하기 때문에 toEqual을 사용해야한다.
// 보다 엄격하게 검사하려면 toStrictEqual을 사용하는게 좋다.
test('이름과 나이를 전달받아서 객체를 반환해줘', () => {
    
    expect(fn.makeUser('Mike', 30)).toStrictEqual(
        {
            name : 'Mike',
            age : 30,
        }
    );
})

test("null은 null이다.", () => {
    expect(null).toBeNull();
})

test("0은 false 이다.", () => {
    expect(fn.add(1, -1)).toBeFalsy();
})

test("0은 false 이다.", () => {
    expect(fn.add("hello", "world")).toBeFalsy();
})

test("비어있지 않은 문자열은 true 이다.", () => {
    expect(fn.add("hello", "world")).toBeTruthy();
})

test("ID는 10자 이하여야 한다.", () => {
    const id = "THE_BLACK";
    expect(id.length).toBeLessThanOrEqual(10);
})

test("비밀번호는 4자리여야 한다.", () => {
    const password = '3414';
    expect(password.length).toBe(4);
})

test("비밀번호는 4자리여야 한다.", () => {
    const password = '3414';
    expect(password.length).toEqual(4);
})

// 이진법을 이용한 계산으로 몇몇 프로그래밍 언어들은 소수점을 정확하게 표현하지 못하기 때문에 무한소수로 출력되는 경우가 있다.
// 그러므로 소수점을 활용한 계산에서는 toBeCloseTo를 사용해서 test하는 것이 적절하다.
test('0.1 더하기 0.2는 0.3이다.', () => {
    expect(fn.add(0.1, 0.2)).toBeCloseTo(0.3);
})

test("Hello World 에 a 라는 글자가 있는가 ? ", () => {
    expect('Hello World').toMatch(/H/i);
})

test("유저 리스트에 Mike가 있는가?", () => {
    const user = "Mike";
    const userList = ["Tom", "Mike", "Kai"];

    expect(userList).toContain(user);
})

test("에러가 나는가?", () => {
    expect(() => fn.throwErr()).toThrow('xx');
})

//비동기 함수 테스트를 위해서는 test에 전달되는 callback 함수에 done을 전달해주면 된다.
//jest는 끝에 코드까지 도달하면 종료되기 때문에 done을 전달하지 않으면 제대로된 테스트가 진행되지 않는다.
test("3초 후에 받아온 이름은 Mike", (done) => {
    function callback(name){
        try {
            expect(name).toBe("Mike");
            done();
        } catch (error) {
            done();
        }
    }

    fn.getName(callback)
})

// Promise 를 테스트 할 경우
// Promise 를 사용하면 해당 코드를 return 해주어야 한다 그렇지 않으면 코드가 실행되고 바로 종료되므로 제대로된 테스트가 진행되지 않는다.
// 좀더 간단하게 사용하고 싶다면 Matcher를 사용하면된다 (resolves, rejects)
test("3초 후에 받아온 나이는 30", () => {
    return expect(fn.getAge()).resolves.toBe(30);

    // return fn.getAge().then(age => {
    //     expect(age).toBe(30);
    // })
})

// Promise에서 reject를 테스트할 경우
test("3초 후애 에러를 리턴", () => {
    return expect(fn.getAgeError()).rejects.toMatch('error');
})
```

## npm test 결과

```jsx
➜  jest_tutorial npm test

> jest_tutorial@1.0.0 test
> jest

 FAIL  ./fn.test.js (9.261 s)
  ✓ 1은 1이다. (1 ms)
  ✓ 2 더하기 3은 5다.
  ✓ 2 더하기 3은 5다. (1 ms)
  ✓ 3 더하기 3은 5가 아니다.
  ✓ 이름과 나이를 전달받아서 객체를 반환해줘
  ✕ 이름과 나이를 전달받아서 객체를 반환해줘 (4 ms)
  ✓ null은 null이다. (1 ms)
  ✓ 0은 false 이다.
  ✕ 0은 false 이다.
  ✓ 비어있지 않은 문자열은 true 이다.
  ✓ ID는 10자 이하여야 한다.
  ✓ 비밀번호는 4자리여야 한다.
  ✓ 비밀번호는 4자리여야 한다.
  ✓ 0.1 더하기 0.2는 0.3이다. (1 ms)
  ✓ Hello World 에 a 라는 글자가 있는가 ?
  ✓ 유저 리스트에 Mike가 있는가?
  ✓ 에러가 나는가? (2 ms)
  ✓ 3초 후에 받아온 이름은 Mike (3002 ms)
  ✓ 3초 후에 받아온 나이는 30 (3002 ms)
  ✓ 3초 후애 에러를 리턴 (3001 ms)

  ● 이름과 나이를 전달받아서 객체를 반환해줘

    expect(received).toStrictEqual(expected) // deep equality

    - Expected  - 0
    + Received  + 1

      Object {
        "age": 30,
    +   "gender": undefined,
        "name": "Mike",
      }

      34 | test('이름과 나이를 전달받아서 객체를 반환해줘', () => {
      35 |
    > 36 |     expect(fn.makeUser('Mike', 30)).toStrictEqual(
         |                                     ^
      37 |         {
      38 |             name : 'Mike',
      39 |             age : 30,

      at Object.toStrictEqual (fn.test.js:36:37)

  ● 0은 false 이다.

    expect(received).toBeFalsy()

    Received: "helloworld"

      51 |
      52 | test("0은 false 이다.", () => {
    > 53 |     expect(fn.add("hello", "world")).toBeFalsy();
         |                                      ^
      54 | })
      55 |
      56 | test("비어있지 않은 문자열은 true 이다.", () => {

      at Object.toBeFalsy (fn.test.js:53:38)

Test Suites: 1 failed, 1 total
Tests:       2 failed, 18 passed, 20 total
Snapshots:   0 total
Time:        9.288 s
Ran all test suites.
➜  jest_tutorial
```

> Jest에는 다양한 Matcher가 존재하고 Test할 함수나 기능에 따라 유용하게 사용할 수 있기 때문에 공식 Docs를 보면서 필요한 Matcher를 찾아보며 테스트를 진행하면 좋을거 같다.
> 

Jest Matchers : 

[Using Matchers · Jest](https://jestjs.io/docs/using-matchers)