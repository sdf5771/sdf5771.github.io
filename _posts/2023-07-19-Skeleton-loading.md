---
layout: single
title:  "**React에서 Skeleton Loading 만들기**"
categories: React, Typescript
toc: true
toc_label: "Table of Contents"
toc_icon: "bookmark"
---

![ezgif.com-video-to-gif (1).gif](/assets/images/posts/2023-07-19-Skeleton-loading/skeleton-loading.gif)

진행중인 팀 프로젝트에 여러 컨텐츠가 나오게 되면서 

UX적인 부분을 개선하기 위해 디자이너님과 로딩에 대해서 고민을 하다가 스켈레톤 로딩을 만들게 되었다.

# Skeleton Loading 이란 ?

화면의 뼈대와 같은 느낌을 주는 로딩 UI를 사용해서 데이터를 불러오는 중일 때 사용하는 UI/UX 기법이다.

데이터 로딩 중 데이터가 불러와진 상태를 미리 알 수 있어서 유저에게 있어서는 예측이 가능하다는 장점과

불러온 이후 레이아웃이 동일하여 레이아웃이 망가지지 않는 장점이 있다.

조사를 진행하며 라이브러리를 사용하시는 분들도 많고 따로 구현하시는 분들도 많아 

본인도 따로 구현하는 방법으로 진행하였다.

### SkeletonLoading.tsx

```tsx
import React from 'react';
import styles from "./SkeletonLoading.module.css";

function SkeletonLoading({type}: {type: string}){
    let classes

    switch (type) {
        case 'title':
            classes = styles.title;
            break;
        case 'text':
            classes = styles.text;
            break;
        case 'avatar':
            classes = styles.avatar;
            break;
        case 'thumbnail':
            classes = styles.thumbnail;
            break;
    }

    return (
        <div className={`${styles.skeleton} ${classes}`}></div>
    )
}

export default SkeletonLoading;
```

### SkeletonLoading.module.css

```css
.skeleton {
    background: #ddd;
    border-radius: 4px;
}
.skeleton.text {
    width : 100%;
    height : 16px;
}

.skeleton.title {
    width: 50%;
    height: 20px;
}

.skeleton.avatar{
    width: 100px;
    height: 100px;
    border-radius: 50%;
}

.skeleton.thumbnail {
    width: 100px;
    height : 100px;
}
```

SkeletonLoading 의 뼈대가 되는 컴포넌트를 만들어서 string 타입으로 type을 받아서 여러 스타일을 사용할 수 있게 만들어주고

SkeletonLoading 컴포넌트를 활용해서 로딩 UI가 필요한 컴포넌트 레이아웃과 비슷하게 배치하여 새로운 컴포넌트를 만들어준다.

![folder01](/assets/images/posts/2023-07-19-Skeleton-loading/folder_image01.png)

### skeleton-componenet/index.ts

```tsx
import SkeletonWorkbook from "./SkeletonWorkbook";
import SkeletonTopViewWorkbook from './SkeletonTopViewWorkbook';

export default {
    SkeletonWorkbook,
    SkeletonTopViewWorkbook,
}
```

### SkeletonWorkbook.tsx

```tsx
import React from 'react';
import styles from './SkeletonWorkbook.module.css';
import SkeletonLoading from '../skeleton-root/SkeletonLoading';

function SkeletonWorkbook(){
    return(
        <div className={styles.skeleton_workbook_root}>
            <div className={styles.title_container}>
                <SkeletonLoading type="title" />
            </div>
            <div className={styles.body_container}>
                <SkeletonLoading type="text" />
                <SkeletonLoading type="text" />
                <SkeletonLoading type="text" />
            </div>
        </div>
    )
}

export default SkeletonWorkbook;
```

### SkeletonTopViewWorkbook.tsx

```tsx
import React from 'react';
import styles from './SkeletonTopViewWorkbook.module.css'
import SkeletonLoading from '../skeleton-root/SkeletonLoading';

function SkeletonTopViewWorkbook(){
    return(
        <div className={styles.skeleton_topview_root}>
            <div>
                <SkeletonLoading type="title" />
            </div>
            <div className={styles.body_container}>
                <div className={styles.content_container}>
                    <SkeletonLoading type="text" />
                    <SkeletonLoading type="text" />
                    <SkeletonLoading type="text" />
                </div>
                <div>
                    <SkeletonLoading type="text" />
                </div>
            </div>
        </div>
    )
}

export default SkeletonTopViewWorkbook;
```

동적인 느낌을 주기 위해 조사를 진행하여 보니 컴포넌트와 CSS를 하나 더 생성하여 처리하는 방법이 있어서 이를 활용해보았다.

![folder02](/assets/images/posts/2023-07-19-Skeleton-loading/forder_image02.png)

### Shimmer.tsx

```tsx
import React from 'react';
import styles from './Shimmer.module.css';

function Shimmer(){
    return (
    <div className={styles.shimmer_wrapper}>
      <div className={styles.shimmer}></div>
    </div>
    )
}

export default Shimmer;
```

### Shimmer.module.css

```css
.shimmer_wrapper {
    position : absolute;
    top: 0;
    left : 0;
    width : 100%;
    height : 100%;
    animation: loading_animation 2.5s infinite;
}

.shimmer {
    width : 50%;
    height: 100%;
    background-color: rgba(255,255,255,0.2);
    transform: skewX(-20deg);
    box-shadow: 0 0 30px 30px rgba(255,255,255,0.05);
}

@keyframes loading_animation{
    0% {
        transform: translateX(-150%);
    }
    50% {
        transform: translateX(-60%);
    }
    100% {
        transform: translate(150%);
    }
}
```

React Query의 isLoading을 활용해서 이렇게 사용할 수 있다.

![sourceImage](/assets/images/posts/2023-07-19-Skeleton-loading/source.png)