---
layout: single
title:  "**React Navigation**"
categories: React Native
toc: true
toc_label: "Table of Contents"
toc_icon: "bookmark"
---

이 포스팅은 회사에서 React Native를 사용한 프로젝트를 진행하며, 
React Navigation에 관해 조사한 내용을 정리한 글이다. 

## React Navigation

![ReactNavigation1](/assets/images/posts/2022-12-26-React-Navigation/ReactNavigation1.png)

- 모바일 애플리케이션은 보통 여러 화면으로 구성되어 있다. 이러한 애플리케이션을 만들려면 내비게이션 관련 서드 파티 라이브러리를 사용해야 함.
- 대표적인 내비게이션에 괸련하여 사용할 수 있는 라이브러리
  - react-navigation
    - 리엑트 네이티브 커뮤니티에서 관리, 리엑트 공식 메뉴얼에서도 이 라이브러리로 화면을 전환하는 방법을 소개할 정도로 사용률이 가장 높은 라이브러리.
    - Navigation 기능이 자바스크립트로 구현되어 있음.
  - react-native-navigation
    - 홈페이지 제작 서비스 Wix에서 관리
    - 이 라이브러리는 이미 만들어진 네이티브 앱에 리엑트 네이티브를 적용하는 경우 사용하기에 더 적합하며, 내비게이션 기능이 자바스크립트가 아닌 각 플랫폼의 네이티브 코드로 구현되어 있기 때문에 react-navigation보다 더욱 네이티브스러운 사용 경험을 제공한다.

## Use

- 리엑트 네이티브 프로젝트에 라이브러리를 적용하기 위해서는 @react-navigation/native에서 NavigationContainer 컴포넌트를 불러와 앱 전체를 감싸주어야 한다.

```jsx
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../component/navigation/HomeScreen';
import DetailScreen from '../component/navigation/DetailScreen';

const Navigation = () => {
	const Stack = createNativeStackNavigator();

	return (
		<NavigationContainer>
			<Stack.Navigator initialRouteName="Home">
				<Stack.Screen name="Home" component={HomeScreen} />
				<Stack.Screen name="Detail" component={DetailScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}
```

```jsx
const Stack = createNativeStackNavigator();
```

- **createNativeStackNavigator** 함수를 사용해 네이티브 스택 네비게이터를 Stack이라는 객체에 할당한다.
- 이 안에는 **Stack.Navigator** 라는 컴포넌트와 **Stack.Screen** 컴포넌트가 들어있다.

```jsx
<NavigationContainer>
  <Stack.Navigator initialRouteName="Home">
    ...
  </Stack.Navigator>
</NavigationContainer>
```

- **Stack.Navigator**는 **NavigationContainer** 사이에 넣어야 정상적으로 동작하고, **initialRouteName** 이라는 속성은 기본적으로 보여줄 화면의 이름을 설정한다. **initialRouteName**을 설정하지 않으면 첫 번째 **Stack.Screen**이 보여진다.

```jsx
<Stack.Screen name="Home" component={HomeScreen} />
<Stack.Screen name="Detail" component={DetailScreen} />
```

- Stack.Screen을 사용해 각 화면을 설정하는데 name 속성은 화면의 이름을 설정한 것이고, 이 값은 다른 화면으로 이동하거나 현재 화면이 어떤 화면인지 조회할 때 사용한다. name속성은 대문자로 표기하는 것을 권장한다.

## HomeScreen Component

```jsx
import React from 'react';
import { View, Button } from 'react-native';

function HomeScreen({navigator}){
	return (
		<View>
			<Button 
				title="Detail 열기"
				onPress={ () => navigation.navigate('Detail')}
				// onPress={ () => navigation.push('Detail')}
			/>
		</View>
	);
}
```

- 스크린으로 사용된 컴포넌트는 navigation이라는 객체를 받아올 수 있는데, 이 객체에 navigate 함수 또는 push 함수를 사용해 화면을 이동한다.

## DetailScreen Component

```jsx
import React from 'react';
import {View, Text} from 'react-native';

function DetailScreen(){
	return (
		<View>
			<Text>Detail</Text>
		</View>
	);
}
```

## React Navigation 프로젝트 스크린 구조 참고 velog

[[React native] VIVA | navigator구조, Screen 구성](https://velog.io/@inryu/React-native-VIVA-navigator%EA%B5%AC%EC%A1%B0-Screen-%EA%B5%AC%EC%84%B1)

출처 : [https://velog.io/@inryu/React-native-VIVA-navigator구조-Screen-구성](https://velog.io/@inryu/React-native-VIVA-navigator%EA%B5%AC%EC%A1%B0-Screen-%EA%B5%AC%EC%84%B1)

React Navigation 종속성 에러 관련