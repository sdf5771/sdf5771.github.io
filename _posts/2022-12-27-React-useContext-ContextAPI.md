---
layout: single
title:  "**ReactHook_useContext + Context API**"
categories: React
toc: true
toc_label: "Table of Contents"
toc_icon: "bookmark"
---

# useContext + Context API

**Context API : Context 는 APP 안에서 전역적으로 사용되는 data를 여러 Component 끼리 공유할 수 있는 방법을 제공한다.**

Context를 사용하면 상위 Component가 일일이 하위 Component에게 전달하지 않아도 된다.

props를 통해 하위 Component에 계속해서 전달하는 일련의 과정을 Prop Drilling 이라고도 한다.

**useContext : useContext는 Context로 공유한 data를 쉽게 받아올 수 있게 도와주는 역할을 한다.**

![React_useContext1.png](/assets/images/posts/2022-12-27-React-useContext-ContextAPI/React_useContext1.png)

<<그림 1. Context와 useContext>>

**Context 는 필요할 때만 사용해야함**

Context의 주된 목적은 다양한 Level에 있는 많은 Component들에게 전역적인 데이터를 전하기 위함이다.

- Context를 사용하면 Component를 재사용하기 어려워 질 수 있다.
- (React 공식문서 내용중)Prop drilling을 피하기위한 목적이라면 Component Composition(컴포넌트 합성)이 더 간단한 해결책일 수도 있다고 제안하고 있다.

## Example 1

path : context/ThemeContext.js

```jsx
import { createContext } from "react";

export const ThemeContext = createContext(null);
```

path : App.js

```jsx
import { useState } from 'react';
import './App.css';
import Page from './components/Page';
import { ThemeContext } from './context/ThemeContext';

function App(){
	const [isDark, setIsDark] = useState(false);

	return (
		<ThemeContext.Provider value={{isDark, setIsDark}}>
			<Page isDark={isDark} setIsDark={setIsDark} />
		</ThemeContext.Provider>
	);
}

export default App;
```

path: component/Page.js

```jsx
import React, {useContext} from 'react';
import Content from './Content';
import Footer from './Footer';
import Header from './Header';

function Page(){
	return (
		<div>
			<Header />
			<Content />
			<Footer />
		</div>
	);
}

export default Page;
```

path: component/Header.js