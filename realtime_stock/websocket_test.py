import json
import time
import websocket
import random
try:
    import thread
except ImportError:
    import _thread as thread

def on_message(ws, message):
    print(f"메시지 수신: {message}")

def on_error(ws, error):
    print(f"에러 발생: {error}")

def on_close(ws, close_status_code, close_msg):
    print("연결 종료")

def generate_stock_price(base_price, volatility=0.02):
    """기준 가격에서 변동성을 반영한 새 가격 생성"""
    change = random.uniform(-volatility, volatility)
    new_price = int(base_price * (1 + change))
    # 100원 단위로 조정
    return (new_price // 100) * 100

def on_open(ws):
    def run(*args):
        print("연결 성공!")
        
        # STOMP 연결 프레임 전송
        connect_frame = "CONNECT\naccept-version:1.2\n\n\x00"
        ws.send(connect_frame)
        print("STOMP 연결 요청 전송")
        
        # STOMP 구독 프레임 전송
        subscribe_frame = "SUBSCRIBE\nid:sub-0\ndestination:/topic/price\n\n\x00"
        ws.send(subscribe_frame)
        print("STOMP 구독 요청 전송")
        
        # 초기 가격 설정
        base_price = 70000  # 삼성전자 기준가
        current_price = base_price
        
        try:
            while True:
                # 새로운 가격 생성
                current_price = generate_stock_price(current_price)
                
                # 테스트 데이터 준비
                test_data = {
                    "ticker": "005930",      # ticker 필드 사용
                    "stockCode": "005930",   # stockCode도 동일하게 설정
                    "price": current_price,  # 정수형 가격
                    "volume": 100000,        # 정수형 거래량
                    "timestamp": int(time.time() * 1000)
                }
                
                # STOMP 메시지 전송 프레임 구성
                send_frame = f"SEND\ndestination:/app/stock/price\ncontent-type:application/json\n\n{json.dumps(test_data)}\x00"
                ws.send(send_frame)
                print(f"전송: 삼성전자 현재가 {current_price:,}원")
                
                # 1초 대기
                time.sleep(1)
                
        except Exception as e:
            print(f"데이터 전송 중 에러 발생: {e}")
    
    thread.start_new_thread(run, ())

def main():
    websocket.enableTrace(True)
    ws = websocket.WebSocketApp(
        "ws://localhost:8080/ws/websocket",
        on_message=on_message,
        on_error=on_error,
        on_close=on_close,
        on_open=on_open
    )
    
    print("서버에 연결 시도 중...")
    ws.run_forever()

if __name__ == "__main__":
    main() 