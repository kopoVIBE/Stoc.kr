import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler
# from tensorflow.keras.models import load_model  # 기존 방식 주석 처리
from loadModel import load_model_safely  # 커스텀 로더 사용
import requests
import re
import io
import time
from datetime import datetime, timedelta
import yfinance as yf
import warnings
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
import json
warnings.filterwarnings('ignore')

# ==============================================================================
# ✅ 1. 설정
# ==============================================================================

# 예측 대상 종목 리스트 (predict.py에서 가져옴)
stock_name_list = ['하이트진로', '유한양행', 'CJ대한통운', 'DL', '한국앤컴퍼니', '기아', '노루홀딩스', '한화손해보험', '가온전선', '동아쏘시오홀딩스', 'SK하이닉스', '삼성화재', '한화', 'DB하이텍', 'CJ', 'LX인터내셔널', '세아베스틸지주', '대한전선', '현대해상', '대상', 'SK네트웍스', '알루코', '오리온홀딩스', '삼화콘덴서', '넥센타이어', 'KCC', 'HS화성', 'TCC스틸', '아모레퍼시픽홀딩스', '세아제강지주', '코오롱글로벌', '대웅', '디아이', '대원제약', '삼양식품', '하림지주', '대한항공', '대신증권', 'LG', '코리안리', '보령', '롯데정밀화학', '한국석유', '한솔홀딩스', '신세계', '농심', '효성', '코스모신소재', 'SGC에너지', '빙그레', '롯데칠성', '현대차', '현대지에프홀딩스', 'POSCO홀딩스', '삼진제약', 'SPC삼립', '삼영전자', '파미셀', '풍산홀딩스', 'DB손해보험', '에스엘', '대한해운', '삼성전자', 'NH투자증권', '동원산업', 'LS', 'GS건설', '삼성SDI', '서부T&D', '미래에셋증권', 'GS리테일', '벽산', '오뚜기', '이수페타시스', '국도화학', '서흥', '삼성전기', '한샘', '경동나비엔', '삼화전기', 'HD한국조선해양', '무림P&P', '명신산업', 'OCI홀딩스', 'LS ELECTRIC', '고려아연', '삼성중공업', 'HD현대미포', '화신', 'LG이노텍', 'HMM', '현대위아', '현대코퍼레이션', '금호석유화학', '현대모비스', '한화에어로스페이스', '더존비즈온', 'HDC', '에스원', '동원개발', '계룡건설', '성광벤드', '한솔케미칼', 'HL D&I', '동원시스템즈', '유니드', '한국전력', '삼성증권', '우신시스템', 'SK텔레콤', '현대엘리베이터', '풀무원', 'E1', '한국카본', '애경산업', '삼성에스디에스', '브이티', 'SK가스', '대교', '한섬', '코웨이', 'KCC건설', '대한약품', '기업은행', '한국단자', 'BGF', '삼성E&A', '삼성물산', '팬오션', '삼성카드', '제일기획', 'NICE평가정보', 'KT', '한글과컴퓨터', '신세계인터내셔날', '신세계푸드', '피에스케이홀딩스', 'LG유플러스', '삼성생명', '자화전자', '유나이티드제약', '동성화인텍', 'KT&G', '두산에너빌리티', 'SBS', '파라다이스', '백산', '강원랜드', 'NAVER', 'KG이니시스', '카카오', 'JYP Ent.', '유니셈', '한국가스공사', 'SNT홀딩스', 'SFA반도체', '엔씨소프트', '감성코퍼레이션', '나이스정보통신', '진성티이씨', '주성엔지니어링', '삼표시멘트', '이오테크닉스', '하나투어', '오스코텍', '에스티아이', '키움증권', 'HDC랩스', '에스엠', '인바디', '카페24', '라온시큐어', '한화오션', 'HD현대인프라코어', '한미반도체', '바텍', '피에이치에이', '태웅', 'KG모빌리언스', '대우건설', '포스코인터내셔널', '한국항공우주', '인탑스', '동원F&B', '쏠리드', '토비스', '인터플렉스', 'CJ프레시웨이', '한전KPS', 'LG생활건강', '한전기술', '케이엔솔', '세코닉스', '웹케시', '프로텍', '한미글로벌', '제이브이엠', '신한지주', '현대홈쇼핑', '포스코스틸리온', '리노공업', '에스피지', '세아홀딩스', '엠로', 'NHN KCP', 'KH바텍', 'HL홀딩스', '산일전기', 'NICE인프라', '현대로템', '티씨케이', 'SNT모티브', 'LG전자', 'SOOP', '셀트리온', '디지털대성', '웹젠', 'TKG휴켐스', '대웅제약', '모나용평', '한국금융지주', '지역난방공사', 'HD현대마린엔진', '금호타이어', '이노와이어리스', '원익QnC', '세진중공업', 'STX엔진', '대주전자재료', 'GS', '제우스', '현대리바트', 'LIG넥스원', '전진건설로봇', '모두투어', '코디', '미스토홀딩스', '동양생명', '한화엔진', '비츠로셀', '비에이치아이', '대한제강', '유진테크', '아이티엠반도체', '미래에셋생명', '뉴프렉스', '현대글로비스', '동국제약', '선진뷰티사이언스', '하나금융지주', '메디톡스', '한화생명', '제주항공', '롯데렌탈', '아모레퍼시픽', '비에이치', '파트론', '이크레더블', '네오팜', '케이아이엔엑스', '매커스', '칩스앤미디어', 'ISC', 'AJ네트웍스', '테스', '네오위즈', '엠씨넥스', 'CJ제일제당', '고영', '쎄트렉아이', '바이오플러스', 'SK오션플랜트', '뷰웍스', 'SNT에너지', '풍산', '일진전기', '한국철강', '원익머트리얼즈', 'KB금융', '한세실업', 'LX세미콘', '대양전기공업', 'LX하우시스', '동인기연', '영원무역', '위메이드', '씨에스윈드', 'GKL', '한솔아이원스', '아이패밀리에스씨', '지엔씨에너지', '코오롱인더', 'KX', '예스티', '와이지엔터테인먼트', '아이마켓코리아', '제닉', '코리아에프티', '한국자산신탁', '수산인더스트리', '한미약품', '나이스디앤비', '티에스이', '두산테스나', '메리츠금융지주', '코오롱ENP', 'BNK금융지주', 'iM금융지주', '파크시스템스', '리가켐바이오', '휴젤', '덴티움', '율촌', '세경하이테크', '한국타이어앤테크놀로지', '한국콜마', '핑거', '하나머티리얼즈', 'JB금융지주', '듀켐바이오', '서진시스템', 'PI첨단소재', '큐브엔터', '아세아시멘트', '코미코', '종근당', '더블유게임즈', '쿠쿠홀딩스', '드림텍', '코스맥스', '제이에스코퍼레이션', '데브시스터즈', '노바렉스', '해성디에스', 'HK이노엔', '알테오젠', '제일일렉트릭', '콜마비앤에이치', '휴메딕스', 'HL만도', '글로벌텍스프리', '엑셈', '유바이오로직스', '삼성바이오로직스', 'SK디앤디', '인카금융서비스', '덕산네오룩스', '클래시스', '헥토이노베이션', '이노션', '토니모리', '아이쓰리시스템', '파마리서치', '골프존', '메가스터디교육', 'RFHIC', '넥슨게임즈', '레이언스', 'LS에코에너지', '에코마케팅', '와이씨', '헥토파이낸셜', '슈프리마', '에스티팜', '클리오', '피엔에이치테크', '원익IPS', '두산밥캣', '화승엔터프라이즈', '코스메카코리아', '신흥에스이씨', '솔루엠', '바이오에프디엔씨', '넷마블', '펌텍코리아', '샘씨엔에스', '스튜디오드래곤', '실리콘투', '크래프톤', '에스앤디', '펄어비스', '지니언스', '크라운제과', 'HD현대', 'HD현대일렉트릭', 'HD현대건설기계', '매일유업', '오리온', '일진하이솔루스', '한화시스템', '이녹스첨단소재', '진에어', '레인보우로보틱스', '에이피알', '롯데웰푸드', '케이씨텍', 'BGF리테일', '코윈테크', 'SK케미칼', '롯데이노베이트', '하나제약', '쿠콘', 'HDC현대산업개발', '이노룰스', '효성티앤씨', '효성중공업', 'HS효성첨단소재', '한일시멘트', '동국생명과학', '마이크로디지탈', '세아제강', '현대오토에버', '애니플러스', '지오엘리먼트', '우리금융지주', '자이에스앤디', '현대무벡스', '피에스케이', 'HD현대에너지솔루션', '오로스테크놀로지', '카카오뱅크', 'SK바이오팜', 'HD현대중공업', '비올', '원텍', '젝시믹스', '교촌에프앤비', '티앤엘', '넥스틴', '씨앤씨인터내셔널', '하이브', '대덕전자', '이지바이오', '티엘비', '솔브레인', '퓨런티어', '한컴라이프케어', 'DL이앤씨', '디어유', '케이카', '지앤비에스 에코', 'F&F', 'LX홀딩스', '지투파워', '대명에너지', '넥스트바이오메디컬', 'SK스퀘어', 'HPSP', '비아이매트릭스', 'LS머트리얼즈', '트루엔', 'KT밀리의서재', '티이엠씨', 'HD현대마린솔루션', '레뷰코퍼레이션', '현대그린푸드', '동국제강', '현대힘스', '시프트업', 'SK이터닉스']

stock_code_list = ['000080', '000100', '000120', '000210', '000240', '000270', '000320', '000370', '000500', '000640', '000660', '000810', '000880', '000990', '001040', '001120', '001430', '001440', '001450', '001680', '001740', '001780', '001800', '001820', '002350', '002380', '002460', '002710', '002790', '003030', '003070', '003090', '003160', '003220', '003230', '003380', '003490', '003540', '003550', '003690', '003850', '004000', '004090', '004150', '004170', '004370', '004800', '005070', '005090', '005180', '005300', '005380', '005440', '005490', '005500', '005610', '005680', '005690', '005810', '005830', '005850', '005880', '005930', '005940', '006040', '006260', '006360', '006400', '006730', '006800', '007070', '007210', '007310', '007660', '007690', '008490', '009150', '009240', '009450', '009470', '009540', '009580', '009900', '010060', '010120', '010130', '010140', '010620', '010690', '011070', '011200', '011210', '011760', '011780', '012330', '012450', '012510', '012630', '012750', '013120', '013580', '014620', '014680', '014790', '014820', '014830', '015760', '016360', '017370', '017670', '017800', '017810', '017940', '017960', '018250', '018260', '018290', '018670', '019680', '020000', '021240', '021320', '023910', '024110', '025540', '027410', '028050', '028260', '028670', '029780', '030000', '030190', '030200', '030520', '031430', '031440', '031980', '032640', '032830', '033240', '033270', '033500', '033780', '034020', '034120', '034230', '035150', '035250', '035420', '035600', '035720', '035900', '036200', '036460', '036530', '036540', '036570', '036620', '036800', '036890', '036930', '038500', '039030', '039130', '039200', '039440', '039490', '039570', '041510', '041830', '042000', '042510', '042660', '042670', '042700', '043150', '043370', '044490', '046440', '047040', '047050', '047810', '049070', '049770', '050890', '051360', '051370', '051500', '051600', '051900', '052690', '053080', '053450', '053580', '053610', '053690', '054950', '055550', '057050', '058430', '058470', '058610', '058650', '058970', '060250', '060720', '060980', '062040', '063570', '064350', '064760', '064960', '066570', '067160', '068270', '068930', '069080', '069260', '069620', '070960', '071050', '071320', '071970', '073240', '073490', '074600', '075580', '077970', '078600', '078930', '079370', '079430', '079550', '079900', '080160', '080530', '081660', '082640', '082740', '082920', '083650', '084010', '084370', '084850', '085620', '085670', '086280', '086450', '086710', '086790', '086900', '088350', '089590', '089860', '090430', '090460', '091700', '092130', '092730', '093320', '093520', '094360', '095340', '095570', '095610', '095660', '097520', '097950', '098460', '099320', '099430', '100090', '100120', '100840', '103140', '103590', '104700', '104830', '105560', '105630', '108320', '108380', '108670', '111380', '111770', '112040', '112610', '114090', '114810', '114840', '119850', '120110', '122450', '122640', '122870', '122900', '123330', '123410', '123890', '126720', '128940', '130580', '131290', '131970', '138040', '138490', '138930', '139130', '140860', '141080', '145020', '145720', '146060', '148150', '161390', '161890', '163730', '166090', '175330', '176750', '178320', '178920', '182360', '183190', '183300', '185750', '192080', '192400', '192650', '192820', '194370', '194480', '194700', '195870', '195940', '196170', '199820', '200130', '200670', '204320', '204620', '205100', '206650', '207940', '210980', '211050', '213420', '214150', '214180', '214320', '214420', '214430', '214450', '215000', '215200', '218410', '225570', '228850', '229640', '230360', '232140', '234340', '236200', '237690', '237880', '239890', '240810', '241560', '241590', '241710', '243840', '248070', '251120', '251270', '251970', '252990', '253450', '257720', '259960', '260970', '263750', '263860', '264900', '267250', '267260', '267270', '267980', '271560', '271940', '272210', '272290', '272450', '277810', '278470', '280360', '281820', '282330', '282880', '285130', '286940', '293480', '294570', '294870', '296640', '298020', '298040', '298050', '300720', '303810', '305090', '306200', '307950', '310200', '311320', '316140', '317400', '319400', '319660', '322000', '322310', '323410', '326030', '329180', '335890', '336570', '337930', '339770', '340570', '348210', '352480', '352820', '353200', '353810', '356860', '357780', '370090', '372910', '375500', '376300', '381970', '382800', '383220', '383800', '388050', '389260', '389650', '402340', '403870', '413640', '417200', '417790', '418470', '425040', '443060', '443250', '453340', '460860', '460930', '462870', '475150']

# 예측할 종목 딕셔너리 생성
STOCKS_TO_PREDICT = dict(zip(stock_name_list, stock_code_list))

# 모델 파일 경로
MODEL_PATH = "bidirectional_lstm_model.h5"

# 윈도우 크기 (모델 훈련시와 동일해야 함)
WINDOW_SIZE = 5

# 병렬 처리 시 사용할 최대 스레드 수
MAX_WORKERS = 10

# ==============================================================================
# ✅ 2. 데이터 수집 함수
# ==============================================================================

def get_us_indices(start_date, end_date):
    """미국 지수 데이터 수집"""
    print(f"📈 미국 지수 데이터 수집 중...")
    symbols = {"S&P500": "^GSPC", "NASDAQ": "^IXIC", "DOWJONES": "^DJI"}
    
    try:
        end_date_adj = pd.to_datetime(end_date) + timedelta(days=1)
        data = yf.download(list(symbols.values()), start=start_date, end=end_date_adj, progress=False, auto_adjust=True)
        if data.empty:
            return pd.DataFrame()

        close_df = data['Close'].copy()
        pct_change = close_df.pct_change()
        pct_change_shifted = pct_change.shift(1)

        close_df.rename(columns={v: f"{k}_종가" for k, v in symbols.items()}, inplace=True)
        pct_change_shifted.rename(columns={v: f"{k}_등락률" for k, v in symbols.items()}, inplace=True)

        us_df = pd.merge(close_df, pct_change_shifted, on='Date', how='left')
        us_df.reset_index(inplace=True)
        us_df.rename(columns={'Date': '날짜'}, inplace=True)
        
        return us_df
    except Exception as e:
        print(f"⚠️ 미국 지수 데이터 수집 실패: {e}")
        return pd.DataFrame()

def get_stock_price(code, start, end):
    """한국 주식 가격 데이터 수집"""
    url = f'https://fchart.stock.naver.com/sise.nhn?timeframe=day&count=9999&requestType=0&symbol={code}'
    try:
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=5)
        r.raise_for_status()
        data_list = re.findall(r'<item data="(.*?)" />', r.text)
        if not data_list: 
            return pd.DataFrame()
        
        data = '\n'.join(data_list)
        df = pd.read_csv(io.StringIO(data), delimiter='|', header=None, dtype={0: str})
        df.columns = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
        df['Date'] = pd.to_datetime(df['Date'], format='%Y%m%d')
        df.set_index('Date', inplace=True)
        df.sort_index(inplace=True)
        
        # 등락률 계산
        df['Change'] = df['Close'].pct_change()
        
        return df.loc[start:end]
    except Exception as e:
        print(f"⚠️ {code} 주식 데이터 수집 실패: {e}")
        return pd.DataFrame()

def prepare_stock_data(stock_name, stock_code, days_back=10):
    """개별 종목의 예측용 데이터 준비"""
    print(f"📊 {stock_name}({stock_code}) 데이터 준비 중...")
    
    # 충분한 기간의 데이터 수집 (영업일 기준)
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days_back)
    
    # 한국 주식 데이터 수집
    stock_df = get_stock_price(stock_code, start_date, end_date)
    if stock_df.empty:
        print(f"❌ {stock_name} 데이터 수집 실패")
        return None
    
    # 미국 지수 데이터 수집
    us_df = get_us_indices(start_date, end_date)
    
    # 데이터 병합
    stock_df.reset_index(inplace=True)
    stock_df.rename(columns={'Date': '날짜'}, inplace=True)
    
    # 파생 변수 생성
    stock_df["gap_ratio"] = (stock_df["Close"] - stock_df["Open"]) / stock_df["Open"]
    stock_df["high_low_ratio"] = (stock_df["High"] - stock_df["Low"]) / stock_df["Open"]
    stock_df["is_bullish"] = (stock_df["Close"] > stock_df["Open"]).astype(int)
    
    # 미국 지수 데이터 병합
    if not us_df.empty:
        stock_df = pd.merge(stock_df, us_df, on='날짜', how='left')
        stock_df = stock_df.fillna(method='ffill').fillna(method='bfill')
    else:
        # 미국 지수 컬럼들을 0으로 채움
        us_cols = ['S&P500_종가', 'S&P500_등락률', 'NASDAQ_종가', 'NASDAQ_등락률', 'DOWJONES_종가', 'DOWJONES_등락률']
        for col in us_cols:
            stock_df[col] = 0
    
    # 필요한 컬럼만 선택
    feature_cols = [
        'Open', 'High', 'Low', 'Close', 'Volume', 'Change',
        'S&P500_종가', 'S&P500_등락률', 'NASDAQ_종가', 'NASDAQ_등락률', 
        'DOWJONES_종가', 'DOWJONES_등락률', 'gap_ratio', 'high_low_ratio', 'is_bullish'
    ]
    
    # 누락된 컬럼 0으로 채움
    for col in feature_cols:
        if col not in stock_df.columns:
            stock_df[col] = 0
    
    stock_df = stock_df[['날짜'] + feature_cols]
    stock_df.fillna(0, inplace=True)
    stock_df.replace([np.inf, -np.inf], 0, inplace=True)
    
    return stock_df

# ==============================================================================
# ✅ 3. 예측 함수
# ==============================================================================

def create_sequences(data, window_size=WINDOW_SIZE):
    """슬라이딩 윈도우 생성"""
    if len(data) < window_size:
        return None
    
    # 가장 최근 데이터로 시퀀스 생성
    sequence = data.iloc[-window_size:].values
    return sequence.reshape(1, window_size, -1)

def predict_stock_movement(stock_name, stock_code, model, scaler):
    """개별 종목의 상승/하락 예측"""
    try:
        # 데이터 준비
        stock_data = prepare_stock_data(stock_name, stock_code, days_back=15)
        if stock_data is None:
            return None
        
        # 특성 컬럼 선택
        feature_cols = [
            'Open', 'High', 'Low', 'Close', 'Volume', 'Change',
            'S&P500_종가', 'S&P500_등락률', 'NASDAQ_종가', 'NASDAQ_등락률', 
            'DOWJONES_종가', 'DOWJONES_등락률', 'gap_ratio', 'high_low_ratio', 'is_bullish'
        ]
        
        # 시퀀스 생성
        sequence = create_sequences(stock_data[feature_cols])
        if sequence is None:
            print(f"❌ {stock_name}: 충분한 데이터 없음 (최소 {WINDOW_SIZE}일 필요)")
            return None
        
        # 정규화
        original_shape = sequence.shape
        sequence_scaled = scaler.transform(sequence.reshape(-1, sequence.shape[-1]))
        sequence_scaled = sequence_scaled.reshape(original_shape)
        
        # 예측
        prediction_prob = model.predict(sequence_scaled, verbose=0)[0][0]
        prediction = 1 if prediction_prob > 0.5 else 0
        
        return {
            'stock_name': stock_name,
            'stock_code': stock_code,
            'prediction': prediction,
            'probability': prediction_prob,
            'confidence': abs(prediction_prob - 0.5) * 2  # 0~1 범위의 신뢰도
        }
        
    except Exception as e:
        print(f"❌ {stock_name} 예측 실패: {e}")
        return None

# ==============================================================================
# ✅ 4. 메인 실행
# ==============================================================================

def main():
    print("🚀 주가 상승/하락 예측 시작")
    print("="*60)
    
    try:
        # 모델 로드
        print("📥 모델 로드 중...")
        model = load_model_safely(MODEL_PATH)
        print("✅ 모델 로드 완료")
        
        # 스케일러 로드
        print("📥 스케일러 로드 중...")
        try:
            scaler = joblib.load('scaler.pkl')
            print("✅ 스케일러 로드 완료")
        except FileNotFoundError:
            print("❌ scaler.pkl 파일을 찾을 수 없습니다.")
            print("   make_model.py를 다시 실행해서 스케일러를 저장하세요.")
            return
        
        print(f"\n📊 총 {len(stock_name_list)}개 종목 예측 시작...")
        print("-" * 60)
        
        results = []
        
        # 병렬 처리로 모든 종목 예측
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            # 모든 종목에 대해 예측 작업 제출
            future_to_stock = {
                executor.submit(predict_stock_movement, name, code, model, scaler): (name, code)
                for name, code in zip(stock_name_list, stock_code_list)
            }
            
            # 진행률 표시와 함께 결과 수집
            for future in tqdm(as_completed(future_to_stock), total=len(future_to_stock), desc="📈 예측 진행"):
                result = future.result()
                if result:
                    results.append(result)
        
        # 예측 결과 출력
        if results:
            print(f"\n📋 예측 결과 ({len(results)}개 종목):")
            print("-" * 60)
            
            # 상승/하락 예측 분류
            up_stocks = [r for r in results if r['prediction'] == 1]
            down_stocks = [r for r in results if r['prediction'] == 0]
            
            # 상승 예측 종목들 (확률 높은 순으로 정렬)
            up_stocks.sort(key=lambda x: x['probability'], reverse=True)
            up_prediction_text = get_prediction_text(1)
            print(f"\n📈 {up_prediction_text} 종목 ({len(up_stocks)}개):")
            for i, stock in enumerate(up_stocks[:10], 1):  # 상위 10개만 표시
                print(f"{i:2d}. {stock['stock_name']}({stock['stock_code']}): {stock['probability']:.3f} (신뢰도: {stock['confidence']:.3f})")
            
            if len(up_stocks) > 10:
                print(f"    ... 및 {len(up_stocks) - 10}개 더")
            
            # 하락 예측 종목들 (확률 낮은 순으로 정렬)
            down_stocks.sort(key=lambda x: x['probability'])
            down_prediction_text = get_prediction_text(0)
            print(f"\n📉 {down_prediction_text} 종목 ({len(down_stocks)}개):")
            for i, stock in enumerate(down_stocks[:10], 1):  # 상위 10개만 표시
                print(f"{i:2d}. {stock['stock_name']}({stock['stock_code']}): {stock['probability']:.3f} (신뢰도: {stock['confidence']:.3f})")
            
            if len(down_stocks) > 10:
                print(f"    ... 및 {len(down_stocks) - 10}개 더")
            
            # 결과 요약
            print(f"\n📊 예측 결과 요약:")
            print("-" * 60)
            print(f"{up_prediction_text}: {len(up_stocks)}개 ({len(up_stocks)/len(results)*100:.1f}%)")
            print(f"{down_prediction_text}: {len(down_stocks)}개 ({len(down_stocks)/len(results)*100:.1f}%)")
            print(f"예측 실패: {len(stock_name_list) - len(results)}개")
            
            # 결과를 JSON 파일로 저장 (DB 저장용)
            db_results = []
            for result in results:
                db_results.append({
                    'stock_name': result['stock_name'],
                    'stock_code': result['stock_code'],
                    'prediction': result['prediction'],  # 1: 상승, 0: 하락
                    'predicted_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                })
            
            # JSON 파일로 저장
            with open(PREDICTION_RESULTS_PATH, 'w', encoding='utf-8') as f:
                json.dump(db_results, f, ensure_ascii=False, indent=2)
            
            print(f"\n💾 전체 결과가 '{PREDICTION_RESULTS_PATH}' 파일로 저장되었습니다.")
            print(f"📊 DB 저장용 형태: stock_code, prediction (1=상승, 0=하락)")
            
        else:
            print("\n❌ 예측 결과가 없습니다.")
            print("   데이터 수집이나 모델 로드에 문제가 있을 수 있습니다.")
            
    except Exception as e:
        print(f"❌ 예측 실행 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 