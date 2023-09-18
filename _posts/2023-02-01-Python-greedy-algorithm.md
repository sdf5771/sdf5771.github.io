---
layout: post
title: "[Python] - 그리디 알고리즘"
author: Seobisback
tags: [Python, CodingTest]
categories: Syntax
---

# 그리디 알고리즘

- 그리디 알고리즘(탐욕법)은 **현재 상황에서 지금 당장 좋은 것만 고르는 방법**을 의미한다.
- 일반적인 그리디 알고리즘은 문제를 풀기 위한 최소한의 아이디어를 떠올릴 수 있는 능력을 요구한다.
- 그리디 해법은 그 정당성 분석이 중요하다.
  - 단순히 가장 좋아 보이는 것을 반복적으로 선택해도 최적의 해를 구할 수 있는지 검토한다.
- 일반적인 상황에서 그리디 알고리즘은 최적의 해를 보장할 수 없을 때가 많다.
- 하지만 코딩 테스트에서의 대부분의 그리디 문제는 **탐욕법으로 얻은 해가 최적의 해가 되는 상황에서, 이를 추론**할 수 있어야 풀리도록 출제된다고 한다.

---

## 문제 1: 1이 될 때까지

- 어떠한 수 N이 1이 될 때까지 다음의 두 과정 중 하나를 반복적으로 선택하여 수행하려고 한다.
  단, 두 번째 연산은 N이 K로 나누어 떨어질 때만 선택할 수 있다.
  1. N에서 1을 뺍니다.
  2. N을 K로 나눕니다.
- 예를 들어 N이 17, K가 4라고 가정합시다. 이때 1번의 과정을 한 번 수행하면 N은 16이 됩니다. 이후에 2번의 과정을 두 번 수행하면 N은 1이 됩니다. 결과적으로 이 경우 전체 과정을 실행한 횟수는 3이 됩니다. 이는 N을 1로 만드는 최소 횟수입니다.
- N과 K가 주어질 때 N이 1이 될 때까지 1번 혹은 2번의 과정을 수행해야 하는 최소 횟수를 구하는 프로그램을 작성하세요.

### 입력조건

- 첫째 줄에 N(1 ≤ N ≤ 100,000)과 K(2 ≤ K ≤ 100,000)가 공백을 기준으로 하여 각각 자연수로 주어집니다.

### 출력조건

- 첫째 줄에 N이 1이 될 때까지 1번 혹은 2번의 과정을 수행해야 하는 횟수의 최솟값을 출력합니다.

### 입력예시

> 25 5
>

### 출력 예시

> 2
>

```python
import time

def test(answer, test_data):
    print('제출한 답:', test_data)
    if test_data == answer:
        print("정답입니다")
    else:
        print("오답입니다")

def solution(n, k):
    answer = 0
    while True:
        if n % k == 0:
            n = int(n / k)
        else:
            n = n - 1

        answer += 1

        if n == 1:
            break
    return answer

tc_data = [{'tc_input': '17 4', 'tc_answer': 3}, {'tc_input': '25 5', 'tc_answer': 2}, {'tc_input': '25 3', 'tc_answer': 6}]

for i in range(len(tc_data)):
    print('ㅡㅡㅡㅡ', i,'번째 test', 'ㅡㅡㅡㅡ')
    a, b = map(int, tc_data[i]['tc_input'].split())
    print('a의 값은', a)
    print('b의 값은', b)
    print('정답은', tc_data[i]['tc_answer'])
    start = time.time()
    test(tc_data[i]['tc_answer'], solution(a, b))
    end = time.time()

    print('소요시간:',f"{end - start:.5f} sec")
```

![greedy_01](/assets/images/posts/2023-02-01-Python-greedy-algorithm/greedy_01.png)

---

## 문제 2: 곱하기 혹은 더하기

- 각 자리가 숫자(0부터 9)로만 이루어진 문자열 S가 주어졌을 때, 왼쪽부터 오른쪽으로 하나씩 모든 문자를 확인하며 숫자 사이에 ‘x’ 혹은 ‘+’ 연산자를 넣어 결과적으로 만들어질 수 있는 가장 큰 수를 구하는 프로그램을 작성하세요. 단, +보다 x를 먼저 계산하는 일반적인 방식과는 달리, 모든 연산은 왼쪽에서부터 순서대로 이루어진다고 가정합니다.
- 예를 들어 02984라는 문자열로 만들 수 있는 가장 큰 수는 ((((0 + 2) x 9) x 8) x 4) = 576입니다. 또한 만들어질 수 있는 가장 큰 수는 항상 20억 이하의 정수가 되도록 입력이 주어집니다.

### 입력조건

- 첫째 줄에 여러 개의 숫자로 구성된 하나의 문자열 S가 주어집니다. (1 ≤ S의 길이 ≤ 20)

### 출력조건

- 첫째 줄에 만들어질 수 있는 가장 큰 수를 출력합니다.

### 입력예시 1

> 02984
>

### 출력 예시 1

> 576
>

### 입력예시 2

> 567
>

### 출력 예시 2

> 210
>

```python
import time

def test(answer, test_data):
    print('제출한 답:', test_data)
    if test_data == answer:
        print("정답입니다")
    else:
        print("오답입니다")

def solution(s):
    answer = 0

    for i in range(len(s)):
        this_number = int(s[i])
        if answer * this_number == 0:
            answer += this_number
            continue
        else:
            answer *= this_number

    return answer

tc_data = [{'tc_input': '02984', 'tc_answer': 576}, {'tc_input': '567', 'tc_answer': 210}, {'tc_input': '99999', 'tc_answer': 59049}]

for for_index in range(len(tc_data)):
    print('ㅡㅡㅡㅡ', for_index,'번째 test', 'ㅡㅡㅡㅡ')
    a = tc_data[for_index]['tc_input']
    print('a의 값은', a)
    print('정답은', tc_data[for_index]['tc_answer'])
    start = time.time()
    test(tc_data[for_index]['tc_answer'], solution(a))
    end = time.time()

    print('소요시간:',f"{end - start:.5f} sec")
```

![greedy_02](/assets/images/posts/2023-02-01-Python-greedy-algorithm/greedy_02.png)

---

## 문제 3: 모험가 길드

- 한 마을에 모험가가 N명 있습니다. 모험가 길드에서는 N명의 모험가를 대상으로 ‘공포도’를 측정했는데, ‘공포도’가 높은 모험가는 쉽게 공포를 느껴 위험 상황에서 제대로 대처할 능력이 떨어집니다.
- 모험가 길드장인 동빈이는 모험가 그룹을 안전하게 구성하고자 공포도가 X인 모험가는 반드시 X명 이상으로 구성한 모험가 그룹에 참여해야 여행을 떠날 수 있도록 규정했습니다.
- 최대 몇 개의 모험가 그룹을 만들 수 있는지 궁금합니다. N명의 모험가에 대한 정보가 주어졌을 때, 여행을 떠날 수 있는 그룹 수의 최댓값을 구하는 프로그램을 작성하세요.
- 예를 들어 N = 5 이고, 각 모험가의 공포도가 다음과 같다고 가정합시다.

> 2 3 1 2 2
>
- 이 경우 그룹 1에 공포도가 1, 2, 3인 모험가를 한 명씩 넣고, 그룹 2에 공포도가 2인 남은 두 명을 넣게되면 총 2개의 그룹을 만들 수 있습니다.
- 또한 몇 명의 모험가는 마을에 그대로 남아 있어도 되기 때문에, 모든 모험가를 특정한 그룹에 넣을 필요는 없습니다.

### 입력조건

- 첫째 줄에 모험가의 수 N이 주어집니다. (1 ≤ N ≤ 100,000)
- 둘쨰 줄에 각 모험가의 공포도의 값을 N 이하의 자연수로 주어지며, 각 자연수는 공백으로 구분합니다.

### 출력조건

- 여행을 떠날 수 있는 그룹 수의 최댓값을 출력합니다.

### 입력예시 1

> 5
> 
> 2 3 1 2 2

### 출력 예시 1

> 2
>

```python
import time

def test(answer, test_data):
    print('제출한 답:', test_data)
    if test_data == answer:
        print("정답입니다")
    else:
        print("오답입니다")

def solution(n, gongpodo):
    answer = 0
    count_people = 0
    sort_numbers = sorted(gongpodo.split())

    for i in range(n):
        count_people += 1
        if int(sort_numbers[i]) <= count_people:
            count_people = 0
            answer += 1
    return answer

tc_data = [{'tc_input1': '5', 'tc_input2':'2 3 1 2 2', 'tc_answer': 2}, {'tc_input1': '10', 'tc_input2':'2 3 1 2 2 2 2 1 1 2', 'tc_answer': 6}]

for for_index in range(len(tc_data)):
    print('ㅡㅡㅡㅡ', for_index,'번째 test', 'ㅡㅡㅡㅡ')
    a, b = tc_data[for_index]['tc_input1'], tc_data[for_index]['tc_input2']
    print('a의 값은', a)
    print('b의 값은', b)
    print('정답은', tc_data[for_index]['tc_answer'])
    start = time.time()
    test(tc_data[for_index]['tc_answer'], solution(int(a), b))
    end = time.time()
    print('소요시간:',f"{end - start:.5f} sec")
```

![greedy_03](/assets/images/posts/2023-02-01-Python-greedy-algorithm/greedy_03.png)

---

### 참고자료

[(이코테 2021 강의 몰아보기) 2. 그리디 & 구현](https://youtu.be/2zjoKjt97vQ)