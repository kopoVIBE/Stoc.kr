import os
import json
import time
import schedule
import logging
from datetime import datetime, timedelta
from pymongo import MongoClient
from predict_stock import main as predict_main

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('stock_prediction.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# MongoDB 연결 설정
def get_mongo_client():
    """MongoDB 클라이언트 연결"""
    try:
        mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        client = MongoClient(mongo_uri)
        # 연결 테스트
        client.admin.command('ping')
        logger.info("MongoDB 연결 성공")
        return client
    except Exception as e:
        logger.error(f"MongoDB 연결 실패: {e}")
        return None

def save_predictions_to_db(predictions_data):
    """예측 결과를 MongoDB에 저장"""
    try:
        client = get_mongo_client()
        if not client:
            logger.error("MongoDB 연결 실패로 데이터 저장 불가")
            return False
        
        # 데이터베이스 및 컬렉션 선택
        db = client['stockr']
        collection = db['stock_predictions']
        
        # 기존 예측 데이터 삭제 (같은 날짜의 예측이 있다면)
        today = datetime.now().strftime('%Y-%m-%d')
        collection.delete_many({
            'predicted_at': {'$regex': f'^{today}'}
        })
        
        # 새 예측 데이터 삽입
        if predictions_data:
            collection.insert_many(predictions_data)
            logger.info(f"MongoDB에 {len(predictions_data)}개 예측 결과 저장 완료")
            return True
        else:
            logger.warning("저장할 예측 데이터가 없습니다")
            return False
            
    except Exception as e:
        logger.error(f"MongoDB 저장 중 오류: {e}")
        return False
    finally:
        if client:
            client.close()

def run_prediction_job():
    """예측 작업 실행"""
    try:
        logger.info("🚀 주가 예측 작업 시작")
        
        # 예측 실행
        predict_main()
        
        # JSON 파일에서 결과 읽기
        if os.path.exists('prediction_results.json'):
            with open('prediction_results.json', 'r', encoding='utf-8') as f:
                predictions = json.load(f)
            
            # MongoDB에 저장
            if save_predictions_to_db(predictions):
                logger.info("✅ 예측 작업 완료 및 DB 저장 성공")
            else:
                logger.error("❌ DB 저장 실패")
        else:
            logger.error("❌ 예측 결과 파일을 찾을 수 없습니다")
            
    except Exception as e:
        logger.error(f"❌ 예측 작업 중 오류: {e}")
        import traceback
        traceback.print_exc()

def main():
    """메인 스케줄러"""
    logger.info("📊 주가 예측 스케줄러 시작")
    
    # 환경 변수 확인
    run_once = os.getenv('RUN_ONCE', 'false').lower() == 'true'
    schedule_time = os.getenv('SCHEDULE_TIME', '16:01')  # 기본값: 오후 4시 1분
    
    if run_once:
        # 한 번만 실행
        logger.info("🔄 일회성 예측 실행")
        run_prediction_job()
    else:
        # 스케줄러 실행
        logger.info(f"⏰ 매일 {schedule_time}에 예측 실행 예약 (오후 4시 1분)")
        schedule.every().day.at(schedule_time).do(run_prediction_job)
        
        # 스케줄러 실행
        while True:
            schedule.run_pending()
            time.sleep(60)  # 1분마다 체크

if __name__ == "__main__":
    main() 