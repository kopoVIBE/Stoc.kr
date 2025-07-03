# =============================================================
# Playwright 비동기 방식 + MongoDB 저장 뉴스 크롤러
# =============================================================
import asyncio
from playwright.async_api import async_playwright
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datetime import datetime
import json
import time
import os
from pymongo import MongoClient

# 1. 뉴스 목록 수집
list_url = 'https://finance.naver.com/news/mainnews.naver'
response = requests.get(list_url, headers={'User-Agent': 'Mozilla/5.0'})
soup = BeautifulSoup(response.text, 'html.parser')
headlines = soup.select('.articleSubject')
article_links = [h.find('a')['href'] for h in headlines]
base_url = "https://finance.naver.com"
full_urls = [urljoin(base_url, link) for link in article_links]

print(f"수집 대상 URL 수: {len(full_urls)}")


# 2. Playwright를 이용한 상세 정보 수집
async def fetch_article_details(page, url):
    try:
        await page.goto(url, wait_until='domcontentloaded')
        await page.wait_for_selector('#title_area', timeout=10000)

        html_article = await page.content()
        soup_article = BeautifulSoup(html_article, 'html.parser')

        title = soup_article.select_one('#title_area span').text
        content_element = soup_article.select_one('#dic_area')
        content = str(content_element)

        source_element = soup_article.select_one('.media_end_head_top_logo img')
        source = source_element['alt']

        category_elements = soup_article.select('em.media_end_categorize_item')
        category = [el.text for el in category_elements] if category_elements else ['미분류']

        datetime_str = soup_article.select_one('.media_end_head_info_datestamp_time')['data-date-time']
        published_at_dt = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M:%S')

        print(f"✅ '{title[:20]}...' 수집 성공")
        return {
            'title': title,
            'content': content,
            'source': source,
            'category': category,
            'url': page.url,
            'published_at': published_at_dt.strftime('%Y-%m-%d %H:%M:%S'),
            'crawled_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    except Exception as e:
        print(f"❌ {url} 처리 중 예외 발생: {e}")
        return None


# 3. MongoDB 저장 함수
def save_to_mongo(news_data):
    try:
        mongo_host = os.getenv("MONGO_HOST", "mongodb")
        mongo_port = int(os.getenv("MONGO_PORT", 27017))
        mongo_user = os.getenv("MONGO_INITDB_ROOT_USERNAME", "stockr")
        mongo_password = os.getenv("MONGO_INITDB_ROOT_PASSWORD", "stockr123!")
        mongo_db = os.getenv("MONGO_DATABASE", "stockr")

        client = MongoClient(
            f"mongodb://{mongo_user}:{mongo_password}@{mongo_host}:{mongo_port}/",
            serverSelectionTimeoutMS=5000
        )
        db = client[mongo_db]
        collection = db["news"]

        for article in news_data:
            collection.update_one(
                {"url": article["url"]},
                {"$set": article},
                upsert=True
            )

        print(f"✅ MongoDB 저장 완료: {len(news_data)}건")
    except Exception as e:
        print(f"❌ MongoDB 저장 실패: {e}")


# 4. 메인 실행 함수
async def main():
    news_data = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()

        CONCURRENT_TASKS = 5
        for i in range(0, len(full_urls), CONCURRENT_TASKS):
            batch_urls = full_urls[i:i + CONCURRENT_TASKS]
            tasks = []
            for url in batch_urls:
                page = await context.new_page()
                await page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}", lambda route: route.abort())
                tasks.append(fetch_article_details(page, url))

            results = await asyncio.gather(*tasks)
            for result in results:
                if result:
                    news_data.append(result)

        await browser.close()

    print("\n--- 최종 수집 데이터 ---")
    print(json.dumps(news_data, indent=2, ensure_ascii=False))

    if news_data:
        save_to_mongo(news_data)


# 5. 실행 시작
if __name__ == "__main__":
    start_time = time.time()
    print("크롤링을 시작합니다...")
    asyncio.run(main())
    end_time = time.time()
    print("\n--- 성능 측정 결과 ---")
    print(f"총 소요 시간: {end_time - start_time:.2f}초")
