---
layout: single
title:  "**[Python]백준 : 11660 구간 합 구하기 5**"
categories: Python
toc: true
toc_label: "Table of Contents"
toc_icon: "bookmark"
---

# 백준 : 11660 구간 합 구하기 5

## 문제

N×N개의 수가 N×N 크기의 표에 채워져 있다. (x1, y1)부터 (x2, y2)까지 합을 구하는 프로그램을 작성하시오. (x, y)는 x행 y열을 의미한다.

예를 들어, N = 4이고, 표가 아래와 같이 채워져 있는 경우를 살펴보자.

| 1 | 2 | 3 | 4 |
| --- | --- | --- | --- |
| 2 | 3 | 4 | 5 |
| 3 | 4 | 5 | 6 |
| 4 | 5 | 6 | 7 |

여기서 (2, 2)부터 (3, 4)까지 합을 구하면 3+4+5+4+5+6 = 27이고, (4, 4)부터 (4, 4)까지 합을 구하면 7이다.

표에 채워져 있는 수와 합을 구하는 연산이 주어졌을 때, 이를 처리하는 프로그램을 작성하시오.

## 입력

첫째 줄에 표의 크기 N과 합을 구해야 하는 횟수 M이 주어진다. (1 ≤ N ≤ 1024, 1 ≤ M ≤ 100,000) 둘째 줄부터 N개의 줄에는 표에 채워져 있는 수가 1행부터 차례대로 주어진다. 다음 M개의 줄에는 네 개의 정수 x1, y1, x2, y2 가 주어지며, (x1, y1)부터 (x2, y2)의 합을 구해 출력해야 한다. 표에 채워져 있는 수는 1,000보다 작거나 같은 자연수이다. (x1 ≤ x2, y1 ≤ y2)

## 출력

총 M줄에 걸쳐 (x1, y1)부터 (x2, y2)까지 합을 구해 출력한다.

## 예제 입력 1

```
4 3
1 2 3 4
2 3 4 5
3 4 5 6
4 5 6 7
2 2 3 4
3 4 3 4
1 1 4 4

```

## 예제 출력 1

```
27
6
64

```

## 예제 입력 2

```
2 4
1 2
3 4
1 1 1 1
1 2 1 2
2 1 2 1
2 2 2 2

```

## 예제 출력 2

```
1
2
3
4

```

## 출처

[11660번: 구간 합 구하기 5](https://www.acmicpc.net/problem/11660)

## 알고리즘 분류

- [다이나믹 프로그래밍](https://www.acmicpc.net/problem/tag/25)
- [누적 합](https://www.acmicpc.net/problem/tag/139)

---

## 풀이

```python
import sys

if __name__ == "__main__":
    n, m = map(int, sys.stdin.readline().split())

		# 원본 배열 A 초기화
    A = [[0] * (n + 1)] 
		# 원본 테이블에서 구간합을 구하여 저장할 배열 D 초기화 
    D = [[0 for _ in range(n + 1)] for _ in range(n + 1)]

		#원본 배열 A 데이터를 입력받아 append
    for i in range(n):
        A_row = [0] + [int(x) for x in sys.stdin.readline().split()]
        A.append(A_row)

		# (1,1)부터 사용하므로 반복을 1부터 n+1까지 진행
		# 구간합을 계산하여 배열 D에 저장
    for i in range(1, n + 1):
        for j in range(1, n + 1):
            D[i][j] = D[i-1][j] + D[i][j-1] - D[i-1][j-1] + A[i][j]

		# x1, y1, x2, y2 를 m 만큼 반복하여 입력받고,
		# 입력 받은 후 계산하여 출력
    for _ in range(m):
        x1, y1, x2, y2 = map(int, sys.stdin.readline().split())
        this_result = D[x2][y2] - D[x1-1][y2] - D[x2][y1-1] + D[x1-1][y1-1]
        print(this_result) # 결과 값 출력
```

## 풀이 과정 (도식화)

![prefixsum01](/assets/images/posts/2023-04-13-Python-Prefix-sum-5/prefixsum01.jpg)

## 결과

![prefixsum02](/assets/images/posts/2023-04-13-Python-Prefix-sum-5/prefixsum02.png)