package com.stockr.be.news.controller;

import com.stockr.be.news.dto.NewsResponseDto;
import com.stockr.be.news.service.NewsService;
import com.stockr.be.news.service.NewsCrawlingScheduler;
import com.stockr.be.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    private final NewsCrawlingScheduler newsScheduler;  // ✅ 크롤러 주입

    @GetMapping
    public List<NewsResponseDto> getAllNews() {
        return newsService.getAllNews();
    }

    @GetMapping("/main")
    public List<NewsResponseDto> getMainNews() {
        return newsService.getMainNews();
    }

    @GetMapping("/personalized")
    public List<NewsResponseDto> getPersonalizedNews(@AuthenticationPrincipal User user) {
        return newsService.getPersonalizedNews(user.getUserId());
    }

    @GetMapping("/search")
    public List<NewsResponseDto> searchNews(@RequestParam String keyword) {
        return newsService.searchNewsByKeyword(keyword);
    }

    // ✅ 수동 크롤링 실행 API
    @PostMapping("/crawl")
    public String crawlNow() {
        newsScheduler.runCrawler();  // 수동으로 크롤러 실행
        return "🕒 크롤러 실행 요청됨!";
    }
}
