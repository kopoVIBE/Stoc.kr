FROM python:3.10-slim

WORKDIR /app

# 필수 패키지 설치 (Playwright + MongoDB 등)
RUN apt-get update && \
    apt-get install -y curl unzip fonts-liberation libnss3 libatk-bridge2.0-0 libxss1 libasound2 libgbm1 libgtk-3-0 && \
    pip install --upgrade pip && \
    pip install playwright pymongo beautifulsoup4 lxml && \
    python -m playwright install chromium && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 크롤러 복사
COPY . .

# 기본 실행 명령
CMD ["python", "unified-news-crawler.py"]
