package com.stockr.be.domain.trade.client;

import com.stockr.be.domain.trade.dto.KISOrderResponse;
import com.stockr.be.domain.trade.dto.TradeRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class KISTradeClient {
    @Value("${trade.python-service.url}")
    private String pythonServiceUrl;
    
    private final WebClient webClient;
    
    public Mono<KISOrderResponse> createOrder(String orderId, TradeRequestDto request) {
        var orderRequest = new KISOrderRequest(
            orderId,
            request.getAccountNumber(),
            request.getStockCode(),
            request.getOrderType().toString(),
            request.getQuantity(),
            request.getPrice()
        );
        
        return webClient.post()
                .uri(pythonServiceUrl + "/api/trade/order")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(orderRequest)
                .retrieve()
                .bodyToMono(KISOrderResponse.class)
                .doOnSuccess(response -> log.info("주문 요청 성공 - orderId: {}, kisOrderId: {}", 
                    orderId, response.getData().getKisOrderId()))
                .doOnError(error -> log.error("주문 요청 실패 - orderId: {}", orderId, error));
    }
    
    record KISOrderRequest(
        String orderId,
        String accountNumber,
        String stockCode,
        String orderType,
        int quantity,
        BigDecimal price
    ) {}
} 