package com.stockr.be.domain.trade.controller;

import com.stockr.be.domain.stock.service.StockRealtimeService;
import com.stockr.be.domain.trade.client.StockWebSocketClient;
import com.stockr.be.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/test/websocket")
@RequiredArgsConstructor
public class WebSocketTestController {

    private final StockRealtimeService stockRealtimeService;
    private final StockWebSocketClient stockWebSocketClient;

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

    @PostMapping("/mock/{stockCode}")
    public ApiResponse<String> sendMockData(
            @PathVariable String stockCode,
            @RequestParam Long price,
            @RequestParam(required = false, defaultValue = "100000") Long volume) {

        try {
            // 테스트용 메시지 생성 (KIS API 형식)
            StringBuilder mockData = new StringBuilder();
            mockData.append("0|H0STASP0|TEST|");
            mockData.append(stockCode).append("^"); // 종목코드
            mockData.append("1430^"); // 시각
            mockData.append(price).append("^"); // 현재가
            mockData.append("2^"); // 전일대비구분
            mockData.append("0^"); // 전일대비
            mockData.append("0^"); // 등락률 (0.0 -> 0으로 변경)

            // 매도호가 10개 (현재가 기준으로 상승)
            for (int i = 1; i <= 10; i++) {
                mockData.append(price + (i * 100)).append("^");
            }

            // 매수호가 10개 (현재가 기준으로 하락)
            for (int i = 1; i <= 10; i++) {
                mockData.append(price - (i * 100)).append("^");
            }

            // 매도호가잔량 10개
            for (int i = 0; i < 10; i++) {
                mockData.append(volume).append("^");
            }

            // 매수호가잔량 10개
            for (int i = 0; i < 10; i++) {
                mockData.append(volume).append("^");
            }

            // 총매도호가잔량과 총매수호가잔량
            mockData.append(volume * 10).append("^");
            mockData.append(volume * 10);

            // 직접 메시지 처리
            stockWebSocketClient.handleMockMessage(mockData.toString());

            return ApiResponse.success("Mock data processed for stock: " + stockCode);
        } catch (Exception e) {
            return ApiResponse.error("Failed to process mock data: " + e.getMessage());
        }
    }
}