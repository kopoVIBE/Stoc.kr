# ====================================================================
# 통합 뉴스 크롤러 (주요 뉴스 + 종목별 뉴스)
# Playwright 비동기, 배치 처리, Semaphore 기반
# ====================================================================
import asyncio
from playwright.async_api import async_playwright
import csv, time, json, random
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from datetime import datetime

# --- 1. 설정 및 외부 데이터 처리 ---

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
        print(f"❌ 에러: '{filename}'을 찾을 수 없습니다. 종목 뉴스 크롤링을 위해 파일을 생성해주세요.")
        return []

# --- 2. 개별 기사 상세 정보 수집 (통합 버전) ---
async def fetch_article_details(page, url, news_type, stock_info=None):
    """
    단일 뉴스 템플릿에 맞춰 상세 정보를 수집하는 통합 함수
    news_type: 'main' 또는 'stock'
    stock_info: {'code': '005930', 'name': '삼성전자'} 형태의 딕셔너리 또는 None
    """
    try:
        await page.goto(url, wait_until='load', timeout=15000)
        
        # 정책에 따라 지원하지 않는 기사 유형 건너뛰기
        if "m.sports.naver.com" in page.url:
            print(f"    - ℹ️  정책에 따라 지원하지 않는 기사 유형입니다. 건너뜁니다: {url}")
            return None

        html_article = await page.content()
        soup_article = BeautifulSoup(html_article, 'lxml')

        # 데이터 추출
        title = soup_article.select_one('#title_area span').text
        content_element = soup_article.select_one('#dic_area')
        source = soup_article.select_one('.media_end_head_top_logo img')['alt']
        category_elements = soup_article.select('em.media_end_categorize_item')
        category = [el.text for el in category_elements] if category_elements else ['미분류']
        
        datetime_element = soup_article.select_one('.media_end_head_info_datestamp_time')
        published_at_str = datetime_element['data-date-time'] if datetime_element else None
        
        # 썸네일 수집 로직 (og:image)
        thumbnail_element = soup_article.select_one('meta[property="og:image"]')
        thumbnail_url = thumbnail_element['content'] if thumbnail_element else None
        
        # 필수 요소 확인
        if not all([title, content_element, source, published_at_str]):
            raise ValueError("페이지에서 필수 요소를 찾지 못함")
            
        published_at_dt = datetime.strptime(published_at_str, '%Y-%m-%d %H:%M:%S')
        
        # DB 저장을 위한 최종 데이터 구조
        return {
            'news_type': news_type,
            'stock_code': stock_info['code'] if stock_info else None,
            'stock_name': stock_info['name'] if stock_info else None,
            'url': page.url,  
            'title': title.strip(), 
            'content': str(content_element), 
            'source': source.strip(), 
            'category': category, 
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

# --- 3. 뉴스 링크 수집 함수들 ---
async def fetch_main_news_links(page, limit=None):
    """네이버 금융 메인 페이지에서 주요 뉴스 링크 수집"""
    print("\n--- 주요 뉴스 링크 수집 시작 ---")
    base_url = "https://finance.naver.com"
    list_url = urljoin(base_url, '/news/mainnews.naver')
    
    try:
        await page.goto(list_url, wait_until='domcontentloaded')
        link_elements = await page.locator('.articleSubject a').all()
        
        full_urls = []
        for el in link_elements:
            href = await el.get_attribute("href")
            if href:
                full_urls.append(urljoin(base_url, href))
        
        unique_urls = list(set(full_urls)) # 중복 제거

        # limit이 지정된 경우, 해당 개수만큼만 잘라서 반환
        if limit and limit > 0:
            print(f"✅ 주요 뉴스 링크 {len(unique_urls)}개 중 {limit}개만 선택하여 수집합니다.")
            return unique_urls[:limit]
        
        print(f"✅ 주요 뉴스 링크 {len(unique_urls)}개 수집 완료.")
        return unique_urls
    except Exception as e:
        print(f"❌ 주요 뉴스 링크 수집 중 오류 발생: {e}")
        return []

async def fetch_stock_news_links(page, stock_code, max_pages, links_per_page_limit=None):
    """종목별 뉴스 목록에서 기사 링크 수집"""
    all_links = []
    base_url = "https://finance.naver.com"
    #print(f"    - '{stock_code}'의 뉴스를 최대 {max_pages} 페이지까지 수집합니다.")

    for page_num in range(1, max_pages + 1):
        stock_page_url = f"{base_url}/item/news.naver?code={stock_code}&page={page_num}"
        try:
            await page.goto(stock_page_url, wait_until='domcontentloaded', timeout=25000)
            frame = page.frame_locator("#news_frame")
            
            # 뉴스 테이블이 로드될 때까지 대기
            await frame.locator("table.type5").first.wait_for(timeout=10000)
            
            link_elements = await frame.locator("td.title > a").all()
            if not link_elements:
                print(f"    - {page_num} 페이지에 기사가 없어 수집을 중단합니다.")
                break
            
            # 페이지당 링크 수 제한 로직
            if links_per_page_limit and links_per_page_limit > 0:
                link_elements = link_elements[:links_per_page_limit]
            
            page_links = [urljoin(base_url, await el.get_attribute("href")) for el in link_elements]
            all_links.extend(page_links)
            #print(f"    - {page_num} 페이지에서 {len(page_links)}개의 링크 수집 완료.")
            await asyncio.sleep(random.uniform(0.3, 0.7))
        except Exception as e:
            print(f"    - ❌ {page_num} 페이지 처리 중 예외 발생: {e}")
            break
            
    return list(set(all_links)) # 중복 제거

# --- 4. 데이터 Export 함수 ---
def export_data_to_json(data, filename):
    """주어진 데이터를 JSON 파일로 저장하는 범용 함수"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"✅ 결과가 '{filename}' 파일에 성공적으로 저장되었습니다.")
    except Exception as e:
        print(f"❌ 파일 저장 중 오류 발생: {e}")

# --- 5. 크롤링 실행 로직 ---
async def worker(semaphore, context, url, news_type, stock_info=None):
    """Semaphore로 동시성을 제어하는 작업자 함수"""
    async with semaphore:
        page = await context.new_page()
        # 불필요한 리소스(이미지, CSS 등) 로딩 차단으로 속도 향상
        await page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}", lambda route: route.abort())
        
        result = await fetch_article_details(page, url, news_type, stock_info)
        await asyncio.sleep(random.uniform(0.1, 0.5)) # 자연스러운 딜레이
        return result

async def run_crawling_session(tasks):
    """주어진 task 목록을 실행하고 결과를 반환하는 세션"""
    results = await asyncio.gather(*tasks)
    return [res for res in results if res] # None이 아닌 결과만 필터링

async def link_collection_worker(context, stock_info, max_pages, links_per_page_limit):
    """단일 종목의 뉴스 링크를 수집하는 비동기 작업자 함수"""
    list_page = await context.new_page()
    await list_page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2,mp4,ttf}", lambda route: route.abort())
    
    try:
        article_urls = await fetch_stock_news_links(
            list_page, 
            stock_info['code'], 
            max_pages,
            links_per_page_limit=links_per_page_limit
        )
        print(f"    - '{stock_info['name']}' 링크 {len(article_urls)}개 수집 완료.")
        return [{'url': url, 'stock_info': stock_info} for url in article_urls]
    except Exception as e:
        print(f"❌ 링크 수집 worker 오류 ({stock_info['name']}): {e}")
        return []
    finally:
        if not list_page.is_closed():
            await list_page.close()

# --- 6. 메인 실행 함수 ---
async def main():
    # ==================== 설정 값 ====================
    CRAWL_MODE = 'ALL'
    MAX_MAIN_NEWS_LINKS = 5
    MAX_PAGES_PER_STOCK = 1
    MAX_LINKS_PER_PAGE = 3
    
    # 동시성 설정
    # 링크 수집과 상세 기사 수집에 모두 적용됩니다.
    # 시스템 부하를 안정적으로 유지하는 핵심 변수입니다.
    CONCURRENT_TASKS = 5
    BATCH_SIZE = 20
    # ===============================================

    start_time = time.time()
    print(f"'{CRAWL_MODE}' 모드로 통합 뉴스 크롤링을 시작합니다...")
    
    final_crawled_data = []
    semaphore = asyncio.Semaphore(CONCURRENT_TASKS)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
        )
        
        # --- 주요 뉴스 크롤링 ---
        if CRAWL_MODE in ['MAIN', 'ALL']:
            list_page = await context.new_page()
            main_news_urls = await fetch_main_news_links(list_page, limit=MAX_MAIN_NEWS_LINKS)
            await list_page.close()

            if main_news_urls:
                tasks = [worker(semaphore, context, url, 'main') for url in main_news_urls]
                main_news_results = await run_crawling_session(tasks)
                final_crawled_data.extend(main_news_results)
                print(f"✅ 주요 뉴스 총 {len(main_news_results)}건 수집 완료.")

        # --- 종목 뉴스 크롤링 ---
        if CRAWL_MODE in ['STOCKS', 'ALL']:
            all_stocks = read_stocks_from_csv()
            if all_stocks:
                total_batches = (len(all_stocks) + BATCH_SIZE - 1) // BATCH_SIZE

                for i in range(0, len(all_stocks), BATCH_SIZE):
                    batch_stocks = all_stocks[i:i+BATCH_SIZE]
                    batch_num = (i // BATCH_SIZE) + 1
            
                    print("\n" + "="*60)
                    print(f"  종목 뉴스 배치 {batch_num} / {total_batches} 시작 (종목 {len(batch_stocks)}개)")
                    print("="*60)

                    # 링크 병렬 수집 (Semaphore 적용)
                    print(f"\n--- 배치 {batch_num}: 링크 병렬 수집 시작 (최대 {CONCURRENT_TASKS}개 동시 실행) ---")
                    
                    # Semaphore로 감싸진 링크 수집 태스크를 생성하는 helper 함수
                    async def semaphore_link_worker(stock_info):
                        async with semaphore:
                            # Semaphore가 허용하면 link_collection_worker 실행
                            return await link_collection_worker(
                                context, stock_info, MAX_PAGES_PER_STOCK, MAX_LINKS_PER_PAGE
                            )

                    link_tasks = []
                    for stock in batch_stocks:
                        stock_info = {'code': stock['code'], 'name': stock['name']}
                        link_tasks.append(semaphore_link_worker(stock_info))
                    
                    results_from_link_workers = await asyncio.gather(*link_tasks)
                    urls_to_crawl = [item for sublist in results_from_link_workers for item in sublist]
                    print(f"--- ✅ 배치 {batch_num}: 총 {len(urls_to_crawl)}개의 링크 수집 완료 ---")

                    # 상세 기사 일괄 처리 
                    if not urls_to_crawl:
                        print(f"--- 배치 {batch_num}: 수집할 링크가 없습니다. ---")
                        continue

                    print(f"\n--- 배치 {batch_num}: 총 {len(urls_to_crawl)}개의 기사 상세 정보 수집 시작 ---")
                    article_tasks = []
                    for item in urls_to_crawl:
                        # worker 함수는 이미 내부에 'async with semaphore' 로직이 있으므로 그대로 사용
                        task = worker(semaphore, context, item['url'], 'stock', item['stock_info'])
                        article_tasks.append(task)
                    
                    batch_results = await run_crawling_session(article_tasks)
                    final_crawled_data.extend(batch_results)
                    print(f"--- ✅ 배치 {batch_num}: {len(batch_results)}건 수집 완료 ---")
        
        await browser.close()

    # --- 최종 결과 저장 ---
    if final_crawled_data:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"unified_news_{timestamp}.json"
        export_data_to_json(final_crawled_data, filename)
    
    end_time = time.time()
    elapsed_time = end_time - start_time
    print("\n" + "="*60)
    print(f"크롤링 전체 완료! 총 {len(final_crawled_data)}건의 뉴스 수집.")
    print(f"총 소요 시간: {elapsed_time:.2f}초")
    print("="*60)

if __name__ == "__main__":
    # 이 스크립트를 실행하기 전에 stocks.csv 파일이 있는지 확인하세요.
    # 예시 stocks.csv 파일 내용:
    # stockCode,stockName
    # 005930,삼성전자
    # 000660,SK하이닉스
    # 035720,카카오
    
    asyncio.run(main())