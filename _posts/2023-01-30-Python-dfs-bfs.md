---
layout: single
title:  "**[Python] - 그래프 탐색 알고리즘 : DFS/BFS **"
categories: Python
toc: true
toc_label: "Table of Contents"
toc_icon: "bookmark"
---

# 그래프 탐색 알고리즘 : DFS/BFS

- 탐색(Search)이란 많은 양의 데이터 중에서 **원하는 데이터를 찾는 과정**을 말한다.
- 대표적인 그래프 탐색 알고리즘으로는 DFS와 BFS가 있다.
- **DFS/BFS는 코딩 테스트에서 매우 자주 등장하는 유형**이다.

## 공부 전 알아야하는 자료구조

### 1. 스택 (Stack) 자료구조

- 먼저 들어 온 데이터가 나중에 나가는 형식(선입후출 LIFO)의 자료구조
- 입구와 출구가 동일한 형태로 스택을 시각화할 수 있다.

## 파이썬에서 스택을 구현할 때는 List를 사용한다.

- append() 메소드를 통한 삽입
- pop() 메소드를 통한 삭제를 구현할 수 있다.

```python
stack = []

# 삽입(5) - 삽입(2) - 삽입(3) - 삽입(7) - 삭제()
# 삽입(1) - 삽입(4) - 삭제()

stack.append(5)
stack.append(2)
stack.append(3)
stack.append(7)
stack.pop()

stack.append(1)
stack.append(4)
stack.pop()

print(stack[::-1]) # 최상단 원소부터 출력
print(stack) # 최하단 원소부터 출력

# 실행 결과
# [1, 3, 2, 5]
# [5, 2, 3, 1]
```

### 2. 큐 (Queue) 자료 구조

- 먼저 들어 온 데이터가 먼저 나가는 형식(선입선출 FIFO)의 자료구이다.
- 큐는 **입구와 출구가 모두 뚫려 있는 터널과 같은 형태**로 시각화 할 수 있다.

### 파이썬에서 큐(Queue)를 구현하기 위해서는 덱(deque) 라이브러리를 사용할 수 있다.

- 일반적으로 파이썬의 deque 라이브러리는 stack과 queue를 다 사용할 수 있다.
- 파이썬에서 큐(Queue)의 경우 적절한 자료형이 존재하지 않고, deque를 사용할 때, 시간적으로 우수하기 때문에 일반적으로 큐(Queue)를 구현할 때 deque를 사용한다.

```python
from collections import deque

# 큐(Queue) 구현을 위해 deque 라이브러리 사용
queue = deque()

# 삽입(5) - 삽입(2) - 삽입(3) - 삽입(7) - 삭제()
# 삽입(1) - 삽입(4) - 삭제()

queue.append(5)
queue.append(2)
queue.append(3)
queue.append(7)
queue.popleft()

queue.append(1)
queue.append(4)
queue.popleft()

print(queue) # 먼저 들어온 순서대로 출력
queue.reverse() # 역순으로 바꾸기
print(queue) # 낮중에 들어온 원소부터 출력

# 실행 결과
# deque([3, 7, 1, 4])
# deque([4, 1, 7, 3])
```

### 재귀 함수

- 재귀 함수(Recursive Function)란 자기 자신을 다시 호출하는 함수를 의미
- 내부적으로 컴퓨터 시스템이 함수를 연속적으로 호출하게 되었을 때, 가장 마지막으로 호출된 함수가 처리가 되어야 그 이전에 호출된 함수가 처리가 되기 때문에 Stack과 굉장히 유사한 구조이므로 Stack이 필요할 때, Stack 라이브러리를 사용하지 않고 재귀 함수를 통해 Stack을 구현할 때도 많이 사용한다.
- 단순한 형태의 재귀 함수 예제
  - ‘재귀 함수를 호출합니다.’ 라는 문자열을 무한히 출력한다.
  - 어느 정도 출력하다가 최대 재귀 깊이 초과 메시지가 출력된다.

```python
def recursive_function():
	print('재귀 함수를 호출합니다.')
	recursive_function()

recursive_function()
```

### 재귀 함수의 종료 조건

- 재귀 함수를 문제 풀이에서 사용할 때는 재귀 함수의 종료 조건을 반드시 명시해야 한다.
- 종료 조건을 제대로 명시하지 않으면 함수가 무한히 호출될 수 있다.

```python
# 종료 조건을 포함한 재귀 함수 예제

def recursive_function(i):
	# 100번째 호출을 했을 때, 종료되도록 종료 조건 명시
	if i == 100:
		return
	print(i, '번째 재귀함수에서', i + 1, '번째 재귀함수를 호출합니다.')
	recursive_function(i + 1)
	print(i, '번째 재귀함수를 종료합니다.')

recursive_function(1)
```

### 팩토리얼 구현 예제

- n! = 1 x 2 x 3 x … x (n - 1) x n
- 수학적으로 0!과 1!의 값은 1이다.

```python
# 반복적으로 구현한 n!
def factorial_iterative(n):
	result = 1
	# 1부터 n까지의 수를 차례대로 곱하기
	for i in range(1, n + 1):
		result *= i
	return result

# 재귀적으로 구현한 n!
def factorial_recursive(n):
	if n <= 1: # n이 1이하인 경우 1을 반환
		return 1
	# n! = n * (n - 1)!를 그대로 코드로 작성하기
	return n * factorial_recursive(n - 1)

# 각각의 방식으로 구현한 n! 출력 (n = 5)
print('반복적으로 구현:', factorial_iterative(5))
print('재귀적으로 구현:', factorial_recursive(5))

# 실행 결과
# 반복적으로 구현: 120
# 재귀적으로 구현: 120
```

## DFS(Depth-First Search)

- DFS는 **깊이 우선 탐색**이라고도 부르며 그래프에서 **깊은 부분을 우선적으로 탐색하는 알고리즘**이다.
- DFS는 **스택 자료구조(혹은 재귀 함수)를 이용**하며, 구체적인 동작 과정은 다음과 같다.
  1. 탐색 시작 노드를 스택에 삽입하고 방문 처리를 한다.
  2. 스택의 최상단 노드에 방문하지 않은 인접한 노드가 하나라도 있으면 그 노드를 스택에 넣고 방문 처리를 한다. 방문하지 않은 인접 노드가 없으면 스택에서 최상단 노드를 꺼낸다.
  3. 더 이상 2번의 과정을 수행할 수 없을 때까지 반복한다.

### DFS 소스코드 예제

```python
# DFS 메서드 정의
def dfs(graph, v, visited):
	# 현재 노드를 방문 처리
	visited[v] = True
	print(v, end = ' ')
	# 현재 노드와 연결된 다른 노드를 재귀적으로 방문
	for i in graph[v]:
		if not visited[i]:
			dfs(graph, i, visited)

# 각 노드가 연결된 정보를 표현 (2차원 리스트)
graph = [
	[],
	[2, 3, 8],
	[1, 7],
	[1, 4, 5],
	[3, 5],
	[3, 4],
	[7],
	[2, 6, 8],
	[1, 7],	
]

# 각 노드가 방문된 정보를 표현 (1차원 리스트)
visited = [False] * 9

# 정의된 DFS 함수 호출
dfs(graph, 1, visited)

# 실행 결과
# 1 2 7 6 8 3 4 5
```

### BFS (Breadth-First Search)

- BFS는 너비 우선 탐색이라고도 부르며, 그래프에서 가까운 노드부터 우선적으로 탐색하는 알고리즘이다.
- BFS는 큐 자료구조를 이용하며, 구체적인 동작 과정은 다음과 같다.
  1. 탐색 시작 노드를 큐에 삽입하고 방문 처리를 한다.
  2. 큐에서 노드를 꺼낸 뒤에 해당 노드의 인접 노드 중에서 방문하지 않은 노드를 모두 큐에 삽입하고 방문 처리를 한다.
  3. 더 이상 2번의 과정을 수행할 수 없을 때까지 반복한다.

```python
from collections import deque

# BFS 메서드 정의
def bfs(graph, start, visited):
	# 큐 (Queue) 구현을 위해 deque 라이브러리 사용
	queue = deque([start])
	# 현재 노드를 방문 처리
	visited[start] = True
	# 큐가 빌 때까지 반복
	while queue:
		# 큐에서 하나의 원소를 뽑아 출력하기
		v = queue.popleft()
		print(v, end=' ')
		# 아직 방문하지 않은 인접한 원소들을 큐에 삽입
		for i in graph[v]:
			if not visited[i]:
				queue.append(i)
				visited[i] = True

# 각 노드가 연결된 정보를 표현 (2차원 리스트)
graph = [
	[],
	[2, 3, 8],
	[1, 7],
	[1, 4, 5],
	[3, 5],
	[3, 4],
	[7],
	[2, 6, 8],
	[1, 7]
]

# 각 노드가 방문된 정보를 표현 (1차원 리스트)
visited = [False] * 9

# 정의된 BFS 함수 호출
bfs(graph, 1, visited)

# 실행 결과
# 1 2 3 8 7 4 5 6
```

---

## <DFS / BFS 코딩테스트 문제>

### 무인도 여행

- <문제 링크> 프로그래머스 : [https://school.programmers.co.kr/learn/courses/30/lessons/154540](https://school.programmers.co.kr/learn/courses/30/lessons/154540)

### **문제 설명**

메리는 여름을 맞아 무인도로 여행을 가기 위해 지도를 보고 있습니다. 지도에는 바다와 무인도들에 대한 정보가 표시돼 있습니다. 지도는 1 x 1크기의 사각형들로 이루어진 직사각형 격자 형태이며, 격자의 각 칸에는 'X' 또는 1에서 9 사이의 자연수가 적혀있습니다. 지도의 'X'는 바다를 나타내며, 숫자는 무인도를 나타냅니다. 이때, 상, 하, 좌, 우로 연결되는 땅들은 하나의 무인도를 이룹니다. 지도의 각 칸에 적힌 숫자는 식량을 나타내는데, 상, 하, 좌, 우로 연결되는 칸에 적힌 숫자를 모두 합한 값은 해당 무인도에서 최대 며칠동안 머물 수 있는지를 나타냅니다. 어떤 섬으로 놀러 갈지 못 정한 메리는 우선 각 섬에서 최대 며칠씩 머물 수 있는지 알아본 후 놀러갈 섬을 결정하려 합니다.

지도를 나타내는 문자열 배열 `maps`가 매개변수로 주어질 때, 각 섬에서 최대 며칠씩 머무를 수 있는지 배열에 오름차순으로 담아 return 하는 solution 함수를 완성해주세요. 만약 지낼 수 있는 무인도가 없다면 -1을 배열에 담아 return 해주세요.

### 제한사항

- 3 ≤ `maps`의 길이 ≤ 100
  - 3 ≤ `maps[i]`의 길이 ≤ 100
  - `maps[i]`는 'X' 또는 1 과 9 사이의 자연수로 이루어진 문자열입니다.
  - 지도는 직사각형 형태입니다.

### 입출력 예

| maps | result |
| --- | --- |
| ["X591X","X1X5X","X231X", "1XXX1"] | [1, 1, 27] |
| ["XXX","XXX","XXX"] | [-1] |

### 입출력 예 설명

입출력 예 #1

위 문자열은 다음과 같은 지도를 나타냅니다.

![https://user-images.githubusercontent.com/62426665/206862823-4633fbf1-c075-4d35-b577-26f504dcd332.png](https://user-images.githubusercontent.com/62426665/206862823-4633fbf1-c075-4d35-b577-26f504dcd332.png)

연결된 땅들의 값을 합치면 다음과 같으며

![https://user-images.githubusercontent.com/62426665/209070615-ae568f20-cf06-4f88-8d4f-8e9861af2d36.png](https://user-images.githubusercontent.com/62426665/209070615-ae568f20-cf06-4f88-8d4f-8e9861af2d36.png)

이를 오름차순으로 정렬하면 [1, 1, 27]이 됩니다.

입출력 예 #2

위 문자열은 다음과 같은 지도를 나타냅니다.

![https://user-images.githubusercontent.com/62426665/206863265-0a371c69-d4b5-411a-972f-bdc36b90c917.png](https://user-images.githubusercontent.com/62426665/206863265-0a371c69-d4b5-411a-972f-bdc36b90c917.png)

섬이 존재하지 않기 때문에 -1을 배열에 담아 반환합니다.

### 풀이 코드

```python
from collections import deque

dx, dy = [1, -1, 0, 0], [0, 0, -1, 1]

def solution(maps):
    answer = []
    a, b = len(maps), len(maps[0])
    visit = [[False] * b for _ in range(a)]
    
    def bfs(x, y):
        queue = deque();
        queue.append((x, y))
        bfs_result = int(maps[x][y])
        
        while queue:
            current_x, current_y = queue.popleft()
            
            for l in range(4):
                next_x = dx[l] + current_x
                next_y = dy[l] + current_y
                
                if next_x < 0 or next_x >= a or next_y < 0 or next_y >= b:
                    continue
                    
                if not visit[next_x][next_y] and maps[next_x][next_y] != 'X':
                    queue.append((next_x, next_y)) 
                    visit[next_x][next_y] = True
                    bfs_result += int(maps[next_x][next_y])
            
        return bfs_result
    
    for i in range(a):
        for j in range(b):
            if maps[i][j] != 'X' and not visit[i][j]:
                visit[i][j] = True
                answer.append(bfs(i,j))
    
    return sorted(answer) if answer else [-1]
```

### 음료수 얼려 먹기

- <문제 링크>  이것이 취업을 위한 코딩 테스트다 with 파이썬 (동영상 59:39) : [https://www.youtube.com/watch?v=PqzyFDUnbrY&list=PLRx0vPvlEmdBFBFOoK649FlEMouHISo8N&index=3](https://www.youtube.com/watch?v=PqzyFDUnbrY&list=PLRx0vPvlEmdBFBFOoK649FlEMouHISo8N&index=3)

### **문제 설명**

N x M 크기의 얼음 틀이 있습니다. 구멍이 뚫려 있는 부분은 0, 칸막이가 존재하는 부분은 1로 표시됩니다. 구멍이 뚫려 있는 부분끼리 상, 하, 좌, 우로 붙어 있는 경우 서로 연결되어 있는 것으로 간주합니다. 이때 얼음 틀의 모양이 주어졌을 때 생성되는 총 아이스크림의 개수를 구하는 프로그램을 작성하세요. 다음의 4 x 5 얼음 틀 예시에서는 아이스크림이 총 3개 생성됩니다.

### 입출력 예

> 입력 예 #1
4 5
00110
00011
11111
00000
출력 예 #1
3
>

```python
def validationResult(result):
    if result == 3:
        return True
    else:
        return False

dx, dy = [0, 0, 1, -1],[-1, 1, 0, 0]

def solution(maps):
    answer = 0
    a, b = len(maps), len(maps[0])
    visit = [[False] * b for _ in range(a)]

    def dfs(x, y):
        if x <= -1 or x >= a or y <= -1 or y >= b:
            return False

        if maps[x][y] == '0' and not visit[x][y]:
            visit[x][y] = True
            dfs(x, y-1)
            dfs(x-1, y)
            dfs(x, y+1)
            dfs(x+1, y)
            return True

        return False

    for i in range(a):
        for j in range(b):
            if dfs(i,j):
                answer += 1
    print('answer',answer)

    return answer

graph = ['00110','00011','11111','00000']

result = solution(graph)
print('result',result)
validity_result = validationResult(result)

if validity_result:
    print('정답')
else:
    print('오답')
```