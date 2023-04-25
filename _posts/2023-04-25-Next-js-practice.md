---
layout: single
title:  "**[Next JS] 학습 01 - 프로젝트 생성 및 개념 공부**"
categories: React, SEO, NextJS
toc: true
toc_label: "Table of Contents"
toc_icon: "bookmark"
---

# 1. next js app 프로젝트 만들기

```tsx
npx create-next-app@latest
```

![next-js-01](/assets/images/posts/2023-04-25-Next-js-practice/next-js-01.png)

- create-next-app으로 프로젝트를 만들면 여러 옵션을 선택한다.
    - Would you like to use TypeScript with this project? - 타입스크립트 사용 여부를 선택
    - Would you like to use ESLint with this project - ESLint 사용 여부를 선택 (코딩 컨벤션에 위배되는 코드나 안티 패턴을 자동 검출하는 도구)
    - Would you like to use Tailwind CSS with this project? - Tailwind CSS 사용 여부를 선택 ([https://fe-developers.kakaoent.com/2022/220303-tailwind-tips/](https://fe-developers.kakaoent.com/2022/220303-tailwind-tips/))
    - Would you like to use ‘src/’ directory with this project? - src 폴더에서 관리를 할 것인지 root에서 관리를 할 것인지 선택
    - Would you like to use experimental ‘app/’ directory with this project? - app 디렉토리를 실험적인걸 사용할건지 선택
    - What import alias would you like configured? - import 시 Base 경로를 설정
    

# 2. Next js에서의 Page

Next js는 React js로 만든 웹사이트와 다르게 라우터를 설정해 줄 필요가 없다 ← Next js와 React js의 차이점이 여기서 나타나게 된다 (프레임워크와 라이브러리의 차이)

- pages 디렉토리 내부에 생성한 자바스크립트 파일이 곧 URL의 path가 되며, 해당 컴포넌트는 export default 해야한다.
- 해당 컴포넌트의 이름은 크게 중요하지 않다. URL이 되는 것은 파일명이다.

![next-js-02](/assets/images/posts/2023-04-25-Next-js-practice/next-js-02.png)

![next-js-03](/assets/images/posts/2023-04-25-Next-js-practice/next-js-03.png)

![next-js-04](/assets/images/posts/2023-04-25-Next-js-practice/next-js-04.png)

- 그리고 Next js에는 기본적으로 404 페이지가 제공된다.

![next-js-05](/assets/images/posts/2023-04-25-Next-js-practice/next-js-05.png)

# 3. getServerSideProps

- 기존 동적으로 렌더링하던 부분을 정적으로 Server Side에서 실행하기 위해 사용할 수 있다.

### 언제 사용해야 하는가?

- request time에 반드시 데이터를 fetch해야 하는 페이지를 pre-render해야 하는 경우에만 getServerSideProps를 사용해야 한다.
- 데이터를 pre-render할 필요가 없다면 client side에서 데이터를 가져오는 것을 고려해야 한다.
- 페이지에 자주 업데이트되는 데이터가 포함되어 있고 데이터를 pre-render할 필요가 없는 경우 클라이언트 측에서 데이터를 가져올 수 있다.
    1. 먼저 데이터가 없는 페이지를 즉시 표시한다.
    2. 페이지의 일부는 Static Generation을 사용해 pre-render할 수 있다.
    3. 없는 데이터를 위해 loading 상태를 표시할 수 있다.
    4. 클라이언트 측에서 데이터를 가져와 준비가 되면 표시한다.

해당 접근 방식은 사용자 대시보드 페이지에 적합하다.

- 대시보드는 사용자 별 비공개 페이지이므로 SEO와 연관이 없다.
- 페이지를 미리 렌더링할 필요가 없다.
- 데이터가 자주 업데이트되므로 요청 시 데이터를 가져와야 한다.

*pre-rendering :  HTML을 미리 렌더링하는 것이다. 해당 기능에는 두 가지 방식이 있다.

- Static Generation : HTML을 빌드 타임에 생성해 두고 요청시마다 재사용하는 방법
- Server Side Rendering : 요청 시 마다 Server에서 HTML을 생성해주는 방법

사용자에 따라서 브라우저의 JavaScript 사용을 꺼놓거나, 브라우저 버전이 낮아서 리엑트를 실행시키지 못할 경우에도 Next js는 미리 만들어둔 HTML이 있어서 화면에 렌더링 할 수 있다.

```tsx
import {useState, useEffect} from 'react';
import Seo from '@/components/Seo'
 
export default function Home({results}){
    // const [movies, setMovies] = useState([]);
    // useEffect(() => {
    //     (async () => {
    //         const {results} = await (await fetch("http://localhost:3000/api/movies")).json();
    //         setMovies(results)
    //     })();
    // },[])
    return (
        <div className='home-container'>
            <Seo title="Home" />
            <div className="movie-container">
            {results ? results.map((movie) => (
                <div key={movie.id}>
                    <img src={`https://image.tmdb.org/t/p/w500/${movie.poster_path}`} />
                    <h4>{movie.original_title}</h4>
                </div>
            )) : <h4>...now loading</h4>}
            </div>
            <style jsx>{
                `
                    .movie-container{
                        margin-top: 30px;
                        width: 100%;
                        display: flex;
                        justify-content: center;
                        gap: 30px;
                        flex-wrap: wrap;   
                    }
                    .movie-container > div > img{
                        max-width: 100%;
                        border-radius: 12px;
                        transition: transform 0.2s ease-in-out;
                        box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
                    }
                    .movie-container > div:hover > img{
                        transform: scale(1.05) ;
                    }
                    .movie-container > div {
                        display: flex;
                        flex-direction: column;
                        padding: 10px;
                        width: 220px;
                        overflow: hidden;
                        cursor: pointer;
                    }
                    .movie-container > div > h4{
                        font-size: 1rem;
                        text-align: center;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                `
            }
            </style>
        </div>
    );
}

export async function getServerSideProps(){
    const {results} = await (await fetch("http://localhost:3000/api/movies")).json();

    return {
        props: {
            results,
        }
    }
}
```

### 결과

![next-js-06](/assets/images/posts/2023-04-25-Next-js-practice/next-js-06.png)