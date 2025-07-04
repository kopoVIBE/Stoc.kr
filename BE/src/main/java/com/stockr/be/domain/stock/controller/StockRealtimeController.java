package com.stockr.be.domain.stock.controller;

import java.util.Set;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.stockr.be.domain.stock.service.StockRealtimeService;
import com.stockr.be.global.common.ApiResponse;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class StockRealtimeController {
    
    private final StockRealtimeService stockRealtimeService;
    
    // === REST API for Python Crawler ===
    @PostMapping("/api/v1/stocks/{stockCode}/subscribe")
    @ResponseBody
    public ApiResponse<?> addTargetStock(@PathVariable String stockCode) {
        stockRealtimeService.addTargetStock(stockCode);
        return ApiResponse.success("Successfully added target stock: " + stockCode, null);
    }
    
    @PostMapping("/api/v1/stocks/{stockCode}/unsubscribe")
    @ResponseBody
    public ApiResponse<?> removeTargetStock(@PathVariable String stockCode) {
        stockRealtimeService.removeTargetStock(stockCode);
        return ApiResponse.success("Successfully removed target stock: " + stockCode, null);
    }
    
    @GetMapping("/api/v1/stocks/subscribe/list")
    @ResponseBody
    public ApiResponse<Set<String>> getSubscribedList() {
        return ApiResponse.success(stockRealtimeService.getTargetStocks());
    }
    
    // === WebSocket Messages for KIS Order Book ===
    @MessageMapping("/subscribe/{stockCode}")
    public void subscribeOrderBook(@DestinationVariable String stockCode) {
        stockRealtimeService.subscribeStockPrice(stockCode);
    }
    
    @MessageMapping("/unsubscribe/{stockCode}")
    public void unsubscribeOrderBook(@DestinationVariable String stockCode) {
        stockRealtimeService.unsubscribeStockPrice(stockCode);
    }
} 