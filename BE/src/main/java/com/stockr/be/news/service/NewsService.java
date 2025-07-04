package com.stockr.be.news.service;

import com.stockr.be.news.domain.News;
import com.stockr.be.news.dto.NewsResponseDto;
import com.stockr.be.news.repository.NewsRepository;
import com.stockr.be.domain.stock.entity.Stock;
import com.stockr.be.domain.stock.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 뉴스 비즈니스 로직 처리 서비스
 */
@Service
@RequiredArgsConstructor
public class NewsService {

    private final NewsRepository newsRepository;
    private final FavoriteService favoriteService;

    public List<NewsResponseDto> getAllNews() {
        // publishedAt이 null이 아닌 뉴스만 최신 순으로 정렬하여 20개 가져오기
        return newsRepository.findByPublishedAtIsNotNullOrderByPublishedAtDesc(PageRequest.of(0, 20))
                .stream()
                .map(NewsResponseDto::from)
                .collect(Collectors.toList());
    }

    public List<NewsResponseDto> getMainNews() {
        // main 타입의 뉴스만 최신 순으로 정렬하여 10개 가져오기
        return newsRepository.findByTypeAndPublishedAtIsNotNullOrderByPublishedAtDesc("main", PageRequest.of(0, 10))
                .stream()
                .map(NewsResponseDto::from)
                .collect(Collectors.toList());
    }

    public List<NewsResponseDto> getPersonalizedNews(Long userId) {
        // 사용자의 즐겨찾기 종목 조회
        List<Stock> favoriteStocks = favoriteService.getFavoriteStocks(userId);
        
        if (favoriteStocks.isEmpty()) {
            return List.of(); // 즐겨찾기 종목이 없으면 빈 리스트 반환
        }
        
        // 각 종목별로 최신 뉴스 1개씩 가져오기 (최대 4개)
        return favoriteStocks.stream()
                .limit(4) // 최대 4개 종목
                .map(stock -> {
                    List<News> stockNews = newsRepository.findByTypeAndStockCodeAndPublishedAtIsNotNullOrderByPublishedAtDesc(
                            "stock", stock.getTicker(), PageRequest.of(0, 1));
                    return stockNews.isEmpty() ? null : stockNews.get(0);
                })
                .filter(news -> news != null)
                .map(NewsResponseDto::from)
                .collect(Collectors.toList());
    }

    public List<NewsResponseDto> searchNewsByKeyword(String keyword) {
        // 키워드 검색도 publishedAt이 null이 아닌 뉴스만 최신 순으로 정렬
        return newsRepository.findByTitleContainingAndPublishedAtIsNotNullOrderByPublishedAtDesc(keyword)
                .stream()
                .map(NewsResponseDto::from)
                .collect(Collectors.toList());
    }
}
