import os
import json
import time
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv
import requests
import pymongo
from pymongo import MongoClient
import pandas as pd
from typing import Union
from pandas import DataFrame, Series

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

# 토큰 파일 경로 설정
TOKEN_FILE = os.path.join(os.path.dirname(__file__), 'kis_token.json')

class StockDataCollector:
    def __init__(self):
        # 환경 변수 로드 (.env 파일에서)
        load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'BE', '.env'))
        
        # API 키 설정
        self.app_key = os.getenv('KIS_APP_KEY')
        self.app_secret = os.getenv('KIS_APP_SECRET')
        
        if not self.app_key or not self.app_secret:
            raise ValueError("KIS_APP_KEY와 KIS_APP_SECRET이 필요합니다.")
        
        # MongoDB 연결
        self._connect_mongodb()
        
        # API 설정
        self.base_url = "https://openapi.koreainvestment.com:9443"  # 실제 운영 서버
        self.access_token = None
        self.token_expires_at = None
        
        # 토큰 초기화
        self._ensure_valid_token()

    def _connect_mongodb(self):
        """MongoDB 연결 및 초기 설정"""
        try:
            # 인증 정보와 함께 연결
            self.mongo_client = MongoClient(
                'mongodb://stockr:stockr123!@localhost:27017/',
                serverSelectionTimeoutMS=5000,
                directConnection=True
            )
            
            # 연결 테스트
            self.mongo_client.admin.command('ping')
            
            self.db = self.mongo_client['stock_db']
            self.collection = self.db['stock_prices']
            
            # 기본 인덱스 생성 시도
            self._create_indexes()
            
            logger.info("MongoDB 연결 및 초기 설정 완료")
            
        except Exception as e:
            logger.error(f"MongoDB 연결 실패: {e}")
            raise

    def _create_indexes(self):
        """인덱스 생성"""
        try:
            # 복합 인덱스 생성
            self.collection.create_index(
                [("ticker", 1), ("date", 1), ("interval", 1)],
                unique=True,
                background=True
            )
            logger.info("인덱스 생성 완료")
        except Exception as e:
            logger.warning(f"인덱스 생성 실패 (무시하고 진행): {e}")
            
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
            headers = {'Content-Type': 'application/json'}
            data = {
                'grant_type': 'client_credentials',
                'appkey': self.app_key,
                'appsecret': self.app_secret
            }
            
            logger.info("KIS API에서 새로운 토큰을 발급받는 중...")
            response = requests.post(f"{self.base_url}/oauth2/tokenP", headers=headers, json=data)
            
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
        """유효한 토큰 확보"""
        self.access_token, self.token_expires_at = self._load_saved_token()
        
        if not self.access_token:
            self.access_token, self.token_expires_at = self._get_new_token()
            self._save_token(self.access_token, self.token_expires_at)

    def _refresh_token_if_needed(self):
        """토큰 갱신이 필요한지 확인하고 갱신"""
        if not self.token_expires_at or datetime.now() >= self.token_expires_at:
            logger.info("토큰 갱신이 필요합니다.")
            self.access_token, self.token_expires_at = self._get_new_token()
            self._save_token(self.access_token, self.token_expires_at)

    def get_stock_data(self, stock_code, period_type='D'):
        """주가 데이터 수집
        Args:
            stock_code (str): 종목 코드
            period_type (str): 'D' (일봉), 'W' (주봉), 'M' (월봉)
        """
        self._refresh_token_if_needed()
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365 * 3)
        
        headers = {
            'authorization': f'Bearer {self.access_token}',
            'appkey': self.app_key,
            'appsecret': self.app_secret,
            'tr_id': 'FHKST01010400',  # 국내주식기간별시세(일/주/월/년)
            'content-type': 'application/json'
        }
        
        logger.info(f"\n=== {period_type}봉 데이터 수집 시작 ===")
        logger.info(f"종목코드: {stock_code}")
        
        all_data = []
        current_date = start_date
        
        while current_date <= end_date:
            next_date = min(current_date + timedelta(days=99), end_date)
            
            params = {
                'FID_COND_MRKT_DIV_CODE': 'J',
                'FID_INPUT_ISCD': stock_code,
                'FID_INPUT_DATE_1': current_date.strftime('%Y%m%d'),
                'FID_INPUT_DATE_2': next_date.strftime('%Y%m%d'),
                'FID_PERIOD_DIV_CODE': period_type,  # D:일봉, W:주봉, M:월봉
                'FID_ORG_ADJ_PRC': '0'
            }
            
            logger.info(f"조회 기간: {current_date.strftime('%Y-%m-%d')} ~ {next_date.strftime('%Y-%m-%d')}")
            
            try:
                response = requests.get(
                    f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-daily-price",
                    headers=headers,
                    params=params
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('rt_cd') == '0':
                        output_data = data.get('output', [])
                        all_data.extend(output_data)
                        logger.info(f"데이터 수집 완료: {len(output_data)}건")
                    else:
                        logger.error(f"API 오류: {data.get('msg1', '')}")
                else:
                    logger.error(f"API 요청 실패: {response.status_code}")
                    
            except Exception as e:
                logger.error(f"데이터 조회 중 오류: {e}")
            
            time.sleep(1)
            current_date = next_date + timedelta(days=1)
            
        return all_data

    def save_price_data(self, ticker, period_type, data):
        """가격 데이터 저장
        Args:
            ticker (str): 종목 코드
            period_type (str): 'daily', 'weekly', 'monthly'
            data (list): API로부터 받은 데이터
        """
        if not data:
            logger.warning(f"{period_type} 데이터가 없습니다.")
            return
            
        try:
            # 새 데이터 준비
            documents = []
            for row in data:
                doc = {
                    'ticker': ticker,
                    'date': datetime.strptime(row['stck_bsop_date'], '%Y%m%d'),
                    'interval': period_type,
                    'open': float(row['stck_oprc']),
                    'high': float(row['stck_hgpr']),
                    'low': float(row['stck_lwpr']),
                    'close': float(row['stck_clpr']),
                    'volume': float(row['acml_vol'])
                }
                
                # upsert 수행 (있으면 업데이트, 없으면 삽입)
                self.collection.update_one(
                    {
                        'ticker': ticker,
                        'date': doc['date'],
                        'interval': period_type
                    },
                    {'$set': doc},
                    upsert=True
                )
                documents.append(doc)
            
            if documents:
                logger.info(f"{period_type} 데이터 {len(documents)}건 저장/업데이트 완료")
                
                # 저장된 데이터 통계 출력
                first_date = min(doc['date'] for doc in documents)
                last_date = max(doc['date'] for doc in documents)
                logger.info(f"기간: {first_date.strftime('%Y-%m-%d')} ~ {last_date.strftime('%Y-%m-%d')}")
                
        except Exception as e:
            logger.error(f"{period_type} 데이터 저장 중 오류 발생: {e}")
            raise

    def calculate_weekly_monthly_data(self, daily_data) -> tuple[Union[DataFrame, Series], Union[DataFrame, Series]]:
        """일봉 데이터로 주봉, 월봉 계산"""
        if not daily_data:
            return pd.DataFrame(), pd.DataFrame()  # 빈 DataFrame 반환
            
        df = pd.DataFrame(daily_data)
        df['date'] = pd.to_datetime(df['stck_bsop_date'])
        
        # 숫자형으로 변환
        numeric_columns = ['stck_oprc', 'stck_hgpr', 'stck_lwpr', 'stck_clpr', 'acml_vol']
        for col in numeric_columns:
            df[col] = pd.to_numeric(df[col])
        
        # 주봉 계산
        weekly: Union[DataFrame, Series] = df.resample('W', on='date').agg({
            'stck_oprc': 'first',  # 시가
            'stck_hgpr': 'max',    # 고가
            'stck_lwpr': 'min',    # 저가
            'stck_clpr': 'last',   # 종가
            'acml_vol': 'sum'      # 거래량
        }).dropna()
        
        # 월봉 계산
        monthly: Union[DataFrame, Series] = df.resample('M', on='date').agg({
            'stck_oprc': 'first',
            'stck_hgpr': 'max',
            'stck_lwpr': 'min',
            'stck_clpr': 'last',
            'acml_vol': 'sum'
        }).dropna()
        
        return weekly, monthly

    def save_data(self, ticker, daily_data):
        """데이터 MongoDB 저장"""
        if not daily_data:
            logger.warning("저장할 데이터가 없습니다.")
            return
            
        try:
            # 기존 데이터 삭제
            self.collection.delete_many({'ticker': ticker})
            
            # 일봉 데이터 저장
            daily_documents = [{
                'ticker': ticker,
                'date': datetime.strptime(row['stck_bsop_date'], '%Y%m%d'),
                'interval': 'daily',
                'open': float(row['stck_oprc']),
                'high': float(row['stck_hgpr']),
                'low': float(row['stck_lwpr']),
                'close': float(row['stck_clpr']),
                'volume': float(row['acml_vol'])
            } for row in daily_data]
            
            # 주봉, 월봉 계산
            weekly: Union[DataFrame, Series]
            monthly: Union[DataFrame, Series]
            weekly, monthly = self.calculate_weekly_monthly_data(daily_data)
            
            # 주봉 데이터 준비
            weekly_documents = []
            for date, row in weekly.iterrows():
                weekly_documents.append({
                    'ticker': ticker,
                    'date': date,
                    'interval': 'weekly',
                    'open': float(row['stck_oprc']),
                    'high': float(row['stck_hgpr']),
                    'low': float(row['stck_lwpr']),
                    'close': float(row['stck_clpr']),
                    'volume': float(row['acml_vol'])
                })
            
            # 월봉 데이터 준비
            monthly_documents = []
            for date, row in monthly.iterrows():
                monthly_documents.append({
                    'ticker': ticker,
                    'date': date,
                    'interval': 'monthly',
                    'open': float(row['stck_oprc']),
                    'high': float(row['stck_hgpr']),
                    'low': float(row['stck_lwpr']),
                    'close': float(row['stck_clpr']),
                    'volume': float(row['acml_vol'])
                })
            
            # 데이터 저장
            if daily_documents:
                self.collection.insert_many(daily_documents)
            if weekly_documents:
                self.collection.insert_many(weekly_documents)
            if monthly_documents:
                self.collection.insert_many(monthly_documents)
            
            # 저장된 데이터 통계 출력
            self._print_data_statistics(ticker)
            
        except Exception as e:
            logger.error(f"데이터 저장 중 오류 발생: {e}")
            raise

    def _print_data_statistics(self, ticker):
        """저장된 데이터 통계 출력"""
        try:
            for interval in ['daily', 'weekly', 'monthly']:
                count = self.collection.count_documents({'ticker': ticker, 'interval': interval})
                
                if count > 0:
                    first_doc = self.collection.find_one(
                        {'ticker': ticker, 'interval': interval},
                        sort=[('date', 1)]
                    )
                    
                    last_doc = self.collection.find_one(
                        {'ticker': ticker, 'interval': interval},
                        sort=[('date', -1)]
                    )
                    
                    if first_doc and last_doc:
                        logger.info(f"{interval} 데이터:")
                        logger.info(f"- 데이터 수: {count}건")
                        logger.info(f"- 기간: {first_doc['date'].strftime('%Y-%m-%d')} ~ {last_doc['date'].strftime('%Y-%m-%d')}")
                    
        except Exception as e:
            logger.warning(f"통계 출력 중 오류 발생: {e}")

    def get_chart_data(self, ticker, interval, start_date=None, end_date=None):
        """차트 데이터 조회"""
        try:
            query = {
                'ticker': ticker,
                'interval': interval
            }
            
            if start_date or end_date:
                query['date'] = {}
                if start_date:
                    query['date']['$gte'] = start_date
                if end_date:
                    query['date']['$lte'] = end_date
            
            data = self.collection.find(query).sort('date', 1)
            
            chart_data = {
                'dates': [],
                'prices': {
                    'open': [],
                    'high': [],
                    'low': [],
                    'close': []
                },
                'volume': []
            }
            
            for doc in data:
                chart_data['dates'].append(doc['date'])
                chart_data['prices']['open'].append(doc['open'])
                chart_data['prices']['high'].append(doc['high'])
                chart_data['prices']['low'].append(doc['low'])
                chart_data['prices']['close'].append(doc['close'])
                chart_data['volume'].append(doc['volume'])
            
            return chart_data
            
        except Exception as e:
            logger.error(f"차트 데이터 조회 중 오류 발생: {e}")
            return None

def collect_samsung_data():
    """삼성전자 데이터 수집"""
    try:
        collector = StockDataCollector()
        ticker = "005930"  # 삼성전자
        
        # 일봉/주봉/월봉 데이터 수집 및 저장
        period_types = [
            ('D', 'daily'),
            ('W', 'weekly'),
            ('M', 'monthly')
        ]
        
        for api_type, db_type in period_types:
            logger.info(f"\n=== 삼성전자 {db_type} 데이터 수집 시작 ===")
            data = collector.get_stock_data(ticker, api_type)
            if data:
                collector.save_price_data(ticker, db_type, data)
                logger.info(f"=== 삼성전자 {db_type} 데이터 처리 완료 ===\n")
            else:
                logger.error(f"삼성전자 {db_type} 데이터 수집 실패")
                
    except Exception as e:
        logger.error(f"오류 발생: {e}")
    finally:
        if 'collector' in locals():
            collector.mongo_client.close()

if __name__ == "__main__":
    collect_samsung_data() 