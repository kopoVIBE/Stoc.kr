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

import java.util.HashMap;
import java.util.Map;

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
        
        // Python 데이터를 프론트엔드 형식으로 변환
        Map<String, Object> frontendData = new HashMap<>();
        frontendData.put("ticker", priceData.getTicker());
        frontendData.put("stockCode", priceData.getStockCode());
        frontendData.put("price", priceData.getPrice());
        frontendData.put("volume", priceData.getVolume());
        frontendData.put("timestamp", priceData.getTimestamp());
        
        log.info("프론트엔드로 전송할 데이터: {}", frontendData);
        
        // 프론트엔드로 전송
        messagingTemplate.convertAndSend("/topic/price/" + stockCode, frontendData);
        
        // 기존 서비스 로직 호출 (필요 시)
        // RealtimeStockPriceDto dto = convertToRealtimeStockPriceDto(priceData);
        // stockPriceService.handleRealtimePrice(dto);
    }
}
