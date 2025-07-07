# 🚀 Stock Predictor

주가 상승/하락을 예측하는 AI 시스템입니다.

## 📋 기능

- 500개 이상의 한국 주식 종목 예측
- LSTM 딥러닝 모델 기반 예측
- MongoDB 자동 저장
- 스케줄러 기능 (정기 예측)
- 로그 기능

## 🛠️ 설치 및 실행

### Docker 실행
```bash
# 이미지 빌드
docker build -t stock-predictor .

# 컨테이너 실행 (일회성)
docker run -e RUN_ONCE=true -e MONGODB_URI=mongodb://host:27017/ stock-predictor

# 컨테이너 실행 (스케줄러)
docker run -e SCHEDULE_TIME=16:01 -e MONGODB_URI=mongodb://host:27017/ stock-predictor
```

### 로컬 실행
```bash
# 패키지 설치
pip install -r requirements.txt

# 예측 실행
python predict_stock.py

# 스케줄러 실행
python stock_prediction_scheduler.py
```

## 🔧 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `MONGODB_URI` | MongoDB 연결 URI | `mongodb://localhost:27017/` |
| `SCHEDULE_TIME` | 매일 실행 시간 (HH:MM) | `16:01` |
| `RUN_ONCE` | 한 번만 실행 여부 | `false` |
| `LOG_LEVEL` | 로그 레벨 | `INFO` |

## 📊 출력 데이터

### MongoDB 저장 형태
```json
{
  "stock_name": "삼성전자",
  "stock_code": "005930",
  "prediction": 1,
  "predicted_at": "2025-07-07 14:30:00"
}
```

### 예측 값
- `1`: 상승 예측 📈
- `0`: 하락 예측 📉

## 📁 파일 구조

```
stock-predictor/
├── Dockerfile                      # Docker 설정
├── requirements.txt               # 패키지 목록
├── predict_stock.py              # 예측 실행 스크립트
├── stock_prediction_scheduler.py # 스케줄러 스크립트
├── custom_model_loader.py        # 모델 로더
├── bidirectional_lstm_model.h5   # 훈련된 모델
├── scaler.pkl                    # 스케일러
└── README.md                     # 이 파일
```

## 🚀 인프라 배포

### Docker Compose 예시
```yaml
version: '3.8'
services:
  stock-predictor:
    build: .
    environment:
      - MONGODB_URI=mongodb://mongo:27017/
      - SCHEDULE_TIME=16:01
      - RUN_ONCE=false
    depends_on:
      - mongo
    restart: unless-stopped
  
  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
```

### Kubernetes 배포
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stock-predictor
spec:
  replicas: 1
  selector:
    matchLabels:
      app: stock-predictor
  template:
    metadata:
      labels:
        app: stock-predictor
    spec:
      containers:
      - name: stock-predictor
        image: stock-predictor:latest
        env:
        - name: MONGODB_URI
          value: "mongodb://mongo-service:27017/"
        - name: SCHEDULE_TIME
          value: "16:01"
```

## 📝 로그

- 로그 파일: `stock_prediction.log`
- 로그 레벨: INFO, ERROR, WARNING
- 실행 상태, 예측 결과, DB 저장 결과 등을 기록

## 🔍 트러블슈팅

### MongoDB 연결 실패
```bash
# 연결 테스트
docker run --rm -it mongo:latest mongo --host <your-mongodb-host> --eval "db.adminCommand('ping')"
```

### 모델 로딩 실패
- `bidirectional_lstm_model.h5` 파일이 있는지 확인
- `scaler.pkl` 파일이 있는지 확인
- TensorFlow 버전 호환성 확인

### 메모리 부족
```bash
# Docker 메모리 제한 설정
docker run -m 4g stock-predictor
``` 