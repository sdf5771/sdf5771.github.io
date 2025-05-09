---
layout: post
title: "Technical SEO를 위한 동적 메타태그 작성 feat.React Project"
author: Seobisback
tags: [React, SEO, MetaTag]
categories: Syntax
---

현재 작업중인 팀 프로젝트에서 SEO를 위한 메타 태그를 작업하며 공부한 것을 기록해본다.

# Technical SEO

테크니컬 SEO는 웹 사이트 검색 순위 향상을 위해서 기술적인 요구 사항을 확인하는 과정이다.

크롤링과 인덱싱, 렌더링 및 웹사이트 구조 등이 포함된다.

구글이나 네이버 같은 검색 사이트에서 내가 운영중인 사이트와 관련 키워드로 검색할 경우

상단에 노출 시켜서 검색을 통한 유입률을 올리고자 하는 작업이며 그러므로 아주 중요한 작업이다.

현재 내가 작업중인 프로그램은 Qualk라는 프로그램으로 “Google Analytics” 나 여러 자격증을 공부할 수 있는 공간을 만드는 중이다.

내 사이트가 크롤 봇이 좋게 봐주는 사이트로 만들기 위한 작업 중

메타 태그에 관한 작업을 고민한 글을 써본다.

# 메타 태그 (Meta tag)

웹페이지 자체의 정보를 명시하기 위한 목적으로 사용되는 HTML 태그를 의미한다.

보통 <head> 요소 아래 배치하고 일반 유저가 보는 웹 컨텐츠에는 영향을 주지 않는다.

### 그럼에도 왜 이것을 중요하게 작업해야 하는가?

검색엔진과 같은 기계들이 웹페이지를 읽어야할 때는 메타 태그의 내용들이 해당 서비스에서 어떻게 표시될지를 결정하는 매우 핵심적인 요소가 된다.

이를 현재 작업중인 React에서 어떻게 동적으로 활용할지 해당 내용을 학습하면서 고민을 해보았다.

---

# 작업 전 해결을 위한 고민

- Qualk는 다른 컨텐츠도 많지만 해당 자격증 관련 문제를 제공하기 위한 사이트이다.
- 그러므로 해당 문제마다 다른 키워드에 의해 크롤러에게 노출이 되어야 하므로 각 문제나 URL depth 마다 각각의 동적인 데이터로 작성이 필요하다고 생각하였다.
- meta tag의 추가, 수정, 삭제가 쉽게 되어야 한다.
- 내가 원하는 곳에서 컴포넌트처럼 불러오고 싶다.

---

## 고민과 아이디어를 도출해냈으니 학습 후 작업을 진행하면 된다.

# react-helmet-async

나는 `react-helmet-async`라는 라이브러리를 사용하여 작업을 진행하였다.

[npm: react-helmet-async](https://www.npmjs.com/package/react-helmet-async)

설치 후 DOCS에서 사용 방법을 확인해보니 해당 라이브러리를 사용하기 전

상단 컴포넌트를 Provider로 wrapping 할 필요가 있는 듯 하였다.

## HelmetProvider Wrapping

Qualk : root/index.tsx

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App';
import store from 'store/store';
import {Provider} from 'react-redux';
import {HelmetProvider} from 'react-helmet-async';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
    <Provider store={store}>
        <BrowserRouter>
            <HelmetProvider>
                <App />
            </HelmetProvider>
        </BrowserRouter>
    </Provider>
);
```

- `react-helmet-async`을 import 후 `HelmetProvider`를 가져와서 최상단 컴포넌트에 wrapping해주었다. (App 밑에 다양한 컴포넌트에서 해당 기능을 사용할 생각이기 때문)

## Component 화

![seo01](/assets/images/posts/2023-04-15-Technical-SEO-meta-tag/seo01.png)

```tsx
import React from 'react';
import {Helmet} from 'react-helmet-async';

type SEOMetaTagPropsType = {
    title: string;
    description: string;
    imgSrc: string;
    url: string;
    keywords: string;
}

const SEOMetaTag = ({title, description, imgSrc, url, keywords}: SEOMetaTagPropsType) => {
    return(
        <Helmet>
            <meta name="type" content="website" />
            <meta name="title" content={title} />
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <meta name="site_name" content={title} />
            <meta name="image" content={imgSrc} />
            <meta name="url" content={url} />

            <meta property="og:type" content="website" />
            <meta property="og:title" content={title} />
            <meta property="og:site_name" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={imgSrc} />
            <meta property="og:url" content={url} />

            <meta property="twitter:type" content="website" />
            <meta property="twitter:title" content={title} />
            <meta property="twitter:site_name" content={title} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={imgSrc} />
            <meta property="twitter:url" content={url} />
            <link rel="canonical" href={url} />
            <link rel="alternate" hrefLang="ko" href={url} />
        </Helmet>
    );
}

export default SEOMetaTag;
```

- 위와 같이 `react-helmet-async`에서 `Helmet`  을 import 해서 meta tag를 컴포넌트로 만든 후 meta tag 삽입이 필요한 페이지를 담당하는 컴포넌트에서 데이터를 넣고 호출하는 방법을 사용하면 편한 것 같다.

## SEOMetaTag Component 사용

![seo02](/assets/images/posts/2023-04-15-Technical-SEO-meta-tag/seo02.png)

나중에 검색 키워드가 회의를 통해 확립되면 해당 부분들을 동적으로 변경해주면 된다.

~~SEO는 사이트맵도 작업해야하고 URL 구조도 생각 많이해야하고 정말 어렵다..~~