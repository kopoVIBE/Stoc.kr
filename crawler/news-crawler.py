# =================================================================
# 1단계: Selenium을 이용한 안정적인 뉴스 수집
# =================================================================
import requests
import time
import json # Gemini 결과 파싱을 위해 미리 import 합니다.
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from datetime import datetime

# Selenium 관련 라이브러리
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# 1. 뉴스 목록 페이지에서 링크 수집 (requests + BeautifulSoup)
list_url = 'https://finance.naver.com/news/mainnews.naver'
response = requests.get(list_url, headers={'User-Agent':'Mozilla/5.0'})
soup = BeautifulSoup(response.text, 'html.parser')

headlines = soup.select('.articleSubject')
article_links = [h.find('a')['href'] for h in headlines] # List Comprehension으로 더 간결하게
start_time = time.time()
print("크롤링을 시작합니다...")
print(f"수집된 기사 링크 수: {len(article_links)}")

# 2. 각 기사 링크에 접속하여 상세 정보 수집 (Selenium)
news_data = []
base_url = "https://finance.naver.com"

# WebDriver 설정
options = webdriver.ChromeOptions()
options.add_argument('headless')
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36")
driver = webdriver.Chrome(options=options)

print("\n--- 기사 상세 정보 수집 시작 ---")
for link in article_links[:20]:
    try:
        full_url = urljoin(base_url, link)
        driver.get(full_url)
        final_url = driver.current_url

        # 제목이 나타날 때까지 최대 10초 대기
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "title_area"))
        )

        html_article = driver.page_source
        soup_article = BeautifulSoup(html_article, 'html.parser')

        # 1. title (기존과 동일)
        title = soup_article.select_one('#title_area span').text

        # 2. content (기존과 동일)
        content_element = soup_article.select_one('#dic_area')
        content = str(content_element)
        
        # 3. source (신규 추가)
        # 'alt' 속성에서 언론사 이름을 가져옴. 만약 태그가 없으면 'N/A'로 처리.
        source_element = soup_article.select_one('.media_end_head_top_logo_img')
        source = source_element['alt'] if source_element else 'N/A'

        # 4. published_at (신규 추가)
        # 날짜/시간 텍스트를 가져와서 DB 형식에 맞게 변환
        datetime_str = soup_article.select_one('.media_end_head_info_datestamp_time')['data-date-time']
        # '2024-05-21 17:20:00' 과 같은 문자열을 datetime 객체로 변환
        published_at_dt = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M:%S')

        # 5. crawled_at (신규 추가)
        # 현재 시각을 기록
        crawled_at_dt = datetime.now()
        
        # news_data 리스트에 딕셔너리 형태로 저장 (append 부분 완성)
        news_data.append({
            'title': title,
            'content': content,
            'url': final_url,
            # DB에 저장하기 편하도록 문자열 형태로 변환
            'published_at': published_at_dt.strftime('%Y-%m-%d %H:%M:%S'),
            'crawled_at': crawled_at_dt.strftime('%Y-%m-%d %H:%M:%S')
        })
        print(f"✅ '{title[:30]}...' 기사 수집 성공 (언론사: {source})")

    except Exception as e:
        print(f"❌ 처리 중 예외 발생: {e}")

    time.sleep(1)  # 너무 빠른 요청을 방지하기 위해 1초 대기

driver.quit() # 모든 작업이 끝나면 브라우저 종료

print("\n--- 최종 수집 데이터 ---")
# 수집된 데이터를 예쁘게 출력
print(json.dumps(news_data, indent=2, ensure_ascii=False))

end_time = time.time()
elapsed_time = end_time - start_time
print("\n--- 성능 측정 결과 ---")
print(f"총 소요 시간: {elapsed_time:.2f}초")