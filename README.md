# Seobisback Github Blog

> Vite + React + TypeScript로 구축한 개인 기술 블로그

[![Deploy to GitHub Pages](https://github.com/sdf5771/sdf5771.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/sdf5771/sdf5771.github.io/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://sdf5771.github.io/)

## 🚀 소개

공부하는 기술과 경험에 대한 이야기를 정리하는 개인 기술 블로그입니다. 
모던한 웹 기술 스택을 활용하여 빠르고 사용자 친화적인 블로그 경험을 제공합니다.

## 🛠️ 기술 스택

### Frontend
- **React 19** - 사용자 인터페이스 구축
- **TypeScript** - 타입 안정성 및 개발 생산성
- **Vite** - 빠른 개발 서버 및 번들링
- **React Router DOM** - SPA 라우팅

### Content Management
- **Markdown** - 포스트 작성 형식
- **Gray Matter** - 메타데이터 파싱
- **Markdown-it** - 마크다운 렌더링
- **Highlight.js** - 코드 하이라이팅

### Styling & UI
- **CSS3** - 커스텀 스타일링
- **Pretendard Font** - 한글 웹폰트
- **Responsive Design** - 모바일 우선 반응형

### State Management
- **Zustand** - 경량 상태 관리

### Deployment
- **GitHub Pages** - 정적 사이트 호스팅
- **GitHub Actions** - CI/CD 자동화

## 📁 프로젝트 구조

```bash
src/
├── components/ # 재사용 가능한 컴포넌트
│ ├── GlobalNavigationBar/
│ ├── PostCard/
│ ├── Pagination/
│ ├── Profile/
│ └── Footer/
├── pages/ # 페이지 컴포넌트
│ ├── Home/
│ └── Post/
├── stores/ # Zustand 스토어
├── utils/ # 유틸리티 함수
├── assets/ # 정적 자산
└── styles/ # 글로벌 스타일
public/
├── posts/ # 마크다운 포스트 파일
├── images/ # 이미지 리소스
└── postsData.json # 자동 생성된 포스트 메타데이터
```


## 🚀 시작하기

### 필수 요구사항
- Node.js 18+
- npm 또는 yarn

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/sdf5771/sdf5771.github.io.git
cd sdf5771.github.io

# 의존성 설치
npm install

# 포스트 데이터 생성
npm run generate-posts-data

# 개발 서버 실행
npm run dev
```

### 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 로컬에서 프로덕션 빌드 미리보기
npm run preview
```

## 📝 포스트 작성

### 1. 마크다운 파일 생성
`public/posts/` 디렉토리에 새 마크다운 파일을 생성합니다.

### 2. Front Matter 작성
```markdown
---
title: "포스트 제목"
date: "2024-01-01"
category: "카테고리"
tags: ["태그1", "태그2"]
thumbnail: "/images/thumbnail.jpg"
description: "포스트 설명"
---

# 포스트 내용
```

### 3. 포스트 데이터 재생성
```bash
npm run generate-posts-data
```

## 🎨 주요 기능

### ✨ 사용자 경험
- **반응형 디자인**: 모든 디바이스에서 최적화된 경험
- **다크/라이트 모드**: 사용자 선호에 따른 테마 전환
- **타이포그래피**: Pretendard 폰트로 가독성 향상
- **인터랙션**: Typewriter 효과 등 동적 요소

### 📱 모바일 최적화
- **햄버거 메뉴**: 모바일에서 편리한 네비게이션
- **터치 친화적**: 모바일 터치 인터페이스 최적화
- **빠른 로딩**: Vite의 최적화된 번들링

### 🔍 콘텐츠 관리
- **자동 포스트 인덱싱**: 빌드 시 포스트 목록 자동 생성
- **태그 시스템**: 포스트 분류 및 필터링
- **페이지네이션**: 효율적인 포스트 탐색
- **썸네일 지원**: 포스트별 대표 이미지

### 🚀 성능 최적화
- **코드 분할**: React.lazy를 통한 동적 임포트
- **이미지 최적화**: 반응형 이미지 및 지연 로딩
- **번들 최적화**: Vite의 Tree-shaking 및 압축

## 🔧 개발 스크립트

```bash
# 개발 서버 실행
npm run dev

# 포스트 데이터 생성
npm run generate-posts-data

# 프로덕션 빌드
npm run build
```

## 🚀 배포

이 프로젝트는 GitHub Actions를 통해 자동으로 GitHub Pages에 배포됩니다.

### 자동 배포 트리거
- `main` 브랜치에 푸시할 때
- 수동 워크플로우 실행

### 배포 과정
1. 의존성 설치
2. 포스트 데이터 생성
3. TypeScript 컴파일
4. Vite 빌드
5. GitHub Pages 배포

## 📄 라이선스

이 프로젝트는 개인 블로그 용도로 제작되었습니다.

## 🤝 기여

버그 리포트나 기능 제안은 [Issues](https://github.com/sdf5771/sdf5771.github.io/issues)를 통해 제출해주세요.

## 📞 연락처

- **Blog**: [https://sdf5771.github.io/](https://sdf5771.github.io/)
- **GitHub**: [@sdf5771](https://github.com/sdf5771)
- **Email**: [@sdf5771](mailto:seobisback@gmail.com)

---

⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요!