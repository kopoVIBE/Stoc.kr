package com.stockr.be.domain.stock.controller;

import com.stockr.be.domain.stock.dto.StockPriceDto;
import com.stockr.be.domain.stock.service.StockPriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class StockWebSocketController {

    private final StockPriceService stockPriceService;

    @MessageMapping("/price")
    @SendTo("/topic/price")
    public StockPriceDto handleStockPrice(StockPriceDto priceData) {
        return stockPriceService.savePrice(priceData);
    }
}