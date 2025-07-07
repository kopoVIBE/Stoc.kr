package com.stockr.be.domain.trade.controller;

import com.stockr.be.domain.trade.service.KISTestService;
import com.stockr.be.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/test/kis")
@RequiredArgsConstructor
public class KISTestController {
    
    private final KISTestService kisTestService;
    
    @GetMapping("/token")
    public ApiResponse<String> testToken() {
        return ApiResponse.success(kisTestService.testTokenGeneration());
    }
    
    @GetMapping("/balance")
    public ApiResponse<String> testBalance() {
        return ApiResponse.success(kisTestService.testBalanceInquiry());
    }
} 