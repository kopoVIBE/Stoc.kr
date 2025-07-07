package com.stockr.be.domain.stock.controller;

import com.stockr.be.domain.stock.dto.StockResponseDto;
import com.stockr.be.domain.stock.entity.Stock;
import com.stockr.be.domain.stock.service.StockService;
import com.stockr.be.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
public class StockController {
    private final StockService stockService;
    
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

    @GetMapping("/industry")
    public ResponseEntity<List<Stock>> getStocksByIndustry(@RequestParam String industryType) {
        List<Stock> stocks = stockService.getStocksByIndustry(industryType);
        return ResponseEntity.ok(stocks);
    }
    
    @GetMapping("/{ticker}")
    public ResponseEntity<StockResponseDto> getStock(@PathVariable String ticker) {
        return ResponseEntity.ok(stockService.getStock(ticker));
    }
} 