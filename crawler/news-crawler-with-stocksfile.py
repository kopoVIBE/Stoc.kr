# =================================================================
# 모든 과정을 Selenium으로 통합하여 Javascript 로딩 문제 해결
# =================================================================
import time
import json
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from datetime import datetime
import csv
import random

# Selenium 관련 라이브러리
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# 1. 수집 대상 종목 목록을 외부 CSV 파일에서 읽어오기
TARGET_STOCKS_LIST = []
try:
    with open('stocks.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            TARGET_STOCKS_LIST.append(row)
    print("✅ stocks.csv 파일 로드 성공!")
except FileNotFoundError:
    print("❌ 에러: stocks.csv 파일을 찾을 수 없습니다. 스크립트를 종료합니다.")
    exit()

# 2. WebDriver 설정 (한 번만 실행)
options = webdriver.ChromeOptions()
options.add_argument('headless')
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36")
# ★★★ 최적화 옵션 추가 ★★★
# 1. 이미지 로딩 비활성화 (가장 효과적)
options.add_experimental_option("prefs", {"profile.managed_default_content_settings.images": 2})

# 2. 불필요한 GPU 가속 비활성화
options.add_argument("--disable-gpu")

# 3. 페이지 로드 전략 변경 (DOM만 완성되면 다음으로 넘어감)
options.page_load_strategy = 'eager'
driver = webdriver.Chrome(options=options)

news_data = []
base_url = "https://finance.naver.com"

start_time = time.time()

# 3. 정의된 종목 목록을 순회
for stock in TARGET_STOCKS_LIST:
    stock_name = stock['stockName']
    stock_code = stock['stockCode']
    
    print(f"\n{'='*20} [{stock_name}] 뉴스 수집 시작 {'='*20}")
    
    try:
        stock_news_list_url = f"https://finance.naver.com/item/news.naver?code={stock_code}"
        driver.get(stock_news_list_url)
        
        # ★★★★★ 1. iframe으로 제어권 전환 ★★★★★
        # 페이지가 로딩되고 'news_frame'이라는 ID를 가진 iframe이 나타날 때까지 최대 10초 대기
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "news_frame"))
        )
        # 'news_frame' iframe 안으로 들어갑니다.
        driver.switch_to.frame("news_frame")
        
        # ★★★★★ 2. iframe 안에서 요소 대기 ★★★★★
        # 이제 iframe 내부에서 뉴스 테이블(.type5)이 나타날 때까지 대기합니다.
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "type5"))
        )
        
        # 이제 페이지 소스를 가져와서 파싱
        html_list = driver.page_source
        soup_list = BeautifulSoup(html_list, 'html.parser')

        article_links = [a['href'] for a in soup_list.select('.title a')]
        print(f"✅ [{stock_name}] 수집된 뉴스 링크 수: {len(article_links)}")

    except Exception as e:
        print(f"❌ [{stock_name}] 뉴스 목록 페이지 로딩/처리 실패: {e}")
        # ★★★★★ 3. 다음 루프를 위해 원래 페이지로 제어권 복귀 (중요!) ★★★★★
        driver.switch_to.default_content()
        continue # 목록 로딩 실패 시 다음 종목으로 넘어감
    
    # ★★★★★ 4. 다음 루프를 위해 원래 페이지로 제어권 복귀 (중요!) ★★★★★
    # 목록 수집이 성공적으로 끝나도, 다음 종목을 위해 다시 바깥 페이지로 나와야 합니다.
    driver.switch_to.default_content()

    # 3-3. 각 기사 링크를 순회하며 상세 정보 수집 (이 부분은 기존과 동일)
    for link in article_links[:5]: # 테스트를 위해 종목당 3개의 뉴스만 수집
        try:
            full_url = urljoin(base_url, link)
            driver.get(full_url)
            
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "title_area"))
            )
            
            html_article = driver.page_source
            final_url = driver.current_url
            soup_article = BeautifulSoup(html_article, 'html.parser')
            
            # 데이터 수집... (이하 생략, 기존 코드와 동일)
            title = soup_article.select_one('#title_area span').text
            content_element = soup_article.select_one('#dic_area')
            source = soup_article.select_one('.media_end_head_top_logo img')['alt']
            datetime_str = soup_article.select_one('.media_end_head_info_datestamp_time')['data-date-time']
            published_at_dt = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M:%S')
            crawled_at_dt = datetime.now()

            news_data.append({
                'related_stock': stock_name,
                'title': title,
                'content': str(content_element),
                'source': source,
                'url': final_url,
                'published_at': published_at_dt.strftime('%Y-%m-%d %H:%M:%S'),
                'crawled_at': crawled_at_dt.strftime('%Y-%m-%d %H:%M:%S')
            })
            print(f"  - '{title[:20]}...' 기사 수집 성공")

        except Exception as e:
            print(f"  - 상세 기사 처리 중 예외 발생: {e}")
        
        time.sleep(random.uniform(0.5, 1.5)) # 각 기사 처리 후 짧은 대기

driver.quit()

print("\n--- 최종 수집 데이터 ---")
print(json.dumps(news_data, indent=2, ensure_ascii=False))

end_time = time.time()
elapsed_time = end_time - start_time
print("\n--- 성능 측정 결과 ---")
print(f"총 소요 시간: {elapsed_time:.2f}초")