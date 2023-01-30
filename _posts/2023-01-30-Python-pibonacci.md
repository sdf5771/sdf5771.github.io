---
layout: single
title:  "**[Python] - 동적 프로그래밍 : 피보나치 수**"
categories: Python
toc: true
toc_label: "Table of Contents"
toc_icon: "bookmark"
---

# 피보나치 수열 문제

프로그래머스 문제 (링크) - [https://school.programmers.co.kr/learn/courses/30/lessons/12945](https://school.programmers.co.kr/learn/courses/30/lessons/12945)

### <문제>

### 피보나치 수

언어 - **Python3**

### **문제 설명**

피보나치 수는 F(0) = 0, F(1) = 1일 때, 1 이상의 n에 대하여 F(n) = F(n-1) + F(n-2) 가 적용되는 수 입니다.

예를들어

- F(2) = F(0) + F(1) = 0 + 1 = 1
- F(3) = F(1) + F(2) = 1 + 1 = 2
- F(4) = F(2) + F(3) = 1 + 2 = 3
- F(5) = F(3) + F(4) = 2 + 3 = 5

와 같이 이어집니다.

2 이상의 n이 입력되었을 때, n번째 피보나치 수를 1234567으로 나눈 나머지를 리턴하는 함수, solution을 완성해 주세요.

### 제한 사항

- n은 2 이상 100,000 이하인 자연수입니다.

### 입출력 예

| n | return |
| --- | --- |
| 3 | 2 |
| 5 | 5 |

### 입출력 예 설명

피보나치수는 0번째부터 0, 1, 1, 2, 3, 5, ... 와 같이 이어집니다.

### <풀이 코드>

```python
import sys
sys.setrecursionlimit(10 ** 6)
answer = [0, 1, 1]
def solution(n):
    if n <= 0:
        return 0
    if n < len(answer):
        return answer[n]
    answer.append(solution(n-1) + solution(n-2))
    return int(answer[n] % 1234567)
```

> 유튜브에서 피보나치 수열 관련 알고리즘을 좀 찾아봤는데, 보통 재귀적으로 구현하게 되면 1초 정도의 시간제한이 있을 경우 타임 아웃이 일어나는 것을 확인했다. 그래서 보통 이런 유형의 문제는 동적 프로그래밍(Dynamic Programming)을 통해 풀어야 시간 초과가 나지 않음을 확인하였고, 동적 프로그래밍의 경우 경험 정보를 이용하여 문제를 해결하기 때문에 빠른 연산이 가능하다.
>

참고 자료 : 유튜브

[꾸준한 번식 피보나치 수열, 동적 프로그래밍 [코딩 테스트 Python]](https://youtu.be/WPXkfmvdHUs)

<Test Case 결과>

![pibonacci_result](/assets/images/posts/2023-01-30-Python-pinonacci/pibonacci_result.png)