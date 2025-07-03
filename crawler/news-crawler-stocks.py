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

        # 썸네일 수집 로직
        # 1. meta[property="og:image"] 선택자로 요소를 찾는다.
        thumbnail_element = soup_article.select_one('meta[property="og:image"]')
        # 2. 요소가 존재하면 content 속성을, 없으면 None을 저장한다. (안전한 처리)
        thumbnail_url = thumbnail_element['content'] if thumbnail_element else None
        
        # 필수 요소가 하나라도 없으면 수집 실패로 간주
        if not all([title, content_element, source, category, published_at_str]):
            raise ValueError("페이지에서 필수 요소를 찾지 못함")
            
        published_at_dt = datetime.strptime(published_at_str, '%Y-%m-%d %H:%M:%S')
        
        return {
            'stock_code': stock_code, 'stock_name': stock_name, 'url': page.url,  
            'title': title, 'content': str(content_element), 'source': source, 'category': category, 
            'thumbnail_url': thumbnail_url,
            'published_at': published_at_dt.strftime('%Y-%m-%d %H:%M:%S'),
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
    all_links = []
    print(f"    - 최대 {max_pages_per_stock} 페이지까지 수집을 시도합니다.")
    base_url = "https://finance.naver.com" # ★★★ 상대 경로를 위한 기준 URL

    for page_num in range(1, max_pages_per_stock + 1):
        stock_page_url = f"{base_url}/item/news.naver?code={stock_code}&page={page_num}"
        try:
            await page.goto(stock_page_url, wait_until='domcontentloaded', timeout=15000)
            frame = page.frame_locator("#news_frame")
            main_table_locator = frame.locator("table.type5").first
            try:
                await main_table_locator.wait_for(timeout=5000)
            except Exception:
                print(f"    - {page_num} 페이지에 뉴스 테이블이 없어 수집을 중단합니다.")
                break
            
            main_tbody_locator = main_table_locator.locator("> tbody")
            link_elements = await main_tbody_locator.locator("> tr:not(.relation_lst) > td.title > a").all()
            if not link_elements:
                print(f"    - {page_num} 페이지에 기사가 없어 수집을 중단합니다.")
                break
            
            page_links = []
            for el in link_elements:
                href = await el.get_attribute("href")
                if href:
                    # ★★★ 모든 href를 urljoin으로 감싸 절대 URL을 보장 ★★★
                    full_url = urljoin(base_url, href)
                    page_links.append(full_url)

            all_links.extend(page_links)
            print(f"    - {page_num} 페이지에서 {len(page_links)}개의 링크 수집 완료.")
            await asyncio.sleep(0.5)
        except Exception as e:
            print(f"    - ❌ {page_num} 페이지 처리 중 예외 발생: {e}")
            break
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

# --- 배치 처리를 위한 새로운 실행 함수 ---
async def run_batch(stocks_batch, max_pages, concurrent_tasks):
    """하나의 배치를 처리하고, 브라우저를 완전히 종료하는 크롤링 함수"""
    batch_news_data = []
    semaphore = asyncio.Semaphore(concurrent_tasks)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(user_agent="...")

        for stock in stocks_batch:
            stock_code, stock_name = stock['code'], stock['name']
            print(f"\n--- '{stock_name}({stock_code})' 뉴스 수집 시작 ---")
            
            list_page = await context.new_page()
            article_urls = await fetch_news_links_for_stock(list_page, stock_code, max_pages_per_stock=max_pages)
            await list_page.close()

            if not article_urls: continue

            tasks = []
            for url in article_urls:
                page = await context.new_page()
                await page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}", lambda route: route.abort())
                tasks.append(worker(semaphore, page, url, stock_code, stock_name))
            
            results = await asyncio.gather(*tasks)
            for result in results:
                if result: batch_news_data.append(result)
            
            await asyncio.sleep(random.uniform(2, 4))
        
        # ★★★ 한 배치가 끝나면 브라우저를 완전히 닫아 메모리 해제 ★★★
        await browser.close()
    
    return batch_news_data

async def worker(semaphore, page, url, stock_code, stock_name):
    """Semaphore를 사용하여 동시성을 제어하는 작업자 함수"""
    async with semaphore:
        result = await fetch_article_details(page, url, stock_code, stock_name)
        await asyncio.sleep(random.uniform(0.5, 1.5))
        return result

if __name__ == "__main__":
    start_time = time.time()
    print("대규모 배치 크롤링을 시작합니다...")

    all_stocks = read_stocks_from_csv()
    final_crawled_data = []
    
    # --- 설정 값 ---
    BATCH_SIZE = 50          # 한 번에 처리할 종목 수
    MAX_PAGES_PER_STOCK = 1 # 종목당 수집할 최대 페이지
    CONCURRENT_TASKS = 20     # 동시 실행 작업 수
    
    for i in range(0, len(all_stocks), BATCH_SIZE):
        batch_stocks = all_stocks[i:i+BATCH_SIZE]
        batch_num = i//BATCH_SIZE + 1
        total_batches = (len(all_stocks) + BATCH_SIZE - 1) // BATCH_SIZE
        
        print("\n" + "="*60)
        print(f"  배치 {batch_num} / {total_batches} 시작 (종목 {len(batch_stocks)}개)")
        print("="*60)
        
        # 각 배치마다 새로운 이벤트 루프에서 크롤러를 실행하여 완벽한 리소스 초기화
        batch_results = asyncio.run(run_batch(batch_stocks, MAX_PAGES_PER_STOCK, CONCURRENT_TASKS))
        
        if batch_results:
            final_crawled_data.extend(batch_results)
            # 중간 결과를 배치마다 저장하여 안정성 확보
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            export_data_to_json(batch_results, f"news_batch_{batch_num}_{timestamp}.json")
            print(f"\n✅ 배치 {batch_num}의 결과가 파일로 저장되었습니다.")

    end_time = time.time()
    elapsed_time = end_time - start_time
    print(f"\n\n크롤링 전체 완료! 총 소요 시간: {elapsed_time:.2f}초")

    if final_crawled_data:
        # 최종 통합 파일 저장
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        export_data_to_json(final_crawled_data, f"news_results_ALL_{timestamp}.json")
        export_for_ml(final_crawled_data, f"ml_data_ALL_{timestamp}.json")