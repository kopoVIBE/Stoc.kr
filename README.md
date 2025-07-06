# Stoc.kr

실시간 주식 시세 조회 및 분석 서비스

## 시스템 아키텍처

![아키텍처](docs/architecture.png)

## 기술 스택

### 백엔드

- Java 17
- Spring Boot 3.2.3
- Spring Data JPA
- Spring Data MongoDB
- Spring Data Redis
- Spring Kafka
- Spring WebSocket
- MySQL 8.0
- MongoDB 6.0
- Redis 7.0
- Apache Kafka

### 프론트엔드

- React
- TypeScript
- SockJS
- STOMP.js
- Chart.js

### 실시간 데이터 수집

- Python
- WebSocket-client
- Confluent-Kafka

## 로컬 개발 환경 설정

### 사전 요구사항

- Docker Desktop
- Java 17
- Python 3.9+
- Node.js 18+

### 1. 백엔드 서버 및 인프라 실행

```bash
# BE 디렉토리로 이동
cd BE

# .env 파일이 있는지 확인
ls -la .env

# Docker 컨테이너 실행
docker-compose up -d

# 서비스 상태 확인
docker-compose ps

# Spring Boot 애플리케이션 실행
./gradlew bootRun
```

### 2. 실시간 데이터 수집기 실행

```bash
cd realtime-collector
pip install -r requirements.txt
python main.py
```

### 3. 프론트엔드 실행

```bash
cd FE
npm install
npm start
```

## 서비스 접속 정보

### 로컬 개발 환경

- 백엔드 API: http://localhost:8080
- 프론트엔드: http://localhost:3000
- Kafka UI: http://localhost:8081

### 모니터링

- Spring Actuator: http://localhost:8080/actuator
- MongoDB: mongodb://localhost:27017
- Redis: localhost:6379
- MySQL: localhost:3306

## 클라우드 배포 환경 (예정)

- AWS ECS (백엔드)
- AWS MSK (Kafka)
- AWS ElastiCache (Redis)
- AWS DocumentDB (MongoDB)
- AWS RDS (MySQL)
- AWS S3 + CloudFront (프론트엔드)
