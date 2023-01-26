---
layout: single
title:  "**[Python] - 기본 입출력**"
categories: Python
toc: true
toc_label: "Table of Contents"
toc_icon: "bookmark"
---

### 기본 입출력

- 모든 프로그램은 적절한 (약속된) 입출력 양식을 가지고 있다.
- 프로그램 동작의 첫 번째 단계는 데이터를 입력 받거나 생성하는 것이다.
- 예시 ) 학생의 성적 데이터가 주어지고, 이를 내림차순으로 정렬한 결과를 출력하는 프로그램

![input_output](/assets/images/posts/2023-01-10-Python-default-input-output/input_output.png)

### 자주 사용되는 표준 입력 방법

- input() 함수는 한 줄의 문자열을 입력 받는 함수이다.
- map() 함수는 리스트의 모든 원소에 각각 특정한 함수를 적용할 때 사용한다.
- 예시) 공백을 기준으로 구분된 데이터를 입력 받을 때는 다음과 같이 사용한다.

    ```python
    list(map(int, input().split()))
    ```

- 예시) 공백을 기준으로 구분된 데이터의 개수가 많지 않다면, 단순히 다음과 같이 사용한다.

    ```python
    a, b, c = map(int, input().split())
    ```


### 입력을 위한 전형적인 소스코드 1)

```python
# 데이터의 개수 입력
n = int(input())
# 각 데이터를 공백을 기준으로 구분하여 입력
data = list(map(int, input().split()))

data.sort(reverse = True)
print(data)

# 실행 결과 )
# 5 - input
# 65 90 75 34 99 - input
# [99, 90, 75, 65, 34] - output

```

### 입력을 위한 전형적인 소스코드 2)

```python
# n, m, k를 공백을 기준으로 구분하여 입력
n, m, k = map(int, input().split())

print(n, m, k)

# 실행 결과 )
# 3 5 7 - input
# 3 5 7 - output
```

### 빠르게 입력 받기

- 사용자로부터 입력을 최대한 빠르게 받아야 하는 경우가 있다.
- 파이썬의 경우 sys 라이브러리에 정의되어 있는 sys.stdin.readline() 메서드를 이용한다.
  - 단, 입력 후 엔터(Enter)가 줄 바꿈 기호로 입력되므로 rstrip() 메서드를 함께 사용한다. ← Enter 기호 제거

```python
import sys

# 문자열 입력 받기
data = sys.stdin.readline().rstrip()
print(data)
```

### 자주 사용되는 표준 출력 방법

- 파이썬에서 기본 출력은 print() 함수를 사용한다.
  - 각 변수를 콤마(,)를 이용하여 띄어쓰기로 구분하여 출력할 수 있다.
- print()는 기본적으로 출력 이후에 줄 바꿈을 수행한다.
  - 줄 바꿈을 원치 않는 경우 ‘end’ 속성을 이용할 수 있다.

```python
# 출력할 변수들
a = 1
b = 2
print(a, b)

print(7, end=" ")
print(8, end=" ")

# 출력할 변수
answer = 7
print("정답은 " + str(answer) + "입니다.")

# 실행 결과
# 1 2
# 7 8 정답은 7입니다.
```

### f-string

- 파이썬 3.6부터 사용 가능하며, 문자열 앞에 접두사 ‘f’를 붙여 사용한다.
- 중괄호 안에 변수명을 기입하여 간단히 문자열과 정수를 함께 넣을 수 있다.
- f-string을 이용하면 정수형을 굳이 문자형으로 바꾸지 않고도 간단하게 코드 작성이 가능하다.

```python
answer = 7
print(f"정답은 {answer}입니다.")

# 실행 결과 : 정답은 7입니다.
```