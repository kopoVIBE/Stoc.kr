package com.stockr.be.domain.stock.controller;

import com.stockr.be.domain.stock.dto.StockPriceDto;
import com.stockr.be.domain.stock.service.StockPriceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class StockWebSocketController {

    private final StockPriceService stockPriceService;

    @MessageMapping("/stock/price")
    @SendTo("/topic/price")
    public StockPriceDto handleStockPrice(StockPriceDto priceData) {
        log.info("실시간 주가 수신: {} - {}원",
                priceData.getStockCode(),
                String.format("%,d", priceData.getPrice()));

        // Redis에 저장하고 구독자들에게 브로드캐스트
        stockPriceService.updatePrice(priceData);

        log.info("실시간 주가 브로드캐스트 완료");
        return priceData;
    }
}