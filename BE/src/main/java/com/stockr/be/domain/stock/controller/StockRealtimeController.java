package com.stockr.be.domain.stock.controller;

import com.stockr.be.domain.stock.service.StockRealtimeService;
import com.stockr.be.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/stocks/realtime")
@RequiredArgsConstructor
public class StockRealtimeController {
    
    private final StockRealtimeService stockRealtimeService;
    
    @PostMapping("/subscribe/{stockCode}")
    public ApiResponse<String> subscribeStockPrice(@PathVariable String stockCode) {
        stockRealtimeService.subscribeStockPrice(stockCode);
        return ApiResponse.success("Successfully subscribed to stock price for: " + stockCode);
    }
    
    @PostMapping("/unsubscribe/{stockCode}")
    public ApiResponse<String> unsubscribeStockPrice(@PathVariable String stockCode) {
        stockRealtimeService.unsubscribeStockPrice(stockCode);
        return ApiResponse.success("Successfully unsubscribed from stock price for: " + stockCode);
    }
} 