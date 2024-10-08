---
layout: post
title: "[Python] - 동적 프로그래밍 : 피보나치 수"
author: Seobisback
tags: [Python, CodingTest]
categories: Syntax
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

![pibonacci_result](/assets/images/posts/2023-01-30-Python-pibonacci/pibonacci_result.png)

---

## 코드 업 : ****1916 : (재귀함수) 피보나치 수열 (Large)****

[https://codeup.kr/problem.php?id=1916](https://codeup.kr/problem.php?id=1916)

피보나치 수열이란 앞의 두 수를 더하여 나오는 수열이다.

첫 번째 수와 두 번째 수는 모두 11이고, 세 번째 수부터는 이전의 두 수를 더하여 나타낸다. 피보나치 수열을 나열해 보면 다음과 같다.

> 1,1,2,3,5,8,13…
>

자연수 N을 입력받아 N번째 피보나치 수를 출력하는 프로그램을 작성하시오.

단, N이 커질 수 있으므로 출력값에 10,009를 나눈 나머지를 출력한다.

**※ 이 문제는 반드시 재귀함수를 이용하여 작성 해야한다.**

**입력**

자연수 N이 입력된다. (N�은 200200보다 같거나 작다.)

**출력**

N번째 피보나치 수를 출력하되, 10,00910,009를 나눈 나머지 값을 출력한다.

**입력 예시**  

7

**출력 예시**

13

```python
import sys
sys.setrecursionlimit(10**7)

dict = {} # 메모이제이션을 위한 딕셔너리

def pibonacchi(num):
    if num in dict:
        return dict[num]
        
    if num == 1 or num == 2:
        dict[num] = 1
        return dict[num]
    else:
        dict[num] = pibonacchi(num-1) + pibonacchi(num-2)
        return dict[num] % 10009

def solution(a):
    answer = pibonacchi(a)
    print(answer)
    return answer

A = int(input())

solution(A)
```

![pibonacci_result2](/assets/images/posts/2023-01-30-Python-pibonacci/pibonacci_result2.png)

시간 초과가 나는 것은 DP를 이용한 메모이제이션 기법을 사용하지 않았기 때문이다.

---

참고 자료 : 유튜브

[꾸준한 번식 피보나치 수열, 동적 프로그래밍 [코딩 테스트 Python]](https://youtu.be/WPXkfmvdHUs)
