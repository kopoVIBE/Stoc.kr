# ====================================================================
# CSV 파일 기반 종목별 뉴스 병렬 크롤링 코드 (Playwright)
# ====================================================================
import asyncio
from playwright.async_api import async_playwright
import csv, time, json
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from datetime import datetime

# --- 1. 외부 데이터 처리: CSV 파일 읽기 ---
def read_stocks_from_csv(filename='merged_with_beta.csv'):
    """CSV 파일에서 종목 코드와 종목명을 읽어오는 함수"""
    stocks = []
    try:
        with open(filename, mode='r', encoding='utf-8-sig') as infile:
            reader = csv.DictReader(infile)
            for row in reader:
                stocks.append({'code': row['stockCode'], 'name': row['stockName']})
        print(f"✅ '{filename}'에서 {len(stocks)}개 종목 정보를 읽었습니다.")
        return stocks
    except FileNotFoundError:
        print(f"❌ 에러: '{filename}'을 찾을 수 없습니다. 파일을 생성해주세요.")
        return []
    
# --- 헬퍼 함수: 선택자 목록을 순차적으로 시도 ---
def try_selectors(soup, selectors):
    """주어진 선택자 목록을 순서대로 시도하여 가장 먼저 성공하는 요소를 반환"""
    for selector in selectors:
        element = soup.select_one(selector)
        if element:
            return element
    return None

# --- 2. 개별 기사 상세 정보 수집 함수 ---
async def fetch_article_details(page, url, stock_code, stock_name):
    """하나의 기사 URL에서 상세 정보를 수집하는 함수"""
    try:
        await page.goto(url, wait_until='domcontentloaded', timeout=15000)
        await page.wait_for_selector('#title_area', timeout=10000)
        html_article = await page.content()
        soup_article = BeautifulSoup(html_article, 'html.parser')

        title = soup_article.select_one('#title_area span').text
        content_element = soup_article.select_one('#dic_area')
        content = str(content_element)
        source = soup_article.select_one('.media_end_head_top_logo img')['alt']
        published_at_str = soup_article.select_one('.media_end_head_info_datestamp_time')['data-date-time']
        published_at = datetime.strptime(published_at_str, '%Y-%m-%d %H:%M:%S')

        return {
            'stock_code': stock_code, # 어떤 종목의 뉴스인지 명시
            'stock_name': stock_name, # 
            'title': title, 'content': content, 'source': source,
            'url': page.url, 'published_at': published_at.strftime('%Y-%m-%d %H:%M:%S'),
            'crawled_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    except Exception as e:
        print(f"    - ❌ 기사 상세 정보 수집 실패 ({url}): {e}")
        return None
    finally:
        await page.close()

# --- 3. 종목별 뉴스 목록 페이지에서 기사 링크 수집 ---
async def fetch_news_links_for_stock(page, stock_code):
    """특정 종목의 뉴스 목록 페이지에서 모든 기사 링크를 수집하는 함수"""
    news_list_url = f"https://finance.naver.com/item/news.naver?code={stock_code}"
    try:
        await page.goto(news_list_url, wait_until='domcontentloaded', timeout=15000)
        # Iframe 처리 핵심 로직
        # 1. id가 'news_frame'인 iframe을 조준합니다.
        frame = page.frame_locator("#news_frame")
        
        # 2. iframe 내부의 뉴스 테이블('table.type5')이 로드될 때까지 기다립니다.
        # "table.type5"가 여러 개 있지만, 그 중 '첫 번째' 것만 기다립니다.
        await frame.locator("table.type5").first.wait_for(timeout=10000)
        
        # 3. iframe 내부에서 모든 기사 링크('td.title a')를 찾습니다.
        # 3-1. 메인 테이블(첫 번째 table.type5)을 정확히 지정
        main_table_locator = frame.locator("table.type5").first
        
        # 3-2. 그 테이블의 '직속 자식' tbody를 지정하여 탐색 범위를 한정
        main_tbody_locator = main_table_locator.locator("> tbody")
        
        # 3-3. 한정된 tbody 안에서만 원하는 링크를 최종적으로 탐색
        link_elements = await main_tbody_locator.locator("> tr:not(.relation_lst) > td.title > a").all()
        
        links = []
        for link_el in link_elements:
            href = await link_el.get_attribute("href")
            # 제공된 HTML을 보면 이미 절대 경로(https://...)이므로 urljoin이 필요 없습니다.
            if href:
                links.append(href)

        print(f"    - ✅ '{stock_code}'의 기사 링크 {len(links)}개 수집 완료 (Iframe 내부).")
        return links
    except Exception as e:
        print(f"    - ❌ '{stock_code}'의 기사 링크 수집 실패: {type(e).__name__} - {e}")
        return []

# --- 4. 메인 실행 로직 ---
async def main():
    start_time = time.time()
    all_news_data = []

    stocks_to_scrape = read_stocks_from_csv()
    if not stocks_to_scrape:
        return

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(user_agent="Mozilla/5.0...")

        for stock in stocks_to_scrape:
            stock_code, stock_name = stock['code'], stock['name']
            print(f"\n--- '{stock_name}({stock_code})' 뉴스 수집 시작 ---")
            
            list_page = await context.new_page()
            article_urls = await fetch_news_links_for_stock(list_page, stock_code)
            await list_page.close()

            if not article_urls:
                continue

            tasks = []
            for url in article_urls[:5]: # 테스트를 위해 종목당 5개 기사만 수집
                page = await context.new_page()
                await page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}", lambda route: route.abort())
                tasks.append(fetch_article_details(page, url, stock_code, stock_name))
            
            results = await asyncio.gather(*tasks)
            for result in results:
                if result:
                    all_news_data.append(result)
            
            # 다음 종목 크롤링 전 잠시 대기 (서버 부하 감소)
            await asyncio.sleep(1)

        await browser.close()

    # ================== 결과 처리 부분 ==================
    end_time = time.time()
    print("\n\n--- 최종 결과 ---")
    print(f"총 {len(all_news_data)}개의 종목 뉴스 수집 완료.")
    print(f"총 소요 시간: {end_time - start_time:.2f}초")

    # 수집된 데이터를 파일에 저장
    output_filename = f"news_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    try:
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(all_news_data, f, indent=2, ensure_ascii=False)
        print(f"✅ 결과가 '{output_filename}' 파일에 성공적으로 저장되었습니다.")
    except Exception as e:
        print(f"❌ 파일 저장 중 오류 발생: {e}")
    # =====================================================================

if __name__ == "__main__":
    asyncio.run(main())