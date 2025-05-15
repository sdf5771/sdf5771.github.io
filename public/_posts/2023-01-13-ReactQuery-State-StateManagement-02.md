---
layout: post
title: "React Query + 상태 + 상태 관리 [2편]"
date: "2023-01-13"
author: Seobisback
tags: [React, ReactNative, State, StateManagement]
categories: Study
---
React Query + 상태 + 상태 관리 [2편]

> 이 글은 유튜브 영상 중 **‘React Query와 상태관리’** 라는 주제로 **2022.02 우아한테크세미나**의
> 영상을 보며 공부를 하고 정리한 내용을 바탕으로 기술되었습니다. 저의 주관이 섞인 내용이 들어갈 수도 있고,
> 영상에서 다루는 내용을 정리하여 기록한 내용이 주로 다루어집니다.

## React Query

<aside>
🌱 DataBase에서 가져온 데이터를 클라이언트에서 보여주기 위해 개발자는 ajax를 이용하는데, 이 때 서버에서 가져오는 데이터를 `Server State` 라고 한다.

</aside>

- React Query는 서버에서 가져온 데이터를 웹 브라우저 앱에서 사용하기 쉽게 도와주는 기술이다.
  - 데이터 가져오기 (fetching)
  - 캐시 (caching)
  - 동기화 (synchronizing)
  - 데이터 업데이트 (updating server state)

### React Query 공식 예제 Code

```tsx
import {QueryClient, QueryClientProvider, useQuery} from 'react-query';

const queryClient = new QueryClient()

export default function App(){
	return(
		<QueryClientProvider client={queryClient}>
			<Example />
		</QueryClientProvider>
	)
}

function Example(){
	const { isLoading, error, data } = useQuery('repoData', () =>
		fetch('https://api.github.com/repos/tannerlinsley/react-query').then(res =>
			res.json()
		)
	)

	if (isLoading) return 'Loading...'

	if (error) return 'An error has occureed: ' + error.message

	return (
		<div>
			<h1>{data.name}</h1>
			<p>{data.description}</p>
       <strong>👀 {data.subscribers_count}</strong>{' '}
       <strong>✨ {data.stargazers_count}</strong>{' '}
       <strong>🍴 {data.forks_count}</strong>
		</div>
	)
}

```

### React Query와 상태관리

**세 가지 core 컨셉 살펴보기**

공식 문서 Quick Start에서 짚은 3가지의 개념

1. Queries
2. Mutations
3. Query Invalidation

### Queries

보통 GET으로 받아올 대부분의 API를 사용

- Queries는 데이터 Fetching용이다.
- CRUD중 Reading에 사용한다.

```tsx
import { useQuery } from 'react-query'

function App() {
	const info = useQuery('todos', fetchTodoList)
}

/*
* useQuery() arguments
* first arg - Query Key
* second arg - Query Function
* third arg - Query Option
*/
```

### Query Key

key, value 맵핑 구조를 생각하면 된다.

- React Query는 Query Key에 따라 query caching을 관리한다.

**String 형태**

```tsx
// A list of todos
useQuery('todos', ...) // queryKey === ('todos')

// Something else, whatever
useQuery('somethingSpecial', ...) // queryKey === ('somethingSpecial')
```

**Array 형태 - 실질적으로 pagination이나 각종 옵션을 줄때**

```tsx
// An individual todo
useQuery(['todos', 5], ...)
// queryKey === ['todos', 5]

// An individual todo in a "preview" format
useQuery(['todos', 5, { preview: true}], ...)
//queryKey === ['todos', 5, { preview: true}]

// A list of todos that are "done"
useQuery(['todos', { type: 'done' }], ...)
//queryKey === ['todos', { type: 'done' }]
```

### Query Function

Data Fetching, Promise

- Promise를 반환하는 함수 → 데이터를 resolve하거나 error를 throw
- fetch, axios 등 데이터를 fetching하는 함수가 들어간다.

### useQuery가 반환하는 return 값

- data: 마지막으로 성공한 resolved된 데이터 (Response)
- error: 에러가 발생했을 때 반환되는 객체
- isFetching: Request가 in-flight(진행중) 중일 때 true
- status, isLoading, isSuccess, isLoadingError 등등: 모두 현재 query의 상태
- refetch: 해당 query refetch하는 함수 제공
- remove: 해당 query cache에서 지우는 함수 제공

등 을 제공한다.

### useQuery Option

- onSuccess, onError, onSettled: query fetching 성공/실패/완료 시 실행할 Side Effect 정의
- enabled: 자동으로 query를 실행시킬지 말지 여부
- retry: query 동작 실패 시, 자동으로 retry 할지 결정하는 옵션
- select: 성공 시 가져온 data를 가공해서 전달
- keepPreviousData: 새롭게 fetching 시 이전 데이터 유지 여부
- refetchInterval: 주기적으로 refetch 할지 결정하는 옵션 (폴링 구현할 일이 있을 때)

등
