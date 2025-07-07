package com.stockr.be.domain.stock.controller;

import com.stockr.be.domain.stock.dto.StockPriceResponse;
import com.stockr.be.domain.stock.service.StockPriceService;
import com.stockr.be.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/stocks")
@RequiredArgsConstructor
public class StockPriceController {

    private final StockPriceService stockPriceService;

    @GetMapping("/{ticker}/prices")
    public ApiResponse<StockPriceResponse> getPrices(
            @PathVariable String ticker,
            @RequestParam(defaultValue = "daily") String interval,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
            @RequestParam(required = false) Integer limit
    ) {
        StockPriceResponse response = stockPriceService.getPrices(ticker, interval, startDate, endDate, limit);
        return ApiResponse.success(response);
    }

    @GetMapping("/{ticker}/prices/{date}")
    public ApiResponse<StockPriceResponse> getPriceByDate(
            @PathVariable String ticker,
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate date,
            @RequestParam(defaultValue = "daily") String interval
    ) {
        StockPriceResponse response = stockPriceService.getPriceByDate(ticker, interval, date);
        return ApiResponse.success(response);
    }

    @GetMapping("/prices/latest")
    public ApiResponse<List<StockPriceResponse>> getLatestPrices(
            @RequestParam List<String> tickers
    ) {
        List<StockPriceResponse> response = stockPriceService.getLatestPrices(tickers);
        return ApiResponse.success(response);
    }
}