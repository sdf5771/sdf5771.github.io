---
layout: single
title:  "“****1929 : (재귀함수) 우박수 (3n+1) (reverse)****”"
categories: Python
toc: true
toc_label: "Table of Contents"
toc_icon: "bookmark"
---

# “****1929 : (재귀함수) 우박수 (3n+1) (reverse)****”

문제 링크 :

[(재귀함수) 우박수 (3n+1) (reverse)](https://codeup.kr/problem.php?id=1929)

## 문제 설명

콜라츠의 추측, 3n + 1 문제, 우박수 문제라고 불리는 이 문제는 다음과 같다.

1. 어떤 자연수 n이 입력되면,
2. n이 홀수이면 3n + 1을 하고,
3. n이 짝수이면 n/2 를 한다.
4. 이 n이 1이 될때까지 2 3 과정을 반복한다.

예를 들어 5는 5 → 16 → 8 → 4 → 2 → 1 이 된다.

그런데 이번에는 이 순서의 역순을 출력하고자 한다.

즉, 1 2 4 8 16 5 가 출력되어야 한다.

이 처럼 어떤 자연수 n이 입력되면 위 알고리즘에 의해 1이 되는 과정을 모두 출력하시오.

금지 키워드 : for while goto

## 입력

자연수 n이 입력된다. (1 ≤ n ≤ 100,000,000)

## 출력

3n + 1의 과정을 출력한다.

## 입력 예시

5

## 출력 예시

1

2

4

8

16

5

```python
import sys
sys.setrecursionlimit(10 ** 6)

def solution(a):
    answer = ''

    def collatz(num):
        if num == 1:
            return print(1)

        if num % 2 == 0:
            collatz(num//2)
        else:
            collatz((3 * num) + 1)
        return print(num)

    collatz(a);

    return answer

A = int(input())

test_val = solution(A)
```