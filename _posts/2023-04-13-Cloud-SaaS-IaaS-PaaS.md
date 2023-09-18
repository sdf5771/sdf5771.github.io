---
layout: post
title: "클라우드, SaaS, IaaS, PasS"
author: Seobisback
tags: [Cloud, SaaS, IaaS, PasS]
categories: Syntax
---

# 클라우드(Cloud)

- 인터넷을 통해 접근할 수 있는 서버 그리고 그 안에서 구동되는 소프트웨어, 데이터베이스 등을 의미함.

![cloud_01](/assets/images/posts/2023-04-13-Cloud-SaaS-IaaS-PaaS/cloud01.png)

- 내 컴퓨터 장비를 사용하지 않고 컴퓨터 장비를 구축해 해야할 작업을 온라인에 분산되어 존재하는 데이터 센터(Data Center, 이하 클라우드)에 맡겨 수행하는 것을 말한다. 이렇게 되면 서버를 직접 구매할 때 고려해야 할 전력, 위치, 서버 세팅, 확장성을 고민하지 않고 서비스 운영에만 집중할 수 있다. 이를 오프프레미스(off-premise) 방식이라고 한다.

![cloud_02](/assets/images/posts/2023-04-13-Cloud-SaaS-IaaS-PaaS/cloud01.png)

# SaaS

- SaaS(Software as a Service)는 인터넷을 통해 소프트웨어를 제공하는 방법이다. 완제품, 구글 드라이브, N드라이브, 구글 DOCS 등

# IaaS

- IasS(Infrastructure-as-a-Service), 인프라를 제공 (서버와 저장소를 제공) 빈 방을 주는 것, 가상머신 위에서 애플리케이션의 각 컴포넌트가 구동된다. 특정 클라우드에 종속 x, 운영비가 상승한다. 이식성이 좋다. AWS의 EC2, NCP 등이 있다.
- 가상 머신 : 가상 컴퓨터, 컴퓨터 시스템을 에뮬레이션(가상현실화) 하는 소프트웨어

# PasS

- PasS(Platform-as-a-Service) 는 플랫폼을 제공한다.
- 플랫폼을 제공, 빌트인 방. 운영비는 절감할 수 있고, 모니터링, CI/CD가 제공된다. 그러나 IaaS 보다는 유연하지 않고 플랫폼에 종속되게 되어있다. heroku 등이 있다.