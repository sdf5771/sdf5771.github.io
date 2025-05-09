---
layout: post
title: "코드 업 : 1920 : (재귀함수) 2진수 변환"
author: Seobisback
tags: [Python, CodingTest]
categories: Syntax
---

문제 링크 :

[(재귀함수) 2진수 변환](https://codeup.kr/problem.php?id=1920)

## 문제 설명

어떤 10진수 �이 주어지면 2진수로 변환해서 출력하시오.

예)

10    ----->  1010

0    ----->  0

1    ----->  1

2    ----->  10

1024    ----->  10000000000

**이 문제는 반복문을 이용하여 풀 수 없습니다.**

금지 키워드 : for while goto

## 입력

10진수 정수 n이 입력된다.

(0 ≤ n ≤ 2, 100,000,000)

## 출력

2진수로 변환해서 출력한다.

## 입력 예시

7

## 출력 예시

111

```python
import sys
sys.setrecursionlimit(10 ** 6)

def solution(a):
    answer = ''

    def parseBinary(num, answer):
        if num == 1 or num == 0:
            answer += str(num)
            return answer[::-1] # answer 문자열을 뒤집은 새로운 문자열을 반환하는 것

        answer += str(num % 2)
        return parseBinary(num // 2, answer)

    answer = parseBinary(a, answer)

    return answer
    
input_val = int(input())
test_val = solution(input_val)

print(test_val)
```