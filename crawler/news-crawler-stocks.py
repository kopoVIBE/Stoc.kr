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

# --- 헬퍼 함수 2: 여러 포맷의 날짜를 파싱 ---
def parse_datetime_from_soup(soup):
    """여러 다른 HTML 구조와 날짜 포맷을 시도하여 datetime 객체를 반환"""
    # 시도 1: 기존 템플릿 (data-date-time 속성)
    try:
        element = soup.select_one('.media_end_head_info_datestamp_time')
        if element and 'data-date-time' in element.attrs:
            datetime_str = element['data-date-time']
            return datetime.strptime(datetime_str, '%Y-%m-%d %H:%M:%S')
    except (ValueError, TypeError):
        pass # 파싱 실패 시 다음으로 넘어감

    # 시도 2: 새로운 템플릿 ('오전/오후' 텍스트)
    try:
        element = soup.select_one('div.DateInfo_info_item__3yQPs em.date')
        if element:
            datetime_str = element.text.strip()
            # '오전/오후'를 파싱 가능한 'AM/PM'으로 변환
            if '오전' in datetime_str:
                datetime_str = datetime_str.replace('오전', 'AM').replace('.', '', 3) # Y.M.D. -> Y M D
            elif '오후' in datetime_str:
                datetime_str = datetime_str.replace('오후', 'PM').replace('.', '', 3)
            
            # AM/PM 형식의 포맷 코드 (%p, %I) 사용
            return datetime.strptime(datetime_str, '%Y%m%d %p %I:%M')
    except (ValueError, TypeError):
        pass

    # 모든 시도 실패
    return None

# --- 2. 개별 기사 상세 정보 수집 함수 ---
async def fetch_article_details(page, url, stock_code, stock_name):
    """하나의 기사 URL에서 상세 정보를 수집하는 함수"""
    try:
        await page.goto(url, wait_until='domcontentloaded', timeout=15000)
        html_article = await page.content()
        soup_article = BeautifulSoup(html_article, 'html.parser')

        # --- 선택자 목록 정의 (가장 흔한 것을 맨 앞에) ---
        title_selectors = ['#title_area span', 'h2.ArticleHead_article_title__qh8GV']
        content_selectors = ['#dic_area', '#comp_news_article']
        source_selectors = ['.media_end_head_top_logo img', '.PressLogo_article_head_press_logo__Fm8Xa img']
        category_selectors = ['em.media_end_categorize_item']

        # --- 헬퍼 함수를 이용해 데이터 추출 ---
        title_element = try_selectors(soup_article, title_selectors)
        content_element = try_selectors(soup_article, content_selectors)
        source_element = try_selectors(soup_article, source_selectors)
        category_element = try_selectors(soup_article, category_selectors)
        published_at_dt = parse_datetime_from_soup(soup_article)

        # ★★★ 필수: 모든 요소가 성공적으로 찾아졌는지 확인 ★★★
        if not all([title_element, content_element, source_element, published_at_dt]):
            print(f"    - ⚠️  '{url}' 페이지의 HTML 구조가 달라서 일부 정보 수집 실패. 건너뜁니다.")
            return None

        title = title_element.text
        content = str(content_element)
        source = source_element['alt']
        category = category_element.text if category_element else 'N/A'

        return {
            'stock_code': stock_code, 'stock_name': stock_name, 
            'title': title, 'content': content, 'source': source, 'category': category, 'url': page.url, 
            'published_at': published_at_dt.strftime('%Y-%m-%d %H:%M:%S'),
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