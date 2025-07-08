import os
import json
import logging
from datetime import datetime
import requests
from kafka import KafkaProducer
from stock_realtime import StockRealtime, KIS_BASE_URL

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class KISTradeService:
    def __init__(self):
        self.realtime = StockRealtime()  # 기존 실시간 처리 클래스 활용
        self.producer = KafkaProducer(
            bootstrap_servers=['localhost:19092'],
            value_serializer=lambda x: json.dumps(x).encode('utf-8')
        )
        
    def create_order(self, order_request):
        """주문 생성"""
        try:
            # 토큰 유효성 확인
            self.realtime._ensure_valid_token()
            
            # 주문 API 엔드포인트
            url = f"{KIS_BASE_URL}/uapi/domestic-stock/v1/trading/order-cash"
            
            # 계좌번호 검증 및 분리
            if not order_request['accountId'] or len(order_request['accountId']) != 10:
                return {
                    'status': 'error',
                    'message': '유효하지 않은 계좌번호입니다. 계좌번호는 10자리여야 합니다.'
                }
            
            # 계좌번호 분리 (앞 8자리: CANO, 뒤 2자리: ACNT_PRDT_CD)
            cano = order_request['accountId'][:8]
            acnt_prdt_cd = order_request['accountId'][8:]
            
            # 주문 데이터 준비
            body = {
                "CANO": cano,  # 계좌번호 앞 8자리
                "ACNT_PRDT_CD": acnt_prdt_cd,  # 계좌번호 뒤 2자리
                "PDNO": order_request['stockCode'],  # 종목코드
                "ORD_DVSN": "00",  # 주문구분 (00: 지정가)
                "ORD_QTY": str(order_request['quantity']),  # 주문수량
                "ORD_UNPR": str(order_request['price']),  # 주문단가
                "CTAC_TLNO": "",  # 연락전화번호
                "SLL_BUY_DVSN_CD": "01" if order_request['orderType'] == 'BUY' else "02",  # 매매구분 (01: 매수, 02: 매도)
                "ALGO_NO": ""  # 알고리즘 번호
            }
            
            # 헤더 준비
            headers = {
                "Content-Type": "application/json",
                "authorization": f"Bearer {self.realtime.access_token}",
                "appKey": self.realtime.app_key,
                "appSecret": self.realtime.app_secret,
                "tr_id": "VTTC0802U" if order_request['orderType'] == 'BUY' else "VTTC0801U"  # 매수/매도 거래 ID
            }
            
            # API 호출
            response = requests.post(url, headers=headers, data=json.dumps(body))
            response_data = response.json()
            
            if response.status_code == 200 and response_data.get('rt_cd') == '0':
                order_result = {
                    'status': 'success',
                    'kisOrderId': response_data.get('output', {}).get('ODNO', ''),  # 주문번호
                    'message': response_data.get('msg1', '주문이 성공적으로 접수되었습니다.')
                }
                
                # Kafka로 주문 결과 전송
                self.producer.send('order-events', {
                    'type': 'ORDER_CREATED',
                    'orderId': order_request['orderId'],
                    'kisOrderId': order_result['kisOrderId'],
                    'status': 'PENDING'
                })
                
                return order_result
            else:
                error_message = response_data.get('msg1', '알 수 없는 오류가 발생했습니다.')
                logger.error(f"주문 실패: {error_message}")
                return {
                    'status': 'error',
                    'message': error_message
                }
                
        except Exception as e:
            logger.error(f"주문 처리 중 오류 발생: {e}")
            return {
                'status': 'error',
                'message': str(e)
            }
            
    def setup_execution_websocket(self):
        """체결 웹소켓 설정"""
        # TODO: 체결 웹소켓 구현
        pass 