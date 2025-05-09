---
layout: post
title: "MongoDB.local Seoul 2024 - 컨퍼런스 참여 후기"
author: Seobisback
tags: [MongoDB, Conference, Event]
categories: Syntax
---

# MongoDB.local Seoul 2024 컨퍼런스 참여 후기

## 컨퍼런스 개요
[[https://www.mongodb.com/ko-kr/events/mongodb-local/seoul](https://www.mongodb.com/ko-kr/events/mongodb-local/seoul)]

![01.png](/assets/images/posts/2024-09-04-mongodb-local/01.png)
- 일시 및 장소
    - 장소 : 서울특별시 송파구 올림픽로 240, 롯데호텔 월드 3층 크리스탈볼룸
    - 일시 : 2024년 09월 03일, 화요일 09:00 AM - 05:00 PM KST
![02.png](/assets/images/posts/2024-09-04-mongodb-local/02.png)
> 행사를 소개하는 페이지에서 등록을 마치고, 참여가 결정되면 다음과 같이 QR 초대장을 메일로 줍니다!

![KakaoTalk_Photo_2024-09-04-10-24-26 002.jpeg](/assets/images/posts/2024-09-04-mongodb-local/KakaoTalk_Photo_2024-09-04-10-24-26 002.jpeg)
등록대에서 메일로 받은 초대장을 등록하면 행사가 진행되는 동안 착용할 목걸이와 Lunch coupon, 그리고 MongoDB NameTag을 수령할 수 있습니다.

![KakaoTalk_Photo_2024-09-04-10-24-25 001.jpeg](/assets/images/posts/2024-09-04-mongodb-local/KakaoTalk_Photo_2024-09-04-10-24-25 001.jpeg)
![KakaoTalk_Photo_2024-09-04-10-24-30 004.jpeg](/assets/images/posts/2024-09-04-mongodb-local/KakaoTalk_Photo_2024-09-04-10-24-30 004.jpeg)
행사장에는 참여를 위해 정말 많은 업계 종사자 분들이 계셨습니다!

![KakaoTalk_Photo_2024-09-04-10-24-28 003.jpeg](/assets/images/posts/2024-09-04-mongodb-local/KakaoTalk_Photo_2024-09-04-10-24-28 003.jpeg)
![KakaoTalk_Photo_2024-09-04-10-24-37 010.jpeg](/assets/images/posts/2024-09-04-mongodb-local/KakaoTalk_Photo_2024-09-04-10-24-37 010.jpeg)
행사가 진행된 홀이 넓었고 많은 분들이 참여하는 만큼 거대한 스크린이 여러 대가 설치되어 있었습니다.


![KakaoTalk_Photo_2024-09-04-10-24-31 005.jpeg](/assets/images/posts/2024-09-04-mongodb-local/KakaoTalk_Photo_2024-09-04-10-24-31 005.jpeg)
저도 자리를 잡고 세션 시작 전에 행사 준비를 완료했습니다.

![KakaoTalk_Photo_2024-09-04-10-24-33 007.jpeg](/assets/images/posts/2024-09-04-mongodb-local/KakaoTalk_Photo_2024-09-04-10-24-33 007.jpeg)
MongoDB에 신재성 지사장님의 환영사와 함께 행사 시작



## [주요 세션 요약]

### 세션 1: Big Data Assistant - 생성형 AI를 활용한 데이터 업무 혁신
#### Big Data Assistant가 무엇인가?
Vision - 기존 Assistant는 Python과 SQL Query를 알아야 하므로 비전문가가 사용하기 좋지 않았다.
- AI Assistant로 Insight를 생성해 실제 사업에 기여
- 전 임직원이 **Data를 기반한 의사 결정**을 할 수 있는 환경을 제공
- 단순 자연어 질의만으로 Data 분석이 가능한 AI 기반 분석 자동화 서비스를 통해 임직원이 쉽고 빠르게 Data를 분석할 수 있는 서비스 제공

**기존 Data 분석 프로세스**
- 질의 의도 파악 - 리드타임 발생 - 분석가 필요 - 재분석

**BD Assistant** - 실시간 질의 / 답변 가능, 추가 질의 가능, 시각화 및 리포팅 자동 생성, 인사이트 생성 등
- Self 서비스 ( 자연어 질의 ) - 리드타임 감소 - 분석가 불필요 - 실시간 재분석

**BD Assistant 서비스 프로세스**
의도 분석 (생성형 AI 사용) - SQL 생성 - Data 추출 - Data 요약 - Charts생성 (파이썬 사용) - Charts 해석 - 피드백 등록

**MongoDB Use Case**
BD Assistant 서비스의 전체 DB를 담당
- Muti Agent 간에 Communication Message ( SQL 생성, Insight 생성, Vision 생성, Report 생성)
- Feedback & VoC ( Dashboard, Monitoring, Jira ticket 발행)
- Frontend Database ( Logging )
    
### 세션 2: What’s New in MongoDB 8.0
- 주요 발표자 및 인사이트
	- [MongoDB] - Product Management - XiaochenWu

#### Feature
- 현재 8.0 Release Candidas
- 간소화된 개발자 생산성, 개발자 경험
- MongoDB 커뮤니티에서 Search와 Vector Search를 사용할 수 있다.

#### 핵심영역
- 성능
	- 벤치마크를 통해 성능 향상 지표 소개
	- Command Path Optimaizations
		- 모든 유형의 Command에 대해 성능 향상
		- Improve performance for the most basic queries
			- indexed
			- single equality
	- Query Shape - 8.0에서 도입, 비용이 많이드는 Query를 방지함,
	- Rejection Filter
	- Persistent Query - 이전에는 index filter를 사용하였지만 서버를 재시작하면 다시 세팅해야하는 문제가 있었음, 8.0에서는 Persistent Query를 설정하고 Query Shape 별로 index filter를 지정할 수 있고 삭제할 때까지 유지된다.
	- TImeout for Read Operation - Operation level에서 오랫동안 리소스를 점유하는 쿼리를 timeout을 설정해서 이를 방지할 수 있다.
- 샤딩
	- 비용적인 문제
	- 8.0에서는 샤딩을 쉽게 더 저렴하게 세팅할 수 있게 만들었다.
	- 데이터 배포를 샤딩 단에서 쉽게할 수 있게 만듬
	- Faster resharding - 이전 버전 대비 최대 50배 빠르게 reshard, shard key를 변경하지 않고도 reshard 할 수 있다.
- 보안
	- 로깅
		- OCSF Logging Format
			- AWS와 MongoDB의 파트너사들은 해당 포맷을 도입한 적이 있다.
			- 이 옵션을 사용하게되면 외부 모니터링 시스템과 더 쉽게 통합할 수 있다.


### 세션 3: 서비스의 품질과 생산성 향상을 위한 MongoDB 생성형 AI 애플리케이션 아키텍처
- 주요 발표자 및 인사이트
	- [MongoDB] - Solutions Architecture Manager - 김상필 전무

#### Agenda
- 생성형 AI 애플리케이션의 현재
- RAG 및 어려움
- MongoDB 생성형 Ai 애플리케이션 스택
	- 데이터 전처리
	- 파운데이션 모델
	- 벡터 데이터베이스
	- LLM 오케스트레이션

#### 생성형 AI 애플리케이션을 위한 현재
- Semantic Text 검색
- 이미지 검색
- RAG를 통한 Q&A
- 대화형 에이전트

#### RAG 및 어려움
- 일반적으로는 사용자가 LLM에 질문하고 답변을 받는 형태로 진행된다.
- Query된 부분을 Vector DataBase를 통해 LLM에 전달하는 것 RAG


### 점심시간 - JMT
![KakaoTalk_Photo_2024-09-04-10-24-34 008.jpeg](/assets/images/posts/2024-09-04-mongodb-local/KakaoTalk_Photo_2024-09-04-10-24-34 008.jpeg)
![KakaoTalk_Photo_2024-09-04-10-24-36 009.jpeg](/assets/images/posts/2024-09-04-mongodb-local/KakaoTalk_Photo_2024-09-04-10-24-36 009.jpeg)

> 점심식사 이후 부터는 Track 별로 세션이 나뉘어졌습니다. 
> 저는 `Track B` 에 세션을 들었으며, `Track A` 에서 소개된 세션 목록은 다음과 같습니다

---

`Track A` Sessions
- MongoDB 데이터 모델링의 원리와 방법론 - [MongoDB] - Advisory Solutions Architect 김규동 상무
- LG U+ Cloud Management Platform의 MongoDB 활용 사례 - [LG유플러스] - Software Engineer 진보은
- Relational Migrator를 이용한 애플리케이션 현대화 - [MongoDB] - Senior Solutions Architect 나가진 상무

---

`Track B` Sessions

### 세션 4: MongoDB Atlas에서 이벤트 기반 애플리케이션을 구축하는 방법
- 주요 발표자 및 인사이트
	- [MongoDB] - Senior Solutions Architect 이규현 상무

#### Atlas 스트림 프로세싱을 구축한 이유
- 현재 트렌드는 AI도 트렌드지만 Real TIme Streaming도 많이 이야기가 나온다.
- 스트리밍 데이터는 최신 앱의 핵심이다.
	- 스트림 처리는 유입되는 데이터의 폭주를 제어하고, 스트림에서 중요한 이벤트를 찾거나, 이동 중인 데이터와 저장 중인 데이터를 결합하는 등. 이러한 애플리케이션을 구동하는데 있어 기본적인 구성 요소이다.

#### Atlas 스트림 프로세싱 소개
- 문서 모델과 유연한 스키마를 중심으로 구축
- 연속 처리, 유효성 검사 및 상태 저장 창 처리
- 이동 중인 데이터와 저장 중인 데이터를 

#### Atlas 스트림 처리 아키텍처

#### Atlas 스트림 프로세싱의 장점
- 실시간 데이터 처리
	- 신속한 처리
	- 지속적 처리
- 강력한 처리, 분석 기능
	- 복잡한 이벤트 처리
	- 윈도우 함수 지원
- 간편한 통합 및 연결성
	- 다양한 데이터 소스 지원
	- MongoDB Atlas와 통합
	- 서드파티 서비스 연동
- 손쉬운 인터페이스
	- 쉬운 구성 및 관리
	- 유연한 쿼리 언어
	- 모니터링 및 로깅

### 세션 5: Vertex AI Agent Builder 소개
- 주요 발표자 및 인사이트
	- [Google Cloud] - Partner Engineer 황장준

#### Vertex AI
- Agent Builder
	- AI Application을 만들어 내는 것 ( No code, Low code, Full code )
	- LLM 으로 서비스를 만들때 좀 더 유용하게 사용가능
- Model Builder
	- Prompting, Tuning
- Model Garden

### 세션 6: 언론사의 디지털 전환 : 한겨례의 MongoDB Atlas 도입 사례
- 주요 발표자 및 인사이트
	- [한겨례신문사] - Software Engineer 박준석

### 도입 전 상황
- 도입을 준비할 수 있는 인원 부족
- 기존 레거시 서비스는 버리고 새로 개발
- 한겨레 신문 개발팀 Role
	- 웹, 앱, 일문, 중문, CMS, 검색 서비스, (개인화)구독 서비스

### 요구사항
- 변화하는 미디어 산업에 즉각적으로 대응할 수 있는 데이터베이스
- 생산선을 향상시킬 수 있는 데이터베이스 (개발 회사가 아니기 때문에 작은 리소스로)
- 빠른 데이터베이스
- 각종 자료들


> 세션 6 이후 다시 `Track A` 와 `Track B` 가 나누어졌으며 저는 `Track B` 의 세션을 들었습니다.
> `Track A` 에서 소개된 세션 목록은 다음과 같습니다.


---

`Track A` Sessions
- 야놀자 MongoDB로 데이터 관리 패러다임을 바꾸다. - [야놀자] - 클라우드기술전략실장 김지환
- AI 애플리케이션을 위한 데이터 모델링 - [MongoDB] - Senior Pre-sales Solutions Architect 조건호 상무
- MongoDB Atlas로 해결한 주류(酒) 도메인의 문제들 - [데일리샷] - 최희재

---


### 세션 7: MongoDB Atlas를 활용한 AWS에서 GenAI 환경 구축하기
- 주요 발표자 및 인사이트
	- [AWS] - Sr. Solutions Architect 윤군

- AWS 생성형 AI 서비스
- MongoDB로 Gen AI 구축하기
- AWS Toolkit
	- Amazon Q Developer

### 세션 8: 검색 그 이상, Atlas Search를 활용한 엔드 투 엔드 경험 실현
- 주요 발표자 및 인사이트
	- [MongoDB] - Senior Consulting Engineer 최근한 이사


### 세션 9: 쏘카에서 MongoDB Atlas Search로 쉽고 빠르게 검색엔진 구축하기
- 주요 발표자 및 인사이트
	- [SOCAR] - 양준영 매니저
	- [SOCAR] - 차현철 매니저

#### Mission
- 쏘카 서비스 외에도 다른 서비스에서도 숙박 관련 정보를 검색으로 제공해주어야함
- 고성능 검색 엔진 ( 필터 등 )

#### Why MongoDB Atlas Search
- 유연한 스키마를 제공해서 사용자가 데이터를 유연하게 관리할 수 있음
- 샤딩을 통해서 수평 확장을 제공하고 있어서
- 다양한 쿼리 기능을 제공하고 있어서 복잡한 데이터 조회등 다양한 도구들을 제공하고 있다.
- 다양한 조건과 연산자를 활용해서 효율적인 검색 가능
- 비정형 데이터를 관리하는데 많이 사용하게 되어 러닝 커브가 높지 않았다.
- 안정성과 성능이 여러 도메인에서 인정되어 있기 때문
- 요구사항 확인
	- 키워드 기반에 통합 검색, 지역 별 검색이 필요

#### 어떻게 구현하였는가?
- Aggregation
- 지도 검색 Geo Search - Geo location 정보를 통해서

---

## 개인적인 소감 및 학습 포인트

개인적으로는 SOCAR에 Backend Engineer 분들이 소개하는 세션이 가장 흥미로운 부분이였습니다.

서비스를 구현할 때의 Mission과 요구사항 분석을 통해, 어떤 기술을 도입하는 것에 대해 충분한 검증과 이유를 찾아 해당 요구사항에 가장 알맞은 기술을 도입하는 것에 대해 소개하는 부분이 흥미로웠고, 

MongoDB에서 추구하는 `Love your developer` 라는 방향성과 그 방향성을 통해 지속적으로 발전시키는 개발 경험과 개발자 생산성을 간소화 시키기 위한 노력도 인상적인 부분이였습니다. 


## 결론

### MongoDB.local Seoul 2024의 전체적인 평가

현재 AI 관련 기술이 트렌드인 만큼 세션도 AI에 관련된 세션이 많았습니다. 

Frontend Engineer 로써 AI 에 관련 지식에서 미흡한 부분이 많았습니다만 다른 포지션의 엔지니어들은 어떤식으로 MongoDB를 통해 아이디어를 구현하고, 어떤 방식으로 MongoDB 라는 Database를 사용하고 있는지를 엿볼 수 있는 좋은 기회가 되었습니다.



## 마무리
![KakaoTalk_Photo_2024-09-04-10-24-38 011.jpeg](/assets/images/posts/2024-09-04-mongodb-local/KakaoTalk_Photo_2024-09-04-10-24-38 011.jpeg)
같이 행사에 참여한 팀원들과 회식으로 마무리하였습니다.
