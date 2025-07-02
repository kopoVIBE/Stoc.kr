# ====================================================================
# CSV 파일 기반 종목별 뉴스 병렬 크롤링 코드 (Playwright)
# ====================================================================
import asyncio
from playwright.async_api import async_playwright
import csv, time, json, random
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from datetime import datetime

# --- 1. 외부 데이터 처리: CSV 파일 읽기 ---
def read_stocks_from_csv(filename='stocks.csv'):
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

# --- 2. 개별 기사 상세 정보 수집 함수 ---
async def fetch_article_details(page, url, stock_code, stock_name):
    """단일 뉴스 템플릿에 맞춰 상세 정보를 수집하는 함수"""
    try:
        await page.goto(url, wait_until='domcontentloaded', timeout=15000)
        
        # 스포츠 기사 등 특정 URL 패턴은 정책에 따라 건너뛰기
        if "m.sports.naver.com" in page.url:
            print(f"    - ℹ️  정책에 따라 지원하지 않는 기사 유형입니다. 건너뜁니다: {url}")
            return None

        html_article = await page.content()
        soup_article = BeautifulSoup(html_article, 'html.parser')

        # 데이터 추출
        title = soup_article.select_one('#title_area span').text
        content_element = soup_article.select_one('#dic_area')
        source = soup_article.select_one('.media_end_head_top_logo img')['alt']
        category_elements = soup_article.select('em.media_end_categorize_item')
        category = [el.text for el in category_elements] if category_elements else ['미분류']
        
        # 날짜 파싱 로직 직접 통합
        datetime_element = soup_article.select_one('.media_end_head_info_datestamp_time')
        published_at_str = datetime_element['data-date-time'] if datetime_element else None
        
        # 필수 요소가 하나라도 없으면 수집 실패로 간주
        if not all([title, content_element, source, category, published_at_str]):
            raise ValueError("페이지에서 필수 요소를 찾지 못함")
            
        published_at_dt = datetime.strptime(published_at_str, '%Y-%m-%d %H:%M:%S')
        
        return {
            'stock_code': stock_code, 'stock_name': stock_name, 'title': title, 
            'content': str(content_element), 'source': source, 'category': category, 
            'url': page.url, 'published_at': published_at_dt.strftime('%Y-%m-%d %H:%M:%S'),
            'crawled_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    except Exception as e:
        print(f"    - ❌ 기사 상세 정보 수집 실패 ({url}): {e}")
        return None
    finally:
        if not page.is_closed():
            await page.close()

# --- 3. 종목별 뉴스 목록 페이지에서 기사 링크 수집 ---
async def fetch_news_links_for_stock(page, stock_code, max_pages_per_stock):
    """
    여러 페이지를 순회하며 특정 종목의 모든 기사 링크를 수집하는 함수.
    Args:
        max_pages_per_stock (int): 종목당 최대 몇 페이지까지 수집할지 지정.
    """
    all_links = []
    print(f"    - 최대 {max_pages_per_stock} 페이지까지 수집을 시도합니다.")

    for page_num in range(1, max_pages_per_stock + 1):
        # 핵심: 페이지 번호를 포함한 URL을 직접 생성 
        # 종목 뉴스 목록 페이지는 Iframe 외부의 URL을 바꿔도 내부가 함께 바뀝니다.
        stock_page_url = f"https://finance.naver.com/item/news.naver?code={stock_code}&page={page_num}"
        
        try:
            await page.goto(stock_page_url, wait_until='domcontentloaded', timeout=15000)
            frame = page.frame_locator("#news_frame")
            main_table_locator = frame.locator("table.type5").first
            
            # 페이지가 존재하는지 확인하기 위해 잠시 대기
            try:
                await main_table_locator.wait_for(timeout=5000)
            except Exception:
                print(f"    - {page_num} 페이지에 뉴스 테이블이 없어 수집을 중단합니다.")
                break # 더 이상 페이지가 없으면 루프 종료

            main_tbody_locator = main_table_locator.locator("> tbody")
            link_elements = await main_tbody_locator.locator("> tr:not(.relation_lst) > td.title > a").all()
            
            # 스마트한 중단 조건
            if not link_elements:
                print(f"    - {page_num} 페이지에 기사가 없어 수집을 중단합니다.")
                break # 기사가 더 이상 없으면 루프 종료

            page_links = [await el.get_attribute("href") for el in link_elements if await el.get_attribute("href")]
            all_links.extend(page_links)
            print(f"    - {page_num} 페이지에서 {len(page_links)}개의 링크 수집 완료.")
            
            # 서버에 부담을 주지 않기 위해 페이지 이동 간 짧은 대기
            await asyncio.sleep(0.5)

        except Exception as e:
            print(f"    - ❌ {page_num} 페이지 처리 중 예외 발생: {e}")
            break # 페이지 처리 중 에러 발생 시 해당 종목은 중단

    print(f"    - ✅ '{stock_code}'의 기사 링크 총 {len(all_links)}개 수집 완료.")
    return all_links

# --- 4. 데이터 Export 함수들 (파일명 일관성 확보) ---
def export_data_to_json(data, filename):
    """주어진 데이터를 JSON 파일로 저장하는 범용 함수"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"✅ 결과가 '{filename}' 파일에 성공적으로 저장되었습니다.")
    except Exception as e:
        print(f"❌ 파일 저장 중 오류 발생: {e}")

def export_for_ml(crawled_data, filename):
    """머신러닝용 데이터로 가공하여 JSON 파일로 저장"""
    ml_data_list = []
    print(f"\n--- 머신러닝용 데이터 가공 및 '{filename}' 파일 생성 시작 ---")
    for article in crawled_data:
        soup = BeautifulSoup(article['content'], 'html.parser')
        plain_text_content = soup.get_text(separator=" ", strip=True)
        ml_data_list.append({
            "stock_code": article['stock_code'], "stock_name": article['stock_name'],
            "title": article['title'], "content": plain_text_content,
            "published_at": article['published_at'], "category": article.get('category', ['미분류'])
        })
    export_data_to_json(ml_data_list, filename)

# --- 5. Semaphore를 사용하도록 개선된 메인 실행 로직 ---
async def worker(semaphore, page, url, stock_code, stock_name):
    """Semaphore를 사용하여 동시성을 제어하는 작업자 함수"""
    async with semaphore:
        # 실제 데이터 수집 함수 호출
        result = await fetch_article_details(page, url, stock_code, stock_name)
        # 작업 사이에 자연스러운 딜레이 추가
        await asyncio.sleep(random.uniform(0.5, 1.5))
        return result

async def main():
    all_news_data = []
    MAX_PAGES_PER_STOCK = 3
    CONCURRENT_TASKS = 5 # ★★★ 동시 실행 작업 수 제어

    stocks_to_scrape = read_stocks_from_csv()
    if not stocks_to_scrape: return

    semaphore = asyncio.Semaphore(CONCURRENT_TASKS)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(user_agent="...", viewport={'width': 1920, 'height': 1080}, locale='ko-KR', timezone_id='Asia/Seoul')

        for stock in stocks_to_scrape:
            stock_code, stock_name = stock['code'], stock['name']
            print(f"\n--- '{stock_name}({stock_code})' 뉴스 수집 시작 ---")
            
            list_page = await context.new_page()
            article_urls = await fetch_news_links_for_stock(list_page, stock_code, max_pages_per_stock=MAX_PAGES_PER_STOCK)
            await list_page.close()

            if not article_urls: continue

            tasks = []
            for url in article_urls:
                page = await context.new_page()
                await page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}", lambda route: route.abort())
                # Semaphore를 사용하는 worker 함수를 태스크로 추가
                tasks.append(worker(semaphore, page, url, stock_code, stock_name))
            
            results = await asyncio.gather(*tasks)
            for result in results:
                if result: all_news_data.append(result)
            
            inter_stock_delay = random.uniform(2, 4)
            print(f"--- '{stock_name}' 수집 완료. 다음 종목을 위해 {inter_stock_delay:.2f}초 대기... ---")
            await asyncio.sleep(inter_stock_delay)

        await browser.close()
    
    print(f"\n총 {len(all_news_data)}개의 종목 뉴스 수집 완료.")
    return all_news_data

if __name__ == "__main__":
    start_time = time.time()
    print("크롤링을 시작합니다...")

    final_crawled_data = asyncio.run(main())   

    end_time = time.time()
    elapsed_time = end_time - start_time
    print(f"크롤링 완료! 총 소요 시간: {elapsed_time:.2f}초")

    if final_crawled_data:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        # 파일명에 타임스탬프를 추가하여 버전 관리
        export_data_to_json(final_crawled_data, f"news_results_{timestamp}.json")
        #export_for_ml(final_crawled_data, f"ml_data_{timestamp}.json")