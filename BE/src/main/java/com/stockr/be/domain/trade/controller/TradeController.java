package com.stockr.be.domain.trade.controller;

import com.stockr.be.domain.trade.dto.OrderResponseDto;
import com.stockr.be.domain.trade.dto.TradeRequestDto;
import com.stockr.be.domain.trade.service.TradeService;
import com.stockr.be.global.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/trade")
@RequiredArgsConstructor
public class TradeController {
    private final TradeService tradeService;
    
    @PostMapping("/order")
    public Mono<ApiResponse<OrderResponseDto>> createOrder(@RequestBody @Valid TradeRequestDto request) {
        return tradeService.createOrder(request)
                .map(ApiResponse::success);
    }
} 