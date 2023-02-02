---
layout: single
title:  "**[Python] - 구현: 시뮬레이션과 완전 탐색**"
categories: Python
toc: true
toc_label: "Table of Contents"
toc_icon: "bookmark"
---

# 구현(Implementation)

- 구현이란, 머릿속에 있는 알고리즘을 소스코드로 바꾸는 과정이다.

![implementation01](/assets/images/posts/2023-02-02-Python-implementation-bruteforce/implementation01.png)

- 알고리즘 대회나 코딩 테스트에서의 **구현 유형**의 문제란?
  - **풀이를 떠올리는 것은 쉽지만 소스코드로 옮기기 어려운 문제를 지칭한다.**
- 구현 유형의 예시
  - 알고리즘은 간단한데 코드가 지나칠 만큼 길어지는 문제
  - 실수 연산을 다루고, 특정 소수점 자리까지 출력해야 하는 문제
  - 문자열을 특정한 기준에 따라서 끊어 처리해야 하는 문제
  - 적절한 라이브러리를 찾아서 사용해야 하는 문제

- 일반적으로 알고리즘 문제에서의 2차원 공간은 **행렬(Matrix)**의 의미로 사용된다.
  - 행렬(Matrix) : 2차원 데이터를 일종의 표와 같은 형태로 쉽게 나타낼 수 있는 것 (2차원 배열)

|  | 열 (Column) |  |  |  |  |
| --- | --- | --- | --- | --- | --- |
| 행 (Row) | (0, 0) | (0, 1) | (0, 2) | (0, 3) | (0, 4) |
|  | (1, 0) | (1, 1) | (1, 2) | (1, 3) | (1, 4) |
|  | (2, 0) | (2, 1) | (2, 2) | (2, 3) | (2, 4) |
|  | (3, 0) | (3, 1) | (3, 2) | (3, 3) | (3, 4) |
|  | (4, 0) | (4, 1) | (4, 2) | (4, 3) | (4, 4) |

```python
for i in range(5):
	for j in range(5):
		print('(', i, ',', j ')', end=' ')
	print()
```

- 시뮬레이션 및 완전 탐색 문제에서는 2차원 공간에서의 **방향 벡터**가 자주 활용된다.

|  | 열 (Column) |  |  |  |  |
| --- | --- | --- | --- | --- | --- |
| 행 (Row) | (0, 0) | (0, 1) | (0, 2) | (0, 3) | (0, 4) |
|  | (1, 0) | (1, 1) | (1, 2) | (1, 3) | (1, 4) |
|  | (2, 0) | (2, 1) | (2, 2) | (2, 3) | (2, 4) |
|  | (3, 0) | (3, 1) | (3, 2) | (3, 3) | (3, 4) |
|  | (4, 0) | (4, 1) | (4, 2) | (4, 3) | (4, 4) |

```python
# 동, 북, 서, 남
dx = [0, -1, 0, 1]
dy = [1, 0, -1, 0]

# 현재 위치
x, y = 2, 2

for i in range(4):
	# 다음 위치
	nx = x + dx[i]
	ny = y + dy[i]
	print(nx, ny)
```

---

## 문제 1: 상하좌우

- 여행가 A는 N x N 크기의 정사각형 공간 위에 있습니다. 이 공간은 1 x 1 크기의 정사각형으로 나누어져 있습니다. 가장 왼쪽 위 좌표는 (1, 1) 이며, 가장 오른쪽 아래 좌표는 (N, N)에 해당합니다. 여행가 A는 상, 하, 좌, 우 방향으로 이동할 수 있으며, 시작 좌표는 항상 (1, 1)입니다. 우리 앞에는 여행가 A가 이동할 계획이 적힌 계획서가 놓여 있습니다.
- 계획서에는 하나의 줄에 띄어쓰기를 기준으로 하여 L, R, U, D 중 하나의 문자가 반복적으로 적혀 있습니다. 각 문자의 의미는 다음과 같습니다.
  - L: 왼쪽으로 한 칸 이동
  - R: 오른쪽으로 한 칸 이동
  - U: 위로 한 칸 이동
  - D: 아래로 한 칸 이동
- 이때 여행가 A가 N x N 크기의 정사각형 공간을 벗어나는 움직임은 무시됩니다. 예를 들어 (1, 1)의 위치에서 L혹은 U를 만나면 무시됩니다. 다음은 N = 인 지도와 계획서입니다.

![implementation02](/assets/images/posts/2023-02-02-Python-implementation-bruteforce/implementation02.png)

### 입력조건

- 첫째 줄에 공간의 크기를 나타내는 N이 주어집니다. (1 ≤ N ≤ 100)
- 둘째 줄에 여행가 A가 이동할 계획서 내용이 주어집니다. (1 ≤ 이동 횟수 ≤ 100)

### 출력조건

- 첫째 줄에 여행가 A가 최종적으로 도착할 지점의 좌표 (X, Y)를 공백을 기준으로 구분하여 출력합니다.

### 입력예시

> 5
>
> R R R U D D
>

### 출력 예시

> 3 4
>

```python
import time

def test(answer, test_data):
    print('제출한 답:', test_data)
    if test_data == answer:
        print("정답입니다")
    else:
        print("오답입니다")

def solution(n, move):
    answer = ''
    move_arr = move.split()

    # 현재 위치
    x, y = 1, 1

    for i in move_arr:
        if i == 'L':
            if x > 1:
                x = x + -1
        elif i == "R":
            if x < n:
                x = x + 1
        elif i == "U":
            if y > 1:
                y = y + -1
        elif i == 'D':
            if y < n:
                y = y + 1
    answer = str(y) + ' ' + str(x)
    return answer

tc_data = [{'tc_input1': 5, 'tc_input2':'R R R U D D', 'tc_answer': '3 4'}, {'tc_input1': 5, 'tc_input2':'R U D L R R', 'tc_answer': '2 3'}, {'tc_input1': 5, 'tc_input2':'L R D D D R R', 'tc_answer': '4 4'}]

for for_index in range(len(tc_data)):
    print('ㅡㅡㅡㅡ', for_index,'번째 test', 'ㅡㅡㅡㅡ')
    a, b = tc_data[for_index]['tc_input1'], tc_data[for_index]['tc_input2']
    print('a의 값은', a)
    print('b의 값은', b)
    print('정답은', tc_data[for_index]['tc_answer'])
    start = time.time()
    test(tc_data[for_index]['tc_answer'], solution(a, b))
    end = time.time()
    print('소요시간:',f"{end - start:.5f} sec")
```

![implementation03](/assets/images/posts/2023-02-02-Python-implementation-bruteforce/implementation03.png)

---

## 문제 2: 시각 문제

- 정수 N이 입력되면 00시 00분 00초부터 N시 59분 59초까지의 **모든 시각 중에서 3이 하나라도 포함되는 모든 경우의 수를 구하는 프로그램을 작성**하세요. 예를 들어 1을 입력했을 때 다음은 3이 하나라도 포함되어 있으므로 세어야 하는 시각입니다.
  - 00시 00분 03초
  - 00시 13분 30초
- 반면에 다음은 3이 하나도 포함되어 있지 않으므로 세면 안 되는 시각입니다.
  - 00시 02분 55초
  - 01시 27분 45초

### 입력조건

- 첫째 줄에 정수 N이 입력됩니다. (0 ≤ N ≤ 23)

### 출력조건

- 00시 00분 00초부터 N시 59분 59초까지의 모든 시각 중에서 3이 하나라도 포함되는 모든 경우의 수를 출력합니다.

### 입력예시

> 5
>

### 출력 예시

> 11475
>

```python
import time

def test(answer, test_data):
    print('제출한 답:', test_data)
    if test_data == answer:
        print("정답입니다")
    else:
        print("오답입니다")

def solution(n):
    answer = 0

    for hour in range(n + 1):
        for minute in range(60):
            for second in range(60):
                if '3' in str(hour) + str(minute) + str(second):
                    answer += 1

    return answer

tc_data = [{'tc_input1': 5, 'tc_answer': 11475}]

for for_index in range(len(tc_data)):
    print('ㅡㅡㅡㅡ', for_index,'번째 test', 'ㅡㅡㅡㅡ')
    a= tc_data[for_index]['tc_input1']
    print('a의 값은', a)
    print('정답은', tc_data[for_index]['tc_answer'])
    start = time.time()
    test(tc_data[for_index]['tc_answer'], solution(a))
    end = time.time()
    print('소요시간:',f"{end - start:.5f} sec")
```

![implementation04](/assets/images/posts/2023-02-02-Python-implementation-bruteforce/implementation04.png)

---

## 문제 3: 왕실의 나이트

- 행복 왕국의 왕실 정원은 체스판과 같은 8 x 8 좌표 평면입니다. 왕실 정원의 특정한 한 칸에 나이트가 서 있습니다. 나이트는 매우 충성스러운 신하로서 매일 무술을 연마합니다.
- 나이트는 말을 타고 있기 때문에 이동을 할 때는 L자 형태로만 이동할 수 있으며 정원 밖으로는 나갈 수 없습니다.
- 나이트는 특정 위치에서 다음과 같은 2가지 경우로 이동할 수 있습니다.
  1. 수평으로 두 칸 이동한 뒤에 수직으로 한 칸 이동하기
  2. 수직으로 두 칸 이동한 뒤에 수평으로 한 칸 이동하기
- 이처럼 8 x 8 좌표 평면상에서 나이트의 위치가 주어졌을 때 나이트가 이동할 수 있는 경우의 수를 출력하는 프로그램을 작성하세요. 왕실의 정원에서 행 위치를 표현할 때는 1부터 8로 표현하며, 열 위치를 표현할때는 a부터 h로 표현합니다.
  - c2에 있을 때 이동할 수 있는 경우의 수는 6가지 입니다.
  - a1에 있을 때 이동할 수 있는 경우의 수는 2가지 입니다.

![implementation05](/assets/images/posts/2023-02-02-Python-implementation-bruteforce/implementation05.png)

### 입력조건

- 첫째 줄에 8 x 8 좌표 평면상에서 현재 나이트가 위치한 곳의 좌표를 나타내는 두 문자로 구성된 문자열이 입력된다. 입력 문자는 a1처럼 열과 행으로 이뤄진다.

### 출력조건

- 첫째 줄에 나이트가 이동할 수 있는 경우의 수를 출력하시오.

### 입력예시

> a1
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

dx = [-2, 2, -2, 2, -1, -1, 1, 1]
dy = [-1, -1, 1, 1, -2, 2, -2, 2]

def solution(n):
    answer = 0
    def parse_column(row_val):
        if row_val == 'a':
            return 1
        elif row_val == 'b':
            return 2
        elif row_val == 'c':
            return 3
        elif row_val == 'd':
            return 4
        elif row_val == 'e':
            return 5
        elif row_val == 'f':
            return 6
        elif row_val == 'g':
            return 7
        elif row_val == 'h':
            return 8
    
    x = int(parse_column(n[0]))
    y = int(n[1])

    for i in range(8):
        nx = dx[i] + x
        ny = dy[i] + y

        if nx > 0 and ny > 0:
            answer += 1

    return answer

tc_data = [{'tc_input1': 'a1', 'tc_answer': 2}, {'tc_input1': 'c2', 'tc_answer': 6}]

for for_index in range(len(tc_data)):
    print('ㅡㅡㅡㅡ', for_index,'번째 test', 'ㅡㅡㅡㅡ')
    a= tc_data[for_index]['tc_input1']
    print('a의 값은', a)
    print('정답은', tc_data[for_index]['tc_answer'])
    start = time.time()
    test(tc_data[for_index]['tc_answer'], solution(a))
    end = time.time()
    print('소요시간:',f"{end - start:.5f} sec")
```

![implementation06](/assets/images/posts/2023-02-02-Python-implementation-bruteforce/implementation06.png)

---

## 문제 4: 문자열 재정렬

- 알파벳 대문자와 숫자(0 ~ 9)로만 구성된 문자열이 입력으로 주어집니다. 이때 모든 알파벳을 오름차순으로 정렬하여 이어서 출력한 뒤에, 그 뒤에 모든 숫자를 더한 값을 이어서 출력합니다.
- 예를 들어 K1KA5CB7이라는 값이 들어오면 ABCKK13을 출력합니다.

### 입력조건

- 첫째 줄에 하나의 문자열 S가 주어집니다. (1 ≤ S의 길이 ≤ 10,000)

### 출력조건

- 첫째 줄에 문제에서 요구하는 정답을 출력합니다.

### 입력예시 1

> K1KA5CB7
>

### 출력 예시 1

> ABCKK13
>

### 입력예시 2

> AJKDLSI412K4JSJ9D
>

### 출력 예시 2

> ADDIJJJKKLSS20
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
    answer = ''

    arr_str = [s[i] for i in range(len(s))]

    arr_str.sort()

    sum_number = 0

    for j in range(len(arr_str)):
        if not arr_str[j].isalpha():
            sum_number += int(arr_str[j])
        else:
            answer += arr_str[j]

    answer += str(sum_number)

    return answer

tc_data = [{'tc_input1': 'K1KA5CB7', 'tc_answer': 'ABCKK13'}, {'tc_input1': 'AJKDLSI412K4JSJ9D', 'tc_answer': 'ADDIJJJKKLSS20'}]

for for_index in range(len(tc_data)):
    print('ㅡㅡㅡㅡ', for_index,'번째 test', 'ㅡㅡㅡㅡ')
    a= tc_data[for_index]['tc_input1']
    print('a의 값은', a)
    print('정답은', tc_data[for_index]['tc_answer'])
    start = time.time()
    test(tc_data[for_index]['tc_answer'], solution(a))
    end = time.time()
    print('소요시간:',f"{end - start:.5f} sec")
```

![implementation07](/assets/images/posts/2023-02-02-Python-implementation-bruteforce/implementation07.png)

---

### 참고자료

[(이코테 2021 강의 몰아보기) 2. 그리디 & 구현](https://youtu.be/2zjoKjt97vQ)