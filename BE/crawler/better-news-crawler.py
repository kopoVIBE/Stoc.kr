# ====================================================================
# AWS EC2 t2.micro 최적화 통합 뉴스 크롤러 (httpx 하이브리드 버전)
# Playwright(링크 수집) + httpx(기사 상세) 하이브리드 구조
# Producer-Consumer 패턴 적용
# ====================================================================
import asyncio
import httpx
from playwright.async_api import async_playwright
import csv, time, json, random, os, psutil, gc
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from datetime import datetime
import logging
from collections import deque
from pymongo import MongoClient
from inference import predict_sentiment 

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('crawler.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# --- 1. 시스템 모니터링 및 안전장치 ---
def check_system_resources():
    """시스템 리소스 상태 확인"""
    memory = psutil.virtual_memory()
    cpu_percent = psutil.cpu_percent(interval=1)
    
    logger.info(f"메모리 사용률: {memory.percent}%, CPU 사용률: {cpu_percent}%")
    
    if memory.percent > 85:
        logger.warning("메모리 사용률이 높습니다. 가비지 컬렉션을 실행합니다.")
        gc.collect()
        return False
    return True

# --- 2. 진행상태 저장/복원 ---
def save_progress(data, filename="progress.json"):
    """크롤링 진행 상태를 파일에 저장"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        logger.info(f"진행상태가 {filename}에 저장되었습니다.")
    except Exception as e:
        logger.error(f"진행상태 저장 실패: {e}")

def load_progress(filename="progress.json"):
    """저장된 진행 상태를 불러오기"""
    try:
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
            logger.info(f"진행상태를 {filename}에서 불러왔습니다.")
            return data
        return {}
    except Exception as e:
        logger.error(f"진행상태 불러오기 실패: {e}")
        return {}

# --- 3. 설정 및 외부 데이터 처리 ---
def read_stocks_from_csv():
    base_dir = os.path.dirname(os.path.abspath(__file__))  # 현재 crawler 디렉토리 기준
    filename = os.path.join(base_dir, 'stocks.csv')
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

# --- 4. 브라우저 컨텍스트 관리 (링크 수집용) ---
class BrowserManager:
    def __init__(self):
        self.browser = None
        self.context = None
        self.page_count = 0
        self.max_pages_per_context = 30
        
    async def init_browser(self):
        """브라우저 초기화"""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-images',
                '--disable-javascript',
                '--memory-pressure-off',
                '--max_old_space_size=256'
            ]
        )
        await self.create_new_context()
        
    async def create_new_context(self):
        """새로운 브라우저 컨텍스트 생성"""
        if self.context:
            await self.context.close()
        
        self.context = await self.browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        self.page_count = 0
        logger.info("새로운 브라우저 컨텍스트를 생성했습니다.")
        
    async def get_page(self):
        """페이지 획득 (필요시 컨텍스트 재생성)"""
        if self.page_count >= self.max_pages_per_context:
            logger.info("컨텍스트 재생성을 위해 기존 컨텍스트를 종료합니다.")
            await self.create_new_context()
            
        page = await self.context.new_page()
        # 리소스 차단으로 메모리 절약
        await page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2,mp4,ttf,ico}", 
                        lambda route: route.abort())
        self.page_count += 1
        return page
        
    async def close(self):
        """브라우저 종료"""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if hasattr(self, 'playwright'):
            await self.playwright.stop()

# --- 5. HTTP 클라이언트 관리 (기사 상세 수집용) ---
class HttpClientManager:
    def __init__(self, concurrent_limit=15):
        self.client = None
        self.concurrent_limit = concurrent_limit
        
    async def init_client(self):
        """HTTP 클라이언트 초기화"""
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0),
            limits=httpx.Limits(
                max_keepalive_connections=20,
                max_connections=self.concurrent_limit * 2
            ),
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        )
        logger.info(f"HTTP 클라이언트 초기화 완료 (동시 연결 제한: {self.concurrent_limit})")
        
    async def close(self):
        """HTTP 클라이언트 종료"""
        if self.client:
            await self.client.aclose()

# --- 6. httpx 기반 기사 상세 수집 ---
async def fetch_article_details_httpx(http_client, url, news_type, stock_info=None, max_retries=2):
    """httpx를 사용한 기사 상세 정보 수집"""
    
    for attempt in range(max_retries):
        try:
            response = await http_client.get(url)
            response.raise_for_status()

            # 최종 URL 확인
            final_url = str(response.url)
            logger.info(f"최종 URL: {final_url}")
            
            # 만약 여전히 리다이렉션 페이지라면, HTML에서 실제 URL 추출
            if "news_read.naver" in final_url:
                soup_redirect = BeautifulSoup(response.text, 'lxml')
                
                # JavaScript 리다이렉션 코드에서 실제 URL 추출
                script_tags = soup_redirect.find_all('script')
                for script in script_tags:
                    if script.string and 'location.href' in script.string:
                        # top.location.href='실제URL' 패턴 찾기
                        import re
                        match = re.search(r"location\.href\s*=\s*['\"]([^'\"]+)['\"]", script.string)
                        if match:
                            actual_url = match.group(1)
                            logger.info(f"JavaScript 리다이렉션 URL 발견: {actual_url}")
                            
                            # 실제 URL로 다시 요청
                            response = await http_client.get(actual_url, follow_redirects=True)
                            response.raise_for_status()
                            final_url = str(response.url)
                            break
                
                soup_redirect.decompose()
            
            # 정책에 따라 지원하지 않는 기사 유형 건너뛰기
            if "m.sports.naver.com" in str(final_url):
                logger.info(f"정책에 따라 지원하지 않는 기사 유형입니다: {final_url}")
                return None

            soup_article = BeautifulSoup(response.text, 'lxml')

            # 데이터 추출
            title_element = soup_article.select_one('#title_area span')
            if not title_element:
                raise ValueError("제목을 찾을 수 없습니다")
                
            title = title_element.text
            content_element = soup_article.select_one('#dic_area')
            if not content_element:
                raise ValueError("본문을 찾을 수 없습니다")
                
            source_element = soup_article.select_one('.media_end_head_top_logo img')
            if not source_element:
                raise ValueError("출처를 찾을 수 없습니다")
                
            source = source_element['alt']
            category_elements = soup_article.select('em.media_end_categorize_item')
            category = [el.text for el in category_elements] if category_elements else ['미분류']
            
            datetime_element = soup_article.select_one('.media_end_head_info_datestamp_time')
            if not datetime_element:
                raise ValueError("발행일시를 찾을 수 없습니다")
                
            published_at_str = datetime_element['data-date-time']
            
            # 썸네일 수집
            thumbnail_element = soup_article.select_one('meta[property="og:image"]')
            thumbnail_url = thumbnail_element['content'] if thumbnail_element else None
            
            published_at_dt = datetime.strptime(published_at_str, '%Y-%m-%d %H:%M:%S')
            
            # === 감정 분석 로직 추가 ===
            sentiment = None
            if news_type == 'stock':
                content_html = str(content_element)
                content_for_sentiment = BeautifulSoup(content_html, 'lxml')
                for tag in content_for_sentiment(['img', 'script', 'style', 'a', 'strong']):
                    tag.decompose()
                
                text_content = content_for_sentiment.get_text(separator=' ', strip=True)
                sentiment_input = f"{title.strip()} {text_content}"
                sentiment = predict_sentiment(sentiment_input)
                content_for_sentiment.decompose() # 메모리 해제
            # ========================

            # BeautifulSoup 객체 명시적 해제
            soup_article.decompose()
            
            return {
                'news_type': news_type,
                'stock_code': stock_info['code'] if stock_info else None,
                'stock_name': stock_info['name'] if stock_info else None,
                'url': final_url,  
                'title': title.strip(), 
                'content': str(content_element),  # HTML 문자열 유지 (레이아웃 보존)
                'source': source.strip(), 
                'category': category, 
                'thumbnail_url': thumbnail_url,
                'published_at': published_at_dt.strftime('%Y-%m-%d %H:%M:%S'),
                'crawled_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'sentiment': sentiment
            }
            
        except Exception as e:
            logger.warning(f"기사 상세 정보 수집 실패 (시도 {attempt + 1}/{max_retries}): {url} - {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(1 + attempt)  # 지수 백오프
            else:
                logger.error(f"기사 상세 정보 수집 최종 실패: {url}")
                return None

# --- 7. Playwright 기반 링크 수집 ---
async def fetch_main_news_links(browser_manager, limit=None):
    """네이버 금융 메인 페이지에서 주요 뉴스 링크 수집"""
    logger.info("주요 뉴스 링크 수집 시작")
    base_url = "https://finance.naver.com"
    list_url = urljoin(base_url, '/news/mainnews.naver')
    
    page = None
    try:
        page = await browser_manager.get_page()
        await page.goto(list_url, wait_until='domcontentloaded', timeout=15000)
        link_elements = await page.locator('.articleSubject a').all()
        
        full_urls = []
        for el in link_elements:
            href = await el.get_attribute("href")
            if href:
                full_urls.append(urljoin(base_url, href))
        
        unique_urls = list(set(full_urls))

        if limit and limit > 0:
            unique_urls = unique_urls[:limit]
            logger.info(f"주요 뉴스 링크 {len(unique_urls)}개 선택하여 수집 완료")
        else:
            logger.info(f"주요 뉴스 링크 {len(unique_urls)}개 수집 완료")
        
        return unique_urls
        
    except Exception as e:
        logger.error(f"주요 뉴스 링크 수집 중 오류 발생: {e}")
        return []
    finally:
        if page and not page.is_closed():
            await page.close()

async def fetch_stock_news_links(browser_manager, stock_code, max_pages, links_per_page_limit=None):
    """종목별 뉴스 목록에서 기사 링크 수집"""
    all_links = []
    base_url = "https://finance.naver.com"
    
    page = None
    try:
        page = await browser_manager.get_page()
        
        for page_num in range(1, max_pages + 1):
            stock_page_url = f"{base_url}/item/news.naver?code={stock_code}&page={page_num}"
            
            try:
                await page.goto(stock_page_url, wait_until='domcontentloaded', timeout=15000)
                frame = page.frame_locator("#news_frame")
                
                # 뉴스 테이블이 로드될 때까지 대기
                await frame.locator("table.type5").first.wait_for(timeout=8000)
                
                link_elements = await frame.locator("td.title > a").all()
                if not link_elements:
                    break
                
                if links_per_page_limit and links_per_page_limit > 0:
                    link_elements = link_elements[:links_per_page_limit]
                
                page_links = []
                for el in link_elements:
                    href = await el.get_attribute("href")
                    if href:
                        page_links.append(urljoin(base_url, href))
                
                all_links.extend(page_links)
                await asyncio.sleep(random.uniform(0.5, 1.0))
                
            except Exception as e:
                logger.warning(f"{stock_code} - {page_num} 페이지 처리 중 예외 발생: {e}")
                break
                
        return list(set(all_links))
        
    except Exception as e:
        logger.error(f"{stock_code} 뉴스 링크 수집 중 오류 발생: {e}")
        return []
    finally:
        if page and not page.is_closed():
            await page.close()

# --- 8. Producer-Consumer 패턴 ---
class ArticleQueue:
    def __init__(self):
        self.queue = deque()
        self.lock = asyncio.Lock()
        
    async def put(self, item):
        async with self.lock:
            self.queue.append(item)
            
    async def get(self):
        async with self.lock:
            if self.queue:
                return self.queue.popleft()
            return None
            
    async def size(self):
        async with self.lock:
            return len(self.queue)

async def article_consumer(queue, http_client, results_list, consumer_id, semaphore):
    """기사 상세 정보 수집을 담당하는 Consumer"""
    processed = 0
    
    while True:
        item = await queue.get()
        if item is None:  # 종료 신호
            break
            
        async with semaphore:
            result = await fetch_article_details_httpx(
                http_client, 
                item['url'], 
                item['news_type'], 
                item.get('stock_info')
            )
            
            if result:
                results_list.append(result)
                processed += 1
                
                if processed % 10 == 0:
                    logger.info(f"Consumer {consumer_id}: {processed}건 처리 완료")
            
            await asyncio.sleep(random.uniform(0.1, 0.3))
    
    logger.info(f"Consumer {consumer_id} 종료: 총 {processed}건 처리")

# --- 9. 데이터 Export 함수 ---
def export_data_to_json(data, filename):
    """주어진 데이터를 JSON 파일로 저장하는 함수"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        logger.info(f"결과가 '{filename}' 파일에 저장되었습니다.")
    except Exception as e:
        logger.error(f"파일 저장 중 오류 발생: {e}")

def save_to_mongodb(data):
    """수집된 데이터를 MongoDB에 저장하는 함수"""
    if not data:
        logger.info("MongoDB에 저장할 데이터가 없습니다.")
        return
        
    try:
        # 환경변수에서 MongoDB 접속 정보 읽기 (없으면 기본값 사용)
        mongo_user = os.environ.get("MONGO_INITDB_ROOT_USERNAME", "stockr")
        mongo_pass = os.environ.get("MONGO_INITDB_ROOT_PASSWORD", "stockr123!")
        mongo_host = os.environ.get("MONGO_HOST", "localhost")
        mongo_port = os.environ.get("MONGO_PORT", "27017")
        mongo_db   = os.environ.get("MONGO_DATABASE", "stockr")

        mongo_uri = f"mongodb://{mongo_user}:{mongo_pass}@{mongo_host}:{mongo_port}"
        client = MongoClient(mongo_uri)
        db = client[mongo_db]
        collection = db["news"]

        collection.insert_many(data)
        logger.info(f"MongoDB에 뉴스 {len(data)}건 저장 완료.")
        client.close()
    except Exception as e:
        logger.error(f"MongoDB 저장 실패: {e}")

# --- 10. 메인 실행 함수 ---
async def main():
    # ==================== 설정 값 ====================
    CRAWL_MODE = 'ALL'
    MAX_MAIN_NEWS_LINKS = 5
    MAX_PAGES_PER_STOCK = 1
    MAX_LINKS_PER_PAGE = 5
    
    # 하이브리드 동시성 설정
    LINK_CONCURRENT_TASKS = 2      # 링크 수집 (Playwright) - 저동시성
    ARTICLE_CONCURRENT_TASKS = 15  # 기사 수집 (httpx) - 고동시성
    CONSUMER_COUNT = 3             # Consumer 수
    BATCH_SIZE = 15                # 배치 크기
    
    # 체크포인트 설정
    CHECKPOINT_INTERVAL = 100
    # ===============================================

    start_time = time.time()
    logger.info(f"'{CRAWL_MODE}' 모드로 하이브리드 뉴스 크롤링 시작")
    
    # 진행상태 불러오기
    progress = load_progress()
    final_crawled_data = progress.get('crawled_data', [])
    completed_stocks = set(progress.get('completed_stocks', []))
    
    browser_manager = BrowserManager()
    http_client_manager = HttpClientManager(ARTICLE_CONCURRENT_TASKS)
    
    try:
        await browser_manager.init_browser()
        await http_client_manager.init_client()
        
        # --- 주요 뉴스 크롤링 ---
        if CRAWL_MODE in ['MAIN', 'ALL'] and not progress.get('main_news_completed', False):
            logger.info("주요 뉴스 크롤링 시작")
            main_news_urls = await fetch_main_news_links(browser_manager, limit=MAX_MAIN_NEWS_LINKS)
            
            if main_news_urls:
                # Producer-Consumer 패턴으로 처리
                queue = ArticleQueue()
                results = []
                semaphore = asyncio.Semaphore(ARTICLE_CONCURRENT_TASKS)
                
                # Queue에 작업 추가
                for url in main_news_urls:
                    await queue.put({'url': url, 'news_type': 'main'})
                
                # Consumer 시작
                consumers = []
                for i in range(CONSUMER_COUNT):
                    consumer = asyncio.create_task(
                        article_consumer(queue, http_client_manager.client, results, i, semaphore)
                    )
                    consumers.append(consumer)
                
                # 모든 작업이 완료될 때까지 대기
                while await queue.size() > 0:
                    await asyncio.sleep(1)
                
                # Consumer 종료
                for _ in range(CONSUMER_COUNT):
                    await queue.put(None)
                await asyncio.gather(*consumers)
                
                final_crawled_data.extend(results)
                progress['main_news_completed'] = True
                progress['crawled_data'] = final_crawled_data
                save_progress(progress)
                
                logger.info(f"주요 뉴스 총 {len(results)}건 수집 완료")

        # --- 종목 뉴스 크롤링 ---
        if CRAWL_MODE in ['STOCKS', 'ALL']:
            all_stocks = read_stocks_from_csv()
            if all_stocks:
                remaining_stocks = [s for s in all_stocks if s['code'] not in completed_stocks]
                logger.info(f"총 {len(all_stocks)}개 종목 중 {len(remaining_stocks)}개 종목이 남아있습니다.")
                
                total_batches = (len(remaining_stocks) + BATCH_SIZE - 1) // BATCH_SIZE
                
                for batch_idx in range(0, len(remaining_stocks), BATCH_SIZE):
                    batch_stocks = remaining_stocks[batch_idx:batch_idx + BATCH_SIZE]
                    batch_num = (batch_idx // BATCH_SIZE) + 1
                    
                    logger.info(f"=== 배치 {batch_num}/{total_batches} 시작 (종목 {len(batch_stocks)}개) ===")
                    
                    if not check_system_resources():
                        logger.warning("시스템 리소스 부족으로 10초 대기합니다.")
                        await asyncio.sleep(10)
                    
                    # 1단계: 링크 수집 (저동시성)
                    link_semaphore = asyncio.Semaphore(LINK_CONCURRENT_TASKS)
                    all_article_tasks = []
                    
                    async def collect_stock_links(stock):
                        async with link_semaphore:
                            stock_info = {'code': stock['code'], 'name': stock['name']}
                            article_urls = await fetch_stock_news_links(
                                browser_manager, 
                                stock['code'], 
                                MAX_PAGES_PER_STOCK,
                                links_per_page_limit=MAX_LINKS_PER_PAGE
                            )
                            return [{'url': url, 'news_type': 'stock', 'stock_info': stock_info} 
                                   for url in article_urls]
                    
                    link_tasks = [collect_stock_links(stock) for stock in batch_stocks]
                    link_results = await asyncio.gather(*link_tasks)
                    
                    # 링크 수집 결과 통합
                    article_tasks = []
                    for batch_result in link_results:
                        article_tasks.extend(batch_result)
                    
                    logger.info(f"배치 {batch_num}: {len(article_tasks)}개 기사 링크 수집 완료")
                    
                    # 2단계: 기사 상세 수집 (고동시성, Producer-Consumer)
                    if article_tasks:
                        queue = ArticleQueue()
                        results = []
                        article_semaphore = asyncio.Semaphore(ARTICLE_CONCURRENT_TASKS)
                        
                        # Queue에 작업 추가
                        for task in article_tasks:
                            await queue.put(task)
                        
                        # Consumer 시작
                        consumers = []
                        for i in range(CONSUMER_COUNT):
                            consumer = asyncio.create_task(
                                article_consumer(queue, http_client_manager.client, results, i, article_semaphore)
                            )
                            consumers.append(consumer)
                        
                        # 모든 작업이 완료될 때까지 대기
                        while await queue.size() > 0:
                            await asyncio.sleep(1)
                        
                        # Consumer 종료
                        for _ in range(CONSUMER_COUNT):
                            await queue.put(None)
                        await asyncio.gather(*consumers)
                        
                        final_crawled_data.extend(results)
                        logger.info(f"배치 {batch_num}: {len(results)}건 기사 수집 완료")
                    
                    # 완료된 종목 표시
                    for stock in batch_stocks:
                        completed_stocks.add(stock['code'])
                    
                    # 주기적 진행상태 저장
                    if batch_num % (CHECKPOINT_INTERVAL // BATCH_SIZE) == 0:
                        progress['crawled_data'] = final_crawled_data
                        progress['completed_stocks'] = list(completed_stocks)
                        save_progress(progress)
                        logger.info(f"체크포인트: 배치 {batch_num} 완료, 진행상태 저장됨")
                        
                        # 가비지 컬렉션
                        gc.collect()
                
                # 최종 진행상태 저장
                progress['crawled_data'] = final_crawled_data
                progress['completed_stocks'] = list(completed_stocks)
                save_progress(progress)
        
    except Exception as e:
        logger.error(f"크롤링 중 심각한 오류 발생: {e}")
        # 오류 발생 시에도 진행상태 저장
        progress['crawled_data'] = final_crawled_data
        progress['completed_stocks'] = list(completed_stocks)
        save_progress(progress)
    
    finally:
        await browser_manager.close()
        await http_client_manager.close()

    # --- 최종 결과 저장 ---
    if final_crawled_data:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"unified_news_{timestamp}.json"
        export_data_to_json(final_crawled_data, filename)

        save_to_mongodb(final_crawled_data)

        # 성공적으로 종료 후 진행상태 파일 삭제
        if os.path.exists("progress.json"):
            try:
                os.remove("progress.json")
                logger.info("크롤링이 성공적으로 종료되어 progress.json 파일을 삭제했습니다.")
            except Exception as e:
                logger.error(f"progress.json 파일 삭제 중 오류 발생: {e}")
    
    end_time = time.time()
    elapsed_time = end_time - start_time
    logger.info("="*60)
    logger.info(f"크롤링 완료! 총 {len(final_crawled_data)}건의 뉴스 수집")
    logger.info(f"총 소요 시간: {elapsed_time:.2f}초")
    logger.info("="*60)

if __name__ == "__main__":
    # 필요한 패키지 설치:
    # pip install httpx playwright beautifulsoup4 psutil
    # playwright install chromium
    
    asyncio.run(main())