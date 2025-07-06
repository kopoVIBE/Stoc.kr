package com.stockr.be.domain.trade.controller;

import com.stockr.be.domain.stock.service.StockRealtimeService;
import com.stockr.be.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/test/websocket")
@RequiredArgsConstructor
public class WebSocketTestController {

    private final StockRealtimeService stockRealtimeService;

    @PostMapping("/subscribe/{stockCode}")
    public ApiResponse<String> testSubscribe(@PathVariable String stockCode) {
        stockRealtimeService.subscribeStockPrice(stockCode);
        return ApiResponse.success("Subscription test initiated for stock: " + stockCode);
    }

    @PostMapping("/unsubscribe/{stockCode}")
    public ApiResponse<String> testUnsubscribe(@PathVariable String stockCode) {
        stockRealtimeService.unsubscribeStockPrice(stockCode);
        return ApiResponse.success("Unsubscription test initiated for stock: " + stockCode);
    }
}