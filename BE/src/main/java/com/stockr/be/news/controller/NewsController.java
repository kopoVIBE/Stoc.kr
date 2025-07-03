package com.stockr.be.news.controller;

import com.stockr.be.news.dto.NewsResponseDto;
import com.stockr.be.news.service.NewsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 뉴스 관련 API 컨트롤러
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/news")
public class NewsController {

    private final NewsService newsService;

    @GetMapping
    public List<NewsResponseDto> getAllNews() {
        return newsService.getAllNews();
    }

    @GetMapping("/search")
    public List<NewsResponseDto> searchNews(@RequestParam String keyword) {
        return newsService.searchNewsByKeyword(keyword);
    }
}
