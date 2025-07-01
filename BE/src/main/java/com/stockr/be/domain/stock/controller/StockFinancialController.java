package com.stockr.be.domain.stock.controller;

import com.stockr.be.domain.stock.dto.StockFinancialRatioDto;
import com.stockr.be.domain.stock.service.StockPriceService;
import com.stockr.be.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/stocks")
@RequiredArgsConstructor
public class StockFinancialController {
    private final StockPriceService stockPriceService;

    @Value("${KIS.APP.KEY}")
    private String appKey;

    @Value("${KIS.APP.SECRET}")
    private String appSecret;

    @GetMapping("/{ticker}/financial-ratio")
    public ApiResponse<StockFinancialRatioDto> getFinancialRatio(@PathVariable String ticker) {
        StockFinancialRatioDto financialRatio = stockPriceService.getFinancialRatio(ticker, appKey, appSecret);
        return ApiResponse.success(financialRatio);
    }
} 