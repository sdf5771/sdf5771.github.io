---
layout: single
title:  "**상태 관리 라이브러리 Redux VS MobX**"
categories: React
---

회사에서 **React**로 프로젝트를 진행하게 되어, 상태관리 라이브러리에 관해서 조사를 하게 되었다.
개인적으로 토이 프로젝트를 진행하며 **Redux**를 사용하여 state를 관리하였고,
React 생태계에서 Redux 사용량이 현재도 압도적이기 때문에 Redux를 사용하는게 가장 안전하지 않을까 라고 생각하였지만 회사 선배가 MobX도 현재 많은 기업에서 사용중이고, 조사를 해보니 MobX가 Redux와는 또 다른 매력이 있기 때문에 좀 더 조사를 진행해보았고, 나와 같은 고민을 하는 분이 계실거라 생각하여 그 고민에 도움을 드리면 좋겠다라고 생각이 들어 정리해둔 글을 포스팅 해봅니다.

# **Redux VS Mobx**

상태관리 라이브러리

- Redux

![reactredux1](/assets/images/posts/2022-12-26-React-Redux/reactredux1.png)

일단 기억해야 하는 존재는 **컴포넌트**, 더해주라는 **Action**, **Reducer**, 그리고 **Store** 정도다. 위 그림의 흐름을 정리해보자.

- **컴포넌트**에서 전역 **Store**에 관리되고 있는 상태 `num` 에 1을 더하고자 한다.
- **컴포넌트**에서 상태에 직접 접근할 수 없고, **Store에서 제공하는 방법**을 사용해야 한다. 여기서 **Reducer**를 이용한다. Reducer는 어떤 Action을 원하는지 확인하고 그에 따라 상태를 업데이트해주는 함수다.
- 이 **Reducer**에 **Action**으로 { type: ‘ADD’ } 를 보내주면 `num` 에 1을 더해주는걸로 미리 약속을 해둔 상태다.
- **컴포넌트**는 **Reducer**에 **Action** { type: ‘ADD’ }를 발송(dispatch)한다.
- **Reducer**는 이 요청을 받고 내부에 있는 상태, `num` 에다가 1을 더해준다. 즉, **상태를 업데이트**한다.
- 상태가 업데이트된 후 이를 참조하고 있는 컴포넌트들에게 `num` 이 업데이트되었으니 **리랜더링을 해야 한다고 알린다**.

**이 구조가 저기 위에서 얘기했던 데이터의 흐름을 한 방향으로, 한 지점을 지나도록 하는 전역 상태 관리 라이브러리의 구조**라고 생각할 수 있다.

일단 데이터 변경부터 리랜더링까지 한 방향으로 진행이 되고 있다. 또한, 상태에 직접 접근해 변경하는 것은 불가능하므로, 반드시 Store의 Reducer를 거쳐야 한다. 공통적으로 한 지점을 지나가도록 만들어졌고, 업데이트 로직도 분리되어있음을 알 수 있다.

- Mobx - 글로벌 상태 관리 툴
  - 장점
    - OOP(객체지향적)코드를 작성할 수 있다.

Redux와 Mobx의 차이점

- Redux는 상태를 변경하기 위해 reducer, action 등 코드를 작성해주어야 하고, 프로젝트의 규모가 커짐에 따라 이러한 코드들이 꼬이고 복잡해져 점점 스파게티 코드가 되어간다.
- Redux는 함수형 프로그래밍에 영향을 받은 라이브러리이다. MobX는 OOP권장하는 라이브러리이다. OOP에 익숙한 개발자들이 쉽게 접근하고 사용할 수 있다.
- Redux는 Store의 상태를 Immutable(불변)하게 변경하기 때문에 항상 새로운 상태를 반환해주어야함 (Read Only), MobX는 Mutable(변경)하게 변경이 가능함
- Redux는 구조상 Store와 Component의 연결을 위해 번잡한 코드들을 계속 작성하여야 한다.(reducer, store) MobX는 이러한 코드를 데코레이터를 사용하여 깔끔하게 작성할 수 있다.

- React MobX tutorial 및 이해

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/tjHljJRooHU/0.jpg)](https://www.youtube.com/watch?v=tjHljJRooHU)

- FileName : MovieStore.js

```jsx
import {action, makeObservable, observable} from 'mobx';
/*
action(Function-함수) : action 안에서 observable 값을 변경할 때 사용함
makeObservable(Function-함수) : makeObservable 안에서 변수를 observable로 변경해 줄 수 있다.
observable(Variable-변수) : observable이 된 변수가 변경이되면, 
자동으로 이 observable을 보고 있는 Component들이 observable을 따라서 반응 후 Refresh 된다.
*/

class Movie {
	id;
	title;
	rate;

	constructor(id, title, rate){
		this.id = id;
		this.title = title;
		this.rate = rate;
	}
}

export class MovieStore{ // Movie의 repository 역할
	rootStore;
	/*
		해당 스토어외에 다른 스토어가 있을 경우 rootStore로 관리해주면 편하기 때문에
		미리 선언해둠
	*/

	movies = []; // makeObservable 함수 안에서 observable로 변경된 'movies' 변수는 변경되면
	//MovieStore를 listening 중인 모든 component가 변경이 된다.
	// 만약 Typescript를 사용중이며 decorature 지원을 활성화 하였으면 makeObservable을 사용하는 것이 아닌
	//
	// @observable
	// movies = [];
	// 형태로 간소화하여 사용할 수 있다.

	constructor(root){
		makeObservable(this, {
			//해당 class(MovieStore)를 listening 중인 모든 component가 변경되게 할 수 있다.
			movies: observable, // movies가 observable 변수로 변경이된다.
	})		

		this.rootStore = root;

		this.movies = [
			new Movie(1, "LOTR", 5),
			new Movie(2, "Harry Potter", 4),
			new Movie(3, "창궐", 0)
		]
	}
}
```

- FileName : RootStore.js

```jsx
import {MovieStore} from "./MovieStore";

// RootStore에서 가지고 있는 모든 Store들을 Access 가능하게 한다.
// 만약 Store를 하나 더 만들려면 class 내부에 넣고, constructor 안에 선언하여 주면 된다.
export class RootStore{
	movieStore;

	constructor(){
		this.movieStore = new MovieSotre(this);

	}
}
```

- FileName : Context.js

**1. MobX 의 주요 개념들에 대해서 살펴보자.**

1) Observable State

- 관찰 받고 있는 상태라는 뜻인데, 개발을 하다보면 상태는 항상 변할 수 있기 때문에 이 상태가 바뀐다면 MobX에서는 이를 캐치해낼 수 있습니다. 원시값들(string, number, boolean등등), 객체, 배열안에 객체 던 어떤 값들이 바뀌던지 MobX는 상태의 변화를 캐치할 수 있습니다.

2) Computed Value

- 연산된 값이라는 뜻인데, 주로 성능 최적화를 위해서 많이 사용하긴 합니다. 연산에 기반 되는 값(상태값)이 변화할때만 새로 연산하고 바뀌지 않는다면 그냥 기존 값을 사용할 수 있도록 해줍니다.

3) Reactions

- 값이 바뀔때에 따라 해야 할 일을 정의하는 것 , 예를들어 1)의 Observable State가 바뀌었을때 이 리액션을 통해 어떤 로직을 실행시키는 것이죠.

4) Actions

- 상태에 변화를 일으키는 것, 1)의 Observable State를 변화 시키는 코드를 호출하면 액션