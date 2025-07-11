package com.stockr.be.domain.stock.controller;

import com.stockr.be.domain.stock.dto.StockResponseDto;
import com.stockr.be.domain.stock.entity.Stock;
import com.stockr.be.domain.stock.service.StockService;
import com.stockr.be.domain.stock.service.StockRecommendationService;
import com.stockr.be.global.common.ApiResponse;
import com.stockr.be.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
public class StockController {
    private final StockService stockService;
    private final StockRecommendationService stockRecommendationService;
    
    @GetMapping
    public ResponseEntity<List<StockResponseDto>> getStocks(
            @RequestParam(required = false) List<String> tickers) {
        if (tickers != null && !tickers.isEmpty()) {
            return ResponseEntity.ok(stockService.getStocks(tickers));
        }
        return ResponseEntity.ok(stockService.getAllStocks());
    }
    
    @GetMapping("/top-market-cap")
    public ResponseEntity<List<StockResponseDto>> getTopMarketCapStocks() {
        return ResponseEntity.ok(stockService.getTopMarketCapStocks());
    }

    @GetMapping("/industry-types")
    public ResponseEntity<List<String>> getIndustryTypes() {
        return ResponseEntity.ok(stockService.getIndustryTypes());
    }

    @GetMapping("/industry")
    public ResponseEntity<List<Stock>> getStocksByIndustry(@RequestParam String industryType) {
        List<Stock> stocks = stockService.getStocksByIndustry(industryType);
        return ResponseEntity.ok(stocks);
    }
    
    @GetMapping("/{ticker}")
    public ResponseEntity<StockResponseDto> getStock(@PathVariable String ticker) {
        return ResponseEntity.ok(stockService.getStock(ticker));
    }
    
    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<List<StockResponseDto>>> getRecommendedStocks(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "4") int limit) {
        try {
            String investmentStyle = user.getInvestmentStyle();
            if (investmentStyle == null || investmentStyle.trim().isEmpty()) {
                // 투자자 성향이 설정되지 않은 경우 시가총액 상위 종목 반환 (보유 종목 제외)
                List<StockResponseDto> fallbackStocks = stockRecommendationService.getFallbackRecommendationsExcludingHoldings(
                    stockRecommendationService.getUserHoldingTickers(user.getUserId()), limit);
                return ResponseEntity.ok(ApiResponse.success(fallbackStocks));
            }
            
            List<StockResponseDto> recommendations = stockRecommendationService.getRecommendedStocksByInvestmentStyle(investmentStyle, user.getUserId(), limit);
            return ResponseEntity.ok(ApiResponse.success(recommendations));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("추천 종목 조회에 실패했습니다."));
        }
    }
} 