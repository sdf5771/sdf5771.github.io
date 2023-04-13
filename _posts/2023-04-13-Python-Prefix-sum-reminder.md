---
layout: single
title:  "**[Python]백준 : 10986 나머지 합**"
categories: Python
toc: true
toc_label: "Table of Contents"
toc_icon: "bookmark"
---

# 백준 : 10986 나머지 합

## 문제

수 N개 A1, A2, ..., AN이 주어진다. 이때, 연속된 부분 구간의 합이 M으로 나누어 떨어지는 구간의 개수를 구하는 프로그램을 작성하시오.

즉, Ai + ... + Aj (i ≤ j) 의 합이 M으로 나누어 떨어지는 (i, j) 쌍의 개수를 구해야 한다.

## 입력

첫째 줄에 N과 M이 주어진다. (1 ≤ N ≤ 106, 2 ≤ M ≤ 103)

둘째 줄에 N개의 수 A1, A2, ..., AN이 주어진다. (0 ≤ Ai ≤ 109)

## 출력

첫째 줄에 연속된 부분 구간의 합이 M으로 나누어 떨어지는 구간의 개수를 출력한다.

## 예제 입력 1

```
5 3
1 2 3 1 2

```

## 예제 출력 1

```
7

```

## 출처

- 문제를 만든 사람: [baekjoon](https://www.acmicpc.net/user/baekjoon)
- 데이터를 추가한 사람: [cs71107](https://www.acmicpc.net/user/cs71107)

## 알고리즘 분류

- [수학](https://www.acmicpc.net/problem/tag/124)
- [누적 합](https://www.acmicpc.net/problem/tag/139)

---

## 풀이

```python
import sys
# input값의 크기가 크므로 input 함수에 sys.stdin.readline을 override
input = sys.stdin.readline

if __name__ == '__main__':
    result_count = 0 # 정답 Count
    n, m = map(int, input().split()) # 수열의 개수, 나누어 떨어져야 하는 수
    a = [i for i in map(int, input().split())] # 원본 배열
    s = [0 for _ in range(n)] # 합 배열
    c = [0] * m # 같은 나머지의 인덱스를 카운트하는 리스트

    # 합 배열(s)의 0번 index 값을 원본 배열(a) 0번으로 초기화
    s[0] = a[0]

    # 합 배열(s)의 1번 index부터 구간 합을 계산하여 저장
    for i in range(1, n):
        s[i] = a[i] + s[i-1]

    # 합 배열(s)에 m으로 나눈 나머지 값을 저장하고, 만약 해당 나머지가 0이면 result_count에 플러스 해준다.
    # 같은 나머지의 인덱스를 카운트하는 리스트(c)에 해당 나머지 값과 동일한 index 내에 count를 증가해줌
    for i in range(n):
        s[i] = s[i] % m
        if s[i] == 0 :
            result_count += 1
        c[s[i]] += 1

    # 나누어 떨어져야 하는 수(m) 까지 반복하면서, 만약 c[i] 가 1보다 클 경우
    # c[i] * (c[i]-1) 를 계산한 후 2로 나눈 값을 result_count에 더한다. (combination 공식)
    for i in range(m):
        if c[i] > 1:
            result_count += (c[i] * (c[i]-1) // 2)

    # 정답 출력
    print(result_count)
```

## 도식화

![prefix-sum-reminder01](/assets/images/posts/2023-04-13-Python-Prefix-sum-reminder/prefix-sum-reminder01.jpg)

## 결과

![prefix-sum-reminder02](/assets/images/posts/2023-04-13-Python-Prefix-sum-reminder/prefix-sum-reminder02.png)