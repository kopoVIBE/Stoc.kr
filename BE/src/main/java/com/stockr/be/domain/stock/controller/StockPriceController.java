package com.stockr.be.domain.stock.controller;

import com.stockr.be.domain.stock.dto.StockPriceDto;
import com.stockr.be.domain.stock.service.StockPriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class StockPriceController {
    private final StockPriceService stockPriceService;

    @PostMapping("/price")
    public void updatePrice(@RequestBody StockPriceDto stockPriceDto) {
        stockPriceService.updatePrice(stockPriceDto);
    }

    @GetMapping("/price/{ticker}")
    public StockPriceDto getLatestPrice(@PathVariable String ticker) {
        return stockPriceService.getLatestPrice(ticker);
    }
}