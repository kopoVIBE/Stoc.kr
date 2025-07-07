FROM python:3.10-slim

WORKDIR /app

# 필수 패키지 설치 (머신러닝 + 데이터 분석)
RUN apt-get update && \
    apt-get install -y curl && \
    pip install --upgrade pip && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# requirements.txt 복사 및 패키지 설치
COPY requirements.txt .
RUN pip install -r requirements.txt

# 예측 시스템 파일들 복사
COPY . .

# 기본 실행 명령
CMD ["python", "stock_prediction_scheduler.py"] 