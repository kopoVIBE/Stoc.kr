import os
import json
import time
import redis
import logging
import requests
from datetime import datetime
from dotenv import load_dotenv
import pykis

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 환경 변수 로드
load_dotenv()

# Redis 설정
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
SPRING_API_URL = os.getenv('SPRING_API_URL', 'http://localhost:8080/api/price')
TOKEN_FILE = os.path.join(os.path.dirname(__file__), 'kis_token.json')

class StockRealtime:
    def __init__(self):
        self._validate_env_vars()
        self.kis_client = self._initialize_kis_client()
        self.redis_client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            decode_responses=True
        )
        self.is_running = False
        
    def _validate_env_vars(self):
        """환경 변수 유효성 검사"""
        required_vars = {
            'KIS_APP_KEY': os.getenv('KIS_APP_KEY'),
            'KIS_APP_SECRET': os.getenv('KIS_APP_SECRET'),
            'KIS_ACCOUNT_CODE': os.getenv('KIS_ACCOUNT_CODE'),
            'KIS_PRODUCT_CODE': os.getenv('KIS_PRODUCT_CODE')
        }
        
        missing_vars = [var for var, value in required_vars.items() if not value]
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
            
    def _initialize_kis_client(self):
        """한국투자증권 API 클라이언트 초기화"""
        try:
            # API key 정보
            key_info = {
                "appkey": os.getenv('KIS_APP_KEY'),
                "appsecret": os.getenv('KIS_APP_SECRET')
            }
            
            # 계좌 정보
            account_info = {
                "account_code": os.getenv('KIS_ACCOUNT_CODE'),
                "product_code": os.getenv('KIS_PRODUCT_CODE')
            }
            
            # 모의투자 도메인 설정
            domain = pykis.DomainInfo(kind="virtual")
            
            # API 객체 생성
            client = pykis.Api(
                key_info=key_info,
                domain_info=domain,
                account_info=account_info
            )

            # 토큰 정보 출력
            logger.info(f"Token object attributes: {dir(client.token)}")
            logger.info(f"Token object value: {client.token.__dict__}")
            
            # 토큰 저장
            self._save_token(client.token)
            
            return client
        except Exception as e:
            logger.error(f"Failed to initialize KIS client: {e}")
            raise
            
    def _load_saved_token(self):
        """저장된 토큰 불러오기"""
        try:
            if os.path.exists(TOKEN_FILE):
                with open(TOKEN_FILE, 'r') as f:
                    try:
                        token_data = json.load(f)
                        # 토큰의 유효 시간 확인 (24시간)
                        saved_time = datetime.fromisoformat(token_data.get('saved_time', ''))
                        if (datetime.now() - saved_time).total_seconds() < 24 * 60 * 60:
                            return token_data.get('token')
                    except (json.JSONDecodeError, ValueError) as e:
                        logger.error(f"Invalid token file format: {e}")
                        # 잘못된 형식의 파일 삭제
                        os.remove(TOKEN_FILE)
        except Exception as e:
            logger.error(f"Error loading token: {e}")
        return None

    def _save_token(self, token):
        """토큰 저장"""
        try:
            # AccessToken 객체에서 실제 토큰 값 추출
            if isinstance(token, object):
                # token 객체의 내용 출력해서 확인
                logger.info(f"Token object attributes: {dir(token)}")
                logger.info(f"Token object value: {token.__dict__}")
                
                # 실제 토큰 값 추출 시도
                if hasattr(token, 'access_token'):
                    token_str = token.access_token
                elif hasattr(token, 'value'):
                    token_str = token.value
                else:
                    # 토큰 객체의 모든 속성 중에서 문자열 찾기
                    for attr in dir(token):
                        if not attr.startswith('_'):  # 내부 속성 제외
                            value = getattr(token, attr)
                            if isinstance(value, str) and len(value) > 30:  # 토큰은 보통 긴 문자열
                                token_str = value
                                break
                    else:
                        raise ValueError("Could not find token value in token object")
            else:
                token_str = str(token)
            
            token_data = {
                'token': token_str,  # 실제 토큰 값
                'saved_time': datetime.now().isoformat()
            }
            
            # 저장할 데이터 로깅
            logger.info(f"Saving token data: {token_data}")
            
            with open(TOKEN_FILE, 'w') as f:
                json.dump(token_data, f, indent=2)
                logger.info("Token saved successfully")
                
        except Exception as e:
            logger.error(f"Error saving token: {e}")
            
    def start(self):
        """실시간 데이터 수집 시작"""
        try:
            self.is_running = True
            logger.info("Starting real-time data collection...")
            
            # 삼성전자 실시간 시세 조회
            while self.is_running:
                try:
                    # 현재가 조회 (정수값으로 반환됨)
                    current_price = self.kis_client.get_kr_current_price("005930")
                    
                    # 현재 시간
                    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    
                    # 데이터 가공
                    data = {
                        "symbol": "005930",
                        "price": current_price,  # 직접 정수값 사용
                        "timestamp": now
                    }
                    
                    # Redis에 저장
                    self.redis_client.set("stock:005930", json.dumps(data))
                    
                    # Spring 서버로 전송
                    try:
                        requests.post(SPRING_API_URL, json=data)
                    except requests.exceptions.RequestException as e:
                        logger.error(f"Failed to send data to Spring server: {e}")
                    
                    # 로그 출력
                    logger.info(f"[{now}] 삼성전자 현재가: {data['price']}원")
                    
                    # 1초 대기
                    time.sleep(1)
                    
                except Exception as e:
                    logger.error(f"Error during data collection: {e}")
                    time.sleep(5)  # 에러 발생시 5초 대기 후 재시도
                    
        except KeyboardInterrupt:
            logger.info("Stopping real-time data collection...")
            self.stop()
            
    def stop(self):
        """실시간 데이터 수집 중지"""
        self.is_running = False
        logger.info("Real-time data collection stopped.")

if __name__ == "__main__":
    stock_realtime = StockRealtime()
    stock_realtime.start() 