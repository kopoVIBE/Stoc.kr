package com.stockr.be.domain.stock.controller;

import com.stockr.be.domain.stock.dto.PythonStockDataDto;
import com.stockr.be.domain.stock.dto.RealtimeStockPriceDto;
import com.stockr.be.domain.stock.service.StockPriceService;
import com.stockr.be.domain.stock.service.StockRealtimeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class StockWebSocketController {

    private final StockRealtimeService stockRealtimeService;
    private final StockPriceService stockPriceService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/stocks/subscribe")
    public void subscribe(String stockCode) {
        stockRealtimeService.subscribeStockPrice(stockCode);
    }

    @MessageMapping("/price/{stockCode}")
    public void handleStockPrice(@DestinationVariable String stockCode, @Payload PythonStockDataDto priceData) {
        log.info("실시간 데이터 수신 from Python: {}, 데이터: {}", stockCode, priceData.getPrice());
        // Python에서 받은 데이터를 프론트엔드로 전송
        messagingTemplate.convertAndSend("/topic/price/" + stockCode, priceData);

        // 기존 서비스 로직 호출 (필요 시) - DTO 변환 필요
        // RealtimeStockPriceDto dto = convertToRealtimeStockPriceDto(priceData);
        // stockPriceService.handleRealtimePrice(dto);
    }
}