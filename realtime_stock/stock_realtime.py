import os
import json
import time
import redis
import logging
import requests
from datetime import datetime
from dotenv import load_dotenv
import websocket
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

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
REDIS_HOST = 'localhost'  # 로컬 환경에서는 무조건 localhost 사용
REDIS_PORT = 6379
REDIS_PASSWORD = 'stockr123!'
WEBSOCKET_URL = os.getenv('WEBSOCKET_URL', 'ws://localhost:8080/ws-raw')
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
        self.target_stocks_redis_key = "target_stocks"
        
        # Redis 연결 테스트
        try:
            logger.info("Redis 연결을 시도합니다...")
            self.redis_client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                password=REDIS_PASSWORD,
                decode_responses=True
            )
            # Redis 연결 테스트
            self.redis_client.ping()
            logger.info(f"Redis 연결 성공 (host: {REDIS_HOST}, port: {REDIS_PORT})")
            
            # Redis에 저장된 토큰이 있는지 확인
            redis_token = self.redis_client.get("kis_token")
            if redis_token:
                logger.info(f"Redis에 저장된 토큰: {redis_token}")
            else:
                logger.info("Redis에 저장된 토큰이 없습니다.")
                
        except redis.ConnectionError as e:
            logger.error(f"Redis 연결 실패 (host: {REDIS_HOST}): {e}")
            logger.info("파일 기반 저장소를 사용합니다.")
            self.redis_client = None
        except Exception as e:
            logger.error(f"Redis 초기화 중 예상치 못한 오류 발생: {e}")
            self.redis_client = None
            
        # Redis 연결 확인 후 토큰 로드 또는 새로 발급
        self._ensure_valid_token()
        
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
            
    def start(self):
        """실시간 데이터 수집 시작"""
        try:
            self.is_running = True
            logger.info("실시간 데이터 수집을 시작합니다...")
            
            while self.is_running:
                try:
                    stock_codes = []
                    if self.redis_client:
                        try:
                            stock_codes_from_redis = self.redis_client.smembers(self.target_stocks_redis_key)
                            if isinstance(stock_codes_from_redis, set):
                                stock_codes = list(stock_codes_from_redis)
                            else:
                                logger.warning(f"Redis smembers가 예기치 않은 타입을 반환했습니다: {type(stock_codes_from_redis)}")
                                stock_codes = []
                        except Exception as e:
                            logger.error(f"Redis에서 종목 코드 조회 중 오류 발생: {e}")
                            stock_codes = []

                    if not stock_codes:
                        logger.info("추적할 종목이 없습니다. 5초간 대기합니다.")
                        time.sleep(5)
                        continue
                    
                    logger.info(f"추적 대상 종목: {stock_codes}")
                    
                    # 병렬 처리 전에 토큰 상태 확인 (race condition 방지)
                    self._refresh_token_if_needed()

                    # ThreadPoolExecutor를 사용한 병렬 처리 - 속도 향상!
                    max_workers = min(len(stock_codes), 10)  # 최대 10개 동시 처리
                    with ThreadPoolExecutor(max_workers=max_workers) as executor:
                        # 모든 종목에 대해 병렬로 API 호출 시작
                        future_to_stock = {
                            executor.submit(self.get_current_price, stock_code): stock_code 
                            for stock_code in stock_codes
                        }
                        
                        # 완료된 것부터 순서대로 처리
                        for future in as_completed(future_to_stock):
                            if not self.is_running:
                                break
                                
                            stock_code = future_to_stock[future]
                            try:
                                result = future.result()
                                
                                if result['status'] == 'success':
                                    data = {
                                        "ticker": stock_code,
                                        "stockCode": stock_code,
                                        "price": result['price'],
                                        "volume": result['volume'],
                                        "timestamp": int(time.time() * 1000)
                                    }
                                    
                                    self.send_stock_data(data)
                                    logger.info(f"[{stock_code}] 현재가: {result['price']:,}원, 거래량: {result['volume']:,}")
                                else:
                                    logger.error(f"[{stock_code}] 데이터 조회 실패: {result.get('message', 'Unknown error')}")
                                    
                            except Exception as e:
                                logger.error(f"[{stock_code}] 병렬 처리 중 예외 발생: {e}")
                    
                    time.sleep(1)  # 전체 루프 후 1초 대기
                    
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

    def _load_saved_token(self):
        """저장된 토큰 불러오기 (파일 또는 Redis)"""
        try:
            # 1. Redis에서 먼저 확인
            if self.redis_client is not None:
                redis_token = self.redis_client.get("kis_token")
                if isinstance(redis_token, (str, bytes)):
                    token_data = json.loads(redis_token)
                    expires_at = datetime.fromisoformat(token_data.get('expires_at', ''))
                    
                    # 토큰이 아직 유효한지 확인 (만료 10분 전까지 사용)
                    if datetime.now() < expires_at:
                        logger.info("Redis에서 토큰을 불러왔습니다.")
                        return token_data.get('access_token'), expires_at
            
            # 2. 파일에서 확인
            if os.path.exists(TOKEN_FILE):
                with open(TOKEN_FILE, 'r', encoding='utf-8') as f:
                    token_data = json.load(f)
                    
                    expires_at = datetime.fromisoformat(token_data.get('expires_at', ''))
                    
                    # 토큰이 아직 유효한지 확인 (만료 10분 전까지 사용)
                    if datetime.now() < expires_at:
                        logger.info("파일에서 토큰을 불러왔습니다.")
                        
                        # 파일에서 읽은 유효한 토큰을 Redis에도 저장
                        if self.redis_client is not None:
                            try:
                                self.redis_client.set(
                                    "kis_token",
                                    json.dumps(token_data),
                                    ex=int((expires_at - datetime.now()).total_seconds())
                                )
                                logger.info("파일에서 읽은 토큰을 Redis에 저장했습니다.")
                            except Exception as e:
                                logger.error(f"Redis에 토큰 저장 실패: {e}")
                        
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
        """토큰 저장 (파일 및 Redis)"""
        try:
            # 토큰 데이터 구성
            token_data = {
                'access_token': access_token,
                'expires_at': expires_at.isoformat(),
                'saved_at': datetime.now().isoformat()
            }
            
            # 1. 파일에 저장
            with open(TOKEN_FILE, 'w', encoding='utf-8') as f:
                json.dump(token_data, f, indent=2, ensure_ascii=False)
                
            # 2. Redis에 JSON 형태로 저장 (Redis 연결이 있는 경우에만)
            if self.redis_client is not None:
                try:
                    self.redis_client.set(
                        "kis_token",  # key
                        json.dumps(token_data),  # value를 JSON 문자열로 변환
                        ex=int((expires_at - datetime.now()).total_seconds())  # 만료시간 설정
                    )
                    logger.info("토큰이 Redis에 저장되었습니다.")
                except Exception as e:
                    logger.error(f"Redis에 토큰 저장 실패: {e}")
                
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
            try:
                logger.debug(f"수신 메시지: {message}")
                # CONNECTED 프레임 확인
                if "CONNECTED" in message:
                    logger.info("STOMP 연결 성공")
                elif "MESSAGE" in message:
                    logger.debug(f"메시지 수신: {message}")
            except Exception as e:
                logger.error(f"메시지 처리 중 오류 발생: {e}")

        def on_error(ws, error):
            logger.error(f"WebSocket 오류: {error}")

        def on_close(ws, close_status_code, close_msg):
            logger.info("WebSocket 연결 종료")

        def on_open(ws):
            logger.info("WebSocket 연결 성공")
            # STOMP 프레임을 텍스트로 구성
            connect_frame = "CONNECT\naccept-version:1.2,1.1,1.0\nheart-beat:10000,10000\n\n\x00"
            ws.send(connect_frame)
            logger.info("STOMP CONNECT 프레임 전송")

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
                # STOMP SEND 프레임 구성 - 종목별 destination 사용
                body = json.dumps(data)
                stock_code = data.get('stockCode')
                if stock_code:
                    destination = f"/app/price/{stock_code}"  # 종목별 destination
                    send_frame = f"SEND\ndestination:{destination}\ncontent-type:application/json\n\n{body}\x00"
                    self.ws.send(send_frame)
                    logger.debug(f"WebSocket으로 {stock_code} 데이터 전송 완료")
                else:
                    logger.warning("종목 코드가 없는 데이터입니다.")
            except Exception as e:
                logger.warning(f"WebSocket 데이터 전송 실패: {e}")
        else:
            logger.debug("WebSocket이 연결되지 않았습니다.")

if __name__ == "__main__":
    stock_realtime = StockRealtime()
    stock_realtime.start() 