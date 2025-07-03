package com.stockr.be.news.service;

import com.stockr.be.news.domain.News;
import com.stockr.be.news.dto.NewsResponseDto;
import com.stockr.be.news.repository.NewsRepository;
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

    public List<NewsResponseDto> getAllNews() {
        // publishedAt이 null이 아닌 뉴스만 최신 순으로 정렬하여 20개 가져오기
        return newsRepository.findByPublishedAtIsNotNullOrderByPublishedAtDesc(PageRequest.of(0, 20))
                .stream()
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
