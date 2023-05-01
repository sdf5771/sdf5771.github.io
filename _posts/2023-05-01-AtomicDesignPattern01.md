---
layout: single
title:  "**아토믹 디자인 패턴 (Atomic Design Pattern) 공부 및 적용기 #1**"
categories: React, DesignPattern, Typescript
toc: true
toc_label: "Table of Contents"
toc_icon: "bookmark"
---

# 아토믹 디자인 패턴이란?

![Untitled](/assets/images/posts/2023-05-01-AtomicDesignPattern01/atom01.png)

- 좀 더 효과적인 컴포넌트를 구성하기 위한 방법론 중 하나이다.
- 일관되고 견고하고 재사용이 가능한 디자인 시스템을 만드는데 도움을 준다.
- 페이지를 디자인 하는 것이 아닌 컴포넌트들의 시스템을 디자인 하는 것이다.

## 장점과 단점

### 장점

- 한 번만 구현해 놓고 계속 가져다 쓸 수 있는 코드가 생긴다.
- Storybook을 활용해서 컴포넌트들을 더 효과적으로 정리할 수 있다.
- 어플리케이션의 복잡함을 해결해준다.
- 뷰와 비즈니스 로직의 분리로 프로젝트가 확장될 때 코드에서 문제를 디버깅하기 쉽다.

### 단점

- 단기적으로 봤을 때 개발 시간이 오래걸린다.

---

# 아토믹 디자인 패턴의 구성

## Atom (원자)

![Untitled](/assets/images/posts/2023-05-01-AtomicDesignPattern01/atom02.png)

< label, input, button atom >

- 가장 작은 컴포넌트의 단위이다.
- 원자는 어떠한 context가 주어져도 해당하는 컴포넌트가 생성될 수 있어야 한다.
- 다양한 state(상태)를 가지고 있어야하며 추상적이지만 최대한 포용할 수 있게 설계 되어야 한다.
- 원자는 margin이나 위치 값을 가지지 않는다.
- label, input, button과 같은 기본 HTML element 태그 혹은 글꼴, 애니메이션, 컬러 팔레트, 레이아웃과 같이 추상적인 요소도 포함될 수 있다.

## Molecule(분자)

![Untitled](/assets/images/posts/2023-05-01-AtomicDesignPattern01/atom03.png)

< search from molecule >

- Atom(원자)을 두 개 이상 조합하면 Molecule(분자)가 된다.
- 분자는 분자만의 프로퍼티를 가지고 있을 수 있고, 이를 활용해 원자에 기능을 만들어 줄 수 있다.
- 분자가 원자의 위치값을 지정하기도 한다.

## Organism(유기체)

![Untitled](/assets/images/posts/2023-05-01-AtomicDesignPattern01/atom04.png)

< haeder organism >

- Organism(유기체)은 분자를 엮어 만들어서 생성되고 때로는 분자가 되지 않은 원자가 엮이기도 한다.
- 유기체가 완성되면 컴포넌트가 최종 모습을 가지게 된다.
- 유기체는 분자와 원자의 위치 값을 조정한다.
- atom, molecule에 비해 좀 더 구체적으로 표현되고 컨텍스트를 가지기 때문에 상대적으로 재사용성이 낮아지는 특성을 가진다.

## Template (Layout)

![Untitled](/assets/images/posts/2023-05-01-AtomicDesignPattern01/atom05.png)

< layout이 적용된 molecule과 organism으로 구성된 template >

- 템플릿은 만들어진 유기체와 컴포넌트의 position을 정해주는 역할을 한다.
- 템플릿 파일은 주로 페이지를 구성하기 위해 서로 꿰매어진 유기체 그룹으로 구성되며, 이 부분에서 디자인을 확인하고 레이아웃이 실제로 구동하는지 볼 수 있다.
- 템플릿에는 styling이나 color가 들어가지 않는다.
- 템플릿의 역할은 페이지의 그리드를 정해주는 역할 뿐이다.
- 실제 컴포넌트를 레이아웃에 배치하고 구조를 잡는 와이어 프레임이다.
- 실제 콘텐츠가 없는 page 수준의 스켈레톤이라고 정의할 수 있다.

## Page

![Untitled](/assets/images/posts/2023-05-01-AtomicDesignPattern01/atom06.png)

< 여러가지 콘텐츠를 template에 적용하여 최종 UI를 보여주는 page >

- page는 유저가 볼 수 있는 실제 콘텐츠를 담는다.
- template의 인스턴스라고 할 수 있다.
- template을 이용해서 각 그리드에 컴포넌트를 그려서 디스플레이 한다.

---

# 어떻게 프로젝트 구조를 잡을까 ?

> 해당 소스는 Atomic Design Pattern과 React Recoil을 통한 어플리케이션 작성을 공부하기 위해 작성중인 코드이다.
> 

구조는 다른 분들의 소스를 참고하여 구성해보았다.

```tsx
├── Router.tsx
├── components
│   ├── Atoms
│   │   ├── Button.tsx
│   │   ├── Div.tsx
│   │   ├── Input.tsx
│   │   ├── Span.tsx
│   │   └── index.ts
│   ├── Molecules
│   │   ├── TodoCreateInput.tsx
│   │   └── index.ts
│   ├── Organisms
│   │   ├── TodoForm.tsx
│   │   └── index.ts
│   ├── Pages
│   │   ├── Main.tsx
│   │   └── index.ts
│   └── Template
│       └── index.ts
├── index.tsx
├── react-app-env.d.ts
├── reportWebVitals.ts
├── setupTests.ts
├── state
│   └── index.ts
└── test
    └── Pages
        └── Main.test.tsx
```

- src 디렉토리 밑에 components 디렉토리를 만들고 역할 별로 디렉토리를 나눈 후 index에서 관리할 수 있게끔 구조를 잡아보았다.

**‘component/Atoms/Input.tsx’**

- 또한 styled 컴포넌트를 적극 활용하여 스타일 코드를 props로 내려받아 사용할 수 있다.

> 개인적으로 구조를 잡고 구성하는 것에는 시간이 많이 걸리고 고민이 많지만 정말 깔끔한 코드를 작성할 수 있는 것 같음.
> 

```tsx
import styled from 'styled-components';

const Input = styled.input<React.CSSProperties & {
    placeholderColor?: string;
} 
>`
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;

    margin: ${({ margin }) => margin};
    padding: ${({ padding }) => padding || '8px'};
    line-height: ${({ lineHeight }) => lineHeight};
    height: ${({ height }) => height || '40px'};
    width: ${({ width }) => width || '100%'};
    border: ${({ border }) => border || '1px solid #e8e8e8'};
    box-sizing: border-box;
    border-radius: ${({ borderRadius }) => borderRadius || '8px'};
    background-color: ${({backgroundColor}) => backgroundColor};
    font-size: ${({ fontSize }) => fontSize || '16px'};

    :focus {
        outline: none;
    }
    ::placeholder {
        color: ${({placeholderColor}) => placeholderColor};
    }
`

export default Input;
```

이렇게 구성한 Atom Component를 Molecule Component에서 좀 더 복잡한 구조의 컴포넌트로 만들어서 재사용할 수 있다.

**‘component/Molecules/TodoCreateInput.tsx’**

```tsx
import React from 'react';
import Atoms from 'components/Atoms';

function TodoCreateInput(){
    return(
        <Atoms.Div display='flex' gap="5px">
            <Atoms.Input border="0px" backgroundColor="#f2f2f2" placeholder='할 일을 입력해주세요.' placeholderColor="#cecece"/>
            <Atoms.Button border="1px solid #e0e0e0" borderRadius="8px">asdasd</Atoms.Button>
        </Atoms.Div>
    )
}

export default TodoCreateInput;
```

더 깔끔하게 해당 디자인 패턴을 사용할 수 있는 방법을 이번 프로젝트를 통해 계속 연구해볼 계획이다.

Recoil도 빨리 공부해서 적용해보고 싶다. 재미있어보임

Github Source Link : [https://github.com/sdf5771/my-todo-app.git](https://github.com/sdf5771/my-todo-app.git)

---

### 스터디 참고 자료

카카오 FE 기술블로그 : [아토믹 디자인을 활용한 디자인 시스템 도입기 | 카카오엔터테인먼트 FE 기술블로그](https://fe-developers.kakaoent.com/2022/220505-how-page-part-use-atomic-design-system/)

유튜브 : [Atomic Design Pattern (아토믹 디자인 패턴)](https://www.youtube.com/watch?v=qUSYwidqgFg)