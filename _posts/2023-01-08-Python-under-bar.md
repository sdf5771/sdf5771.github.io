---
layout: single
title:  "**[Python] - 언더바는 언제 사용하는가?**"
categories: Python
toc: true
toc_label: "Table of Contents"
toc_icon: "bookmark"
---

### Python에서 언더바 ( _ ) 는 어제 사용하는가?

- 파이썬에서는 반복을 수행하되 반복을 위한 변수의 값을 무시하고자 할 때 **언더바(_)**를 자주 사용한다.
- 코드 1: 1부터 9까지의 자연수를 더하기
  - 1부터 9까지의 자연수를 매번 i라는 변수에 담기게 만들어야 하기 때문에 i 가 순회할 수 있도록 만들어주고, 그때마다 i의 값을 summary에 담아 출력하기 위해서 i를 for 문에서 사용

```python
# 1부터 9까지의 자연수를 더하기
summary = 0
for i in range(1, 10):
	summary += i
print(summary)
```

- 코드 2: “Hello World” 를 5번 출력하기
  - 내부적으로 어떠한 변수 값이 사용되지 않고, 단순하게 어떠한 작업을 반복하고자 한다면 **언더바(_)** 처리를 해서 **코드 1처럼 i와 같은 변수가 내부에서 사용되지 않는다**는 점을 코드상으로 알려줄 수 있다.

```python
# "Hello World"를 5번 출력하기
for _ in range(5):
	print("Hello World")
```