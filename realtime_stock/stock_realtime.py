import os
import json
import time
import redis
import logging
import requests
from datetime import datetime
from dotenv import load_dotenv
import pykis
import websocket
import threading

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 환경 변수 로드 (BE 폴더의 .env 파일)
env_path = os.path.join(os.path.dirname(__file__), '..', 'BE', '.env')
load_dotenv(env_path)

# Redis 설정 (로컬 테스트용)
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')  # 로컬호스트로 기본값 설정
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
WEBSOCKET_URL = os.getenv('WEBSOCKET_URL', 'ws://localhost:8080/ws/websocket')
TOKEN_FILE = os.path.join(os.path.dirname(__file__), 'kis_token.json')

# KIS API 설정
KIS_BASE_URL = "https://openapivts.koreainvestment.com:29443"  # 모의투자 서버
KIS_TOKEN_URL = f"{KIS_BASE_URL}/oauth2/tokenP"
KIS_CURRENT_PRICE_URL = f"{KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price"

class StockRealtime:
    def __init__(self):
        self._validate_env_vars()
        self.app_key = os.getenv('KIS_APP_KEY')
        self.app_secret = os.getenv('KIS_APP_SECRET')
        self.access_token = None
        self.token_expires_at = None
        
        # 토큰 로드 또는 새로 발급
        self._ensure_valid_token()
        
        self.redis_client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            decode_responses=True
        )
        self.is_running = False
        self.ws = None
        self._initialize_websocket()
        
    def _validate_env_vars(self):
        """환경 변수 유효성 검사"""
        required_vars = {
            'KIS_APP_KEY': os.getenv('KIS_APP_KEY'),
            'KIS_APP_SECRET': os.getenv('KIS_APP_SECRET')
        }
        
        missing_vars = [var for var, value in required_vars.items() if not value]
        if missing_vars:
            raise ValueError(f"필수 환경 변수가 누락되었습니다: {', '.join(missing_vars)}")
            
    def _load_saved_token(self):
        """저장된 토큰 불러오기"""
        try:
            if os.path.exists(TOKEN_FILE):
                with open(TOKEN_FILE, 'r', encoding='utf-8') as f:
                    token_data = json.load(f)
                    
                    expires_at = datetime.fromisoformat(token_data.get('expires_at', ''))
                    
                    # 토큰이 아직 유효한지 확인 (만료 10분 전까지 사용)
                    if datetime.now() < expires_at:
                        logger.info("기존 토큰을 사용합니다.")
                        return token_data.get('access_token'), expires_at
                    else:
                        logger.info("저장된 토큰이 만료되었습니다.")
                        
        except Exception as e:
            logger.error(f"토큰 로드 중 오류 발생: {e}")
            
        return None, None
        
    def _get_new_token(self):
        """새로운 토큰 발급"""
        try:
            headers = {
                'Content-Type': 'application/json'
            }
            
            data = {
                'grant_type': 'client_credentials',
                'appkey': self.app_key,
                'appsecret': self.app_secret
            }
            
            logger.info("KIS API에서 새로운 토큰을 발급받는 중...")
            response = requests.post(KIS_TOKEN_URL, headers=headers, json=data)
            
            if response.status_code == 200:
                token_info = response.json()
                access_token = token_info.get('access_token')
                expires_in = token_info.get('expires_in', 86400)  # 기본 24시간
                
                # 만료 시간 계산 (현재 시간 + expires_in 초)
                expires_at = datetime.now().timestamp() + expires_in
                expires_at_dt = datetime.fromtimestamp(expires_at)
                
                logger.info(f"토큰 발급 성공! 만료 시간: {expires_at_dt}")
                
                return access_token, expires_at_dt
            else:
                logger.error(f"토큰 발급 실패: {response.status_code} - {response.text}")
                raise Exception(f"토큰 발급 실패: {response.text}")
                
        except Exception as e:
            logger.error(f"토큰 발급 중 오류 발생: {e}")
            raise

    def _save_token(self, access_token, expires_at):
        """토큰 저장"""
        try:
            token_data = {
                'access_token': access_token,
                'expires_at': expires_at.isoformat(),
                'saved_at': datetime.now().isoformat()
            }
            
            with open(TOKEN_FILE, 'w', encoding='utf-8') as f:
                json.dump(token_data, f, indent=2, ensure_ascii=False)
                
            logger.info(f"토큰이 {TOKEN_FILE}에 저장되었습니다.")
            
        except Exception as e:
            logger.error(f"토큰 저장 중 오류 발생: {e}")
            
    def _ensure_valid_token(self):
        """유효한 토큰 확보 (기존 토큰 사용 또는 새로 발급)"""
        # 먼저 저장된 토큰 확인
        self.access_token, self.token_expires_at = self._load_saved_token()
        
        # 토큰이 없거나 만료된 경우 새로 발급
        if not self.access_token:
            self.access_token, self.token_expires_at = self._get_new_token()
            self._save_token(self.access_token, self.token_expires_at)
            
    def _refresh_token_if_needed(self):
        """토큰 갱신이 필요한지 확인하고 갱신"""
        if not self.token_expires_at or datetime.now() >= self.token_expires_at:
            logger.info("토큰 갱신이 필요합니다.")
            self.access_token, self.token_expires_at = self._get_new_token()
            self._save_token(self.access_token, self.token_expires_at)
            
    def get_current_price(self, stock_code):
        """종목 현재가 조회 (KIS API 직접 호출)"""
        self._refresh_token_if_needed()
        
        try:
            headers = {
                'Content-Type': 'application/json',
                'authorization': f'Bearer {self.access_token}',
                'appkey': self.app_key,
                'appsecret': self.app_secret,
                'tr_id': 'FHKST01010100'
            }
            
            params = {
                'fid_cond_mrkt_div_code': 'J',
                'fid_input_iscd': stock_code,
            }
            
            response = requests.get(KIS_CURRENT_PRICE_URL, headers=headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('rt_cd') == '0':  # 성공
                    output = data.get('output', {})
                    current_price = int(output.get('stck_prpr', 0))  # 현재가
                    volume = int(output.get('acml_vol', 0))  # 누적거래량
                    
                    return {
                        'price': current_price,
                        'volume': volume,
                        'status': 'success'
                    }
                else:
                    logger.error(f"API 오류: {data.get('msg1', 'Unknown error')}")
                    return {'status': 'error', 'message': data.get('msg1', 'Unknown error')}
            else:
                logger.error(f"HTTP 오류: {response.status_code} - {response.text}")
                return {'status': 'error', 'message': f'HTTP {response.status_code}'}
                
        except Exception as e:
            logger.error(f"현재가 조회 중 오류 발생: {e}")
            return {'status': 'error', 'message': str(e)}
        
    def _initialize_websocket(self):
        """WebSocket 연결 초기화"""
        def on_message(ws, message):
            logger.info(f"수신 메시지: {message}")

        def on_error(ws, error):
            logger.error(f"WebSocket 오류: {error}")

        def on_close(ws, close_status_code, close_msg):
            logger.info("WebSocket 연결 종료")

        def on_open(ws):
            logger.info("WebSocket 연결 성공")
            # STOMP 프로토콜 연결
            connect_frame = "CONNECT\naccept-version:1.2\n\n\x00"
            ws.send(connect_frame)

        self.ws = websocket.WebSocketApp(
            WEBSOCKET_URL,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close,
            on_open=on_open
        )
        
        # WebSocket 연결을 별도 스레드에서 실행
        websocket_thread = threading.Thread(target=self.ws.run_forever)
        websocket_thread.daemon = True
        websocket_thread.start()

    def send_stock_data(self, data):
        """WebSocket을 통해 데이터 전송"""
        if self.ws and self.ws.sock and self.ws.sock.connected:
            try:
                # STOMP 메시지 전송 프레임 구성
                send_frame = f"SEND\ndestination:/app/stock/price\ncontent-type:application/json\n\n{json.dumps(data)}\x00"
                self.ws.send(send_frame)
                logger.info("WebSocket으로 데이터 전송 완료")
            except Exception as e:
                logger.warning(f"WebSocket 데이터 전송 실패: {e}")
        else:
            # WebSocket 연결이 안 되어도 데이터 수집은 계속 진행
            logger.debug("WebSocket이 연결되지 않았습니다. (데이터 수집은 계속 진행)")

    def start(self):
        """실시간 데이터 수집 시작"""
        try:
            self.is_running = True
            logger.info("실시간 데이터 수집을 시작합니다...")
            
            while self.is_running:
                try:
                    # 삼성전자 현재가 조회
                    result = self.get_current_price("005930")
                    
                    if result['status'] == 'success':
                        # 현재 시간
                        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        
                        # 데이터 가공
                        data = {
                            "ticker": "005930",
                            "stockCode": "005930",
                            "price": result['price'],
                            "volume": result['volume'],
                            "timestamp": int(time.time() * 1000)
                        }
                        
                        # WebSocket으로 데이터 전송 (Spring에서 Redis 저장)
                        self.send_stock_data(data)
                        
                        # 로그 출력
                        logger.info(f"[{now}] 삼성전자 현재가: {result['price']:,}원, 거래량: {result['volume']:,}")
                    else:
                        logger.error(f"데이터 조회 실패: {result.get('message', 'Unknown error')}")
                    
                    # 1초 대기
                    time.sleep(1)
                    
                except Exception as e:
                    logger.error(f"데이터 수집 중 오류 발생: {e}")
                    time.sleep(5)  # 오류 발생시 5초 대기 후 재시도
                    
        except KeyboardInterrupt:
            logger.info("실시간 데이터 수집을 중지합니다...")
            self.stop()
            
    def stop(self):
        """실시간 데이터 수집 중지"""
        self.is_running = False
        if self.ws:
            self.ws.close()
        logger.info("실시간 데이터 수집이 중지되었습니다.")

if __name__ == "__main__":
    stock_realtime = StockRealtime()
    stock_realtime.start() 