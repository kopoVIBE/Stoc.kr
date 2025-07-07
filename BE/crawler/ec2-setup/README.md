# EC2 뉴스 크롤러 설정 가이드

이 폴더는 EC2 환경에서 Spring Boot 애플리케이션과 함께 뉴스 크롤러를 실행하기 위한 파일들을 포함합니다.

## 📁 파일 구조

```
ec2-setup/
├── requirements.txt          # Python 패키지 의존성
├── setup.sh                 # EC2 환경 설정 스크립트
├── ec2-news-crawler.py      # EC2 최적화된 뉴스 크롤러
└── README.md               # 이 파일
```

## 🚀 EC2 설정 단계

### 1. EC2 인스턴스에 접속
```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### 2. 프로젝트 클론 (아직 하지 않았다면)
```bash
git clone https://github.com/your-repo/Stoc.kr.git
cd Stoc.kr
```

### 3. 환경 설정 실행
```bash
cd BE/crawler/ec2-setup
chmod +x setup.sh
./setup.sh
```

이 스크립트는 다음을 수행합니다:
- Python 3 설치 (필요한 경우)
- pip 업그레이드
- 필요한 Python 패키지 설치 (playwright, beautifulsoup4, lxml, pymongo)
- Playwright 브라우저 설치
- stocks.csv 파일 복사

### 4. Spring Boot 애플리케이션 실행
```bash
cd BE
./gradlew bootRun
```

## ⚙️ 설정 확인

### Python 환경 확인
```bash
python3 --version
pip3 list | grep playwright
```

### stocks.csv 파일 확인
```bash
ls -la stocks.csv
head -5 stocks.csv
```

## 🔧 문제 해결

### 1. Python3가 설치되지 않은 경우
```bash
sudo yum update -y
sudo yum install -y python3 python3-pip
```

### 2. Playwright 브라우저 설치 실패
```bash
python3 -m playwright install chromium
```

### 3. 권한 문제
```bash
chmod +x setup.sh
chmod +x ec2-news-crawler.py
```

### 4. 메모리 부족 문제
EC2 인스턴스의 메모리가 부족한 경우:
- t2.micro → t2.small 또는 t2.medium으로 업그레이드
- 크롤러의 동시성 설정을 더 낮게 조정 (ec2-news-crawler.py의 CONCURRENT_TASKS 값)

## 📊 크롤러 설정

`ec2-news-crawler.py` 파일에서 다음 설정을 조정할 수 있습니다:

```python
# 동시성 설정 (EC2 환경에 맞게 조정)
CONCURRENT_TASKS = 3  # EC2에서는 더 보수적으로 설정
BATCH_SIZE = 10       # 배치 크기도 줄임

# 크롤링 설정
MAX_MAIN_NEWS_LINKS = 5      # 주요 뉴스 최대 개수
MAX_PAGES_PER_STOCK = 1      # 종목당 최대 페이지 수
MAX_LINKS_PER_PAGE = 5       # 페이지당 최대 링크 수
```

## 🕒 스케줄링

Spring Boot 애플리케이션은 매 시간 정각에 뉴스 크롤러를 자동으로 실행합니다.

스케줄을 변경하려면 `NewsCrawlingScheduler.java`의 `@Scheduled` 어노테이션을 수정하세요:

```java
// 매 시간 정각
@Scheduled(cron = "0 0 * * * *")

// 매일 오전 9시
@Scheduled(cron = "0 0 9 * * *")

// 매 30분마다
@Scheduled(cron = "0 */30 * * * *")
```

## 📝 로그 확인

크롤러 실행 로그는 Spring Boot 애플리케이션 로그에서 확인할 수 있습니다:

```bash
# Spring Boot 로그 확인
tail -f logs/spring-boot.log

# 또는 Docker 로그 (Docker 사용 시)
docker logs -f your-spring-app
```

## 🔍 수동 실행 테스트

크롤러가 제대로 작동하는지 수동으로 테스트:

```bash
cd BE/crawler/ec2-setup
python3 ec2-news-crawler.py
```

정상적으로 실행되면 다음과 같은 출력을 볼 수 있습니다:
```
'ALL' 모드로 EC2 뉴스 크롤링을 시작합니다...
✅ 'stocks.csv'에서 461개 종목 정보를 읽었습니다.
--- 주요 뉴스 링크 수집 시작 ---
✅ 주요 뉴스 링크 5개 중 5개만 선택하여 수집합니다.
...
``` 