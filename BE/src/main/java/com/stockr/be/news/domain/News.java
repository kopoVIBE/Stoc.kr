package com.stockr.be.news.domain;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.List;

/**
 * MongoDB의 news 컬렉션에 매핑되는 뉴스 도메인 객체
 */
@Document(collection = "news")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class News {

    @Id
    private String id;  // MongoDB의 _id 필드

    private String title;        // 뉴스 제목
    private String content;      // 뉴스 본문 (HTML 포함 가능)
    private String source;       // 언론사
    private List<String> category; // 뉴스 카테고리 목록
    private String url;          // 뉴스 URL
    
    @Field("thumbnail_url")  // MongoDB의 thumbnail_url 필드와 매핑
    private String thumbnailUrl; // 뉴스 썸네일 이미지 URL

    @Field("published_at")  // MongoDB의 published_at 필드와 매핑
    private LocalDateTime publishedAt; // 실제 발행 시각
    
    @Field("crawled_at")   // MongoDB의 crawled_at 필드와 매핑
    private LocalDateTime crawledAt;   // 크롤링한 시각
}
