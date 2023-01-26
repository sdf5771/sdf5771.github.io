---
layout: single
title:  "**Javascript Types**"
categories: JavaScript
toc: true
toc_label: "Table of Contents"
toc_icon: "bookmark"
---

### 원시 (Primitive) 타입

- String
- Number
- Boolean
- Null
- Undefined
- Biglnt
- Symbol

### 객체 (Object) 타입 - 원시 타입을 제외한 모든 것

- Object
- Array

![javascript1](/assets/images/posts/2022-12-27-Javascript-type/javascript1.png)

—> 원시 타입 : 어떠한 변수에 원시 타입의 값을 할당하면 그 값은 변수에 바로 할당된다.

—> 객체 타입 : 어떠한 변수에 객체 타입의 값을 할당하면 크기가 크기 때문에 바로 변수에 할당되는 것이 아닌 메모리 상에 공간이 할당되어서 그 메모리 안에 보관된다. 그 후 그 변수에는 객체가 담긴 주소 값이 할당된다.

![javascript2](/assets/images/posts/2022-12-27-Javascript-type/javascript2.png)

—> 원시 타입 : 같은 원시 값을 갖고 있는 변수를 비교 연산자로 비교할 경우 true로 동일하게 판단한다. (변수 안에 있는 값이 동일하기 때문)

—> 객체 타입 : 같은 값을 갖고 있는 두 객체를 비교 연산자로 비교할 경우 false를 반환한다. ( 변수는 객체의 주소 값을 갖고 있고 두 객체는 다른 주소 값에 저장되어 있어 주소 값이 동일하지 않기 때문)