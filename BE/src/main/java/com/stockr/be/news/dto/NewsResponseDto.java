package com.stockr.be.news.dto;

import com.stockr.be.news.domain.News;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 클라이언트에게 전달할 뉴스 응답 DTO
 */
@Getter
@Builder
public class NewsResponseDto {

    private String id;
    private String title;
    private String content;
    private String source;
    private List<String> category;
    private String url;
    private String thumbnailUrl;
    private LocalDateTime publishedAt;
    private LocalDateTime crawledAt;
    private String type;
    private String stockCode;
    private String stockName;

    public static NewsResponseDto from(News news) {
        return NewsResponseDto.builder()
                .id(news.getId())
                .title(news.getTitle())
                .content(news.getContent())
                .source(news.getSource())
                .category(news.getCategory())
                .url(news.getUrl())
                .thumbnailUrl(news.getThumbnailUrl())
                .publishedAt(news.getPublishedAt())
                .crawledAt(news.getCrawledAt())
                .type(news.getType())
                .stockCode(news.getStockCode())
                .stockName(news.getStockName())
                .build();
    }
}
