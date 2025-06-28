# =================================================================
# 1단계: Selenium을 이용한 안정적인 뉴스 수집
# =================================================================
import requests
import time
import json # Gemini 결과 파싱을 위해 미리 import 합니다.
from urllib.parse import urljoin
from bs4 import BeautifulSoup

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
for link in article_links[:3]: # 테스트를 위해 3개만 먼저 해봅니다.
    try:
        full_url = urljoin(base_url, link)
        driver.get(full_url)

        # 제목이 나타날 때까지 최대 10초 대기
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "title_area"))
        )

        html_article = driver.page_source
        soup_article = BeautifulSoup(html_article, 'html.parser')

        title = soup_article.select_one('#title_area span').text
        content = soup_article.select_one('#dic_area').text.strip()
        
        # news_data 리스트에 딕셔너리 형태로 저장 (append 부분 완성)
        news_data.append({
            'title': title,
            'content': content,
            'url': full_url
        })
        print(f"✅ '{title[:30]}...' 기사 수집 성공")

    except Exception as e:
        print(f"❌ 처리 중 예외 발생: {e}")

driver.quit() # 모든 작업이 끝나면 브라우저 종료

print("\n--- 최종 수집 데이터 ---")
# 수집된 데이터를 예쁘게 출력
print(json.dumps(news_data, indent=2, ensure_ascii=False))