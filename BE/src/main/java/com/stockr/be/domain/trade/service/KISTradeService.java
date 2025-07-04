package com.stockr.be.domain.trade.service;

import com.stockr.be.domain.trade.dto.TradeRequestDto;
import com.stockr.be.domain.trade.entity.OrderType;
import com.stockr.be.global.config.KISConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class KISTradeService {
    private final KISConfig kisConfig;
    private final WebClient kisWebClient;

    public String createOrder(TradeRequestDto request) {
        // 실제 구현에서는 토큰 발급 및 API 호출 로직이 들어갑니다.
        // 현재는 테스트를 위한 더미 응답을 반환합니다.
        JSONObject orderRequest = new JSONObject()
                .put("stockCode", request.getStockCode())
                .put("orderType", request.getOrderType() == OrderType.BUY ? "BUY" : "SELL")
                .put("quantity", request.getQuantity())
                .put("price", request.getPrice());

        log.info("주문 요청: {}", orderRequest.toString());
        
        // TODO: 실제 한투증권 API 호출 구현
        return "DUMMY_ORDER_" + System.currentTimeMillis();
    }

    private String getToken() {
        // TODO: 실제 토큰 발급 로직 구현
        return "DUMMY_TOKEN";
    }
} 