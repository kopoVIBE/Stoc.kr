package com.stockr.be.news.repository;

import com.stockr.be.news.domain.News;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

/**
 * MongoDB와 연결되는 뉴스 리포지토리
 */
public interface NewsRepository extends MongoRepository<News, String> {
    List<News> findByTitleContaining(String keyword); // 키워드 검색용
    List<News> findByTitleContainingOrderByPublishedAtDesc(String keyword); // 키워드 검색 + 최신순 정렬
    
    // publishedAt이 null이 아닌 뉴스만 조회
    List<News> findByPublishedAtIsNotNullOrderByPublishedAtDesc(Pageable pageable);
    List<News> findByTitleContainingAndPublishedAtIsNotNullOrderByPublishedAtDesc(String keyword);
}
