package com.stockr.be.domain.stock.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockr.be.domain.trade.client.StockWebSocketClient;
import com.stockr.be.global.config.KISConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockRealtimeService {

    private final RedisTemplate<String, String> redisTemplate;
    private static final String TARGET_STOCKS_KEY = "target_stocks";

    // KIS WebSocket-related fields
    private final StockWebSocketClient webSocketClient;
    private final KISConfig kisConfig;
    private final ObjectMapper objectMapper;

    public void addTargetStock(String stockCode) {
        redisTemplate.opsForSet().add(TARGET_STOCKS_KEY, stockCode);
        log.info("Added target stock to Redis: {}", stockCode);
    }

    public void removeTargetStock(String stockCode) {
        redisTemplate.opsForSet().remove(TARGET_STOCKS_KEY, stockCode);
        log.info("Removed target stock from Redis: {}", stockCode);
    }

    public Set<String> getTargetStocks() {
        Set<String> members = redisTemplate.opsForSet().members(TARGET_STOCKS_KEY);
        log.info("Current target stocks in Redis: {}", members);
        return members;
    }

    /**
     * 실시간 호가 구독 (일시적으로 비활성화)
     * @param stockCode 종목코드
     */
    public void subscribeStockPrice(String stockCode) {
        // KIS WebSocket 연결 충돌 방지를 위해 일시적으로 비활성화
        log.info("KIS WebSocket subscription temporarily disabled for: {}", stockCode);
        
        // 기존 코드는 주석 처리
        /*
        try {
            Map<String, String> header = new HashMap<>();
            header.put("appkey", kisConfig.getApi().getAppKey());
            header.put("appsecret", kisConfig.getApi().getAppSecret());
            header.put("custtype", "P");
            header.put("tr_type", "1"); 
            header.put("tr_id", "H0STASP0");

            Map<String, String> input = new HashMap<>();
            input.put("tr_id", "H0STASP0");
            input.put("tr_key", stockCode);

            Map<String, Object> body = new HashMap<>();
            body.put("input", input);

            Map<String, Object> request = new HashMap<>();
            request.put("header", header);
            request.put("body", body);

            String message = objectMapper.writeValueAsString(request);
            webSocketClient.send(message);

            log.info("Subscribed to KIS order book for: {}", stockCode);

        } catch (Exception e) {
            log.error("Failed to subscribe KIS order book for: " + stockCode, e);
            throw new RuntimeException("Failed to subscribe KIS order book", e);
        }
        */
    }

    /**
     * 실시간 호가 구독 취소 (일시적으로 비활성화)
     * @param stockCode 종목코드
     */
    public void unsubscribeStockPrice(String stockCode) {
        // KIS WebSocket 연결 충돌 방지를 위해 일시적으로 비활성화
        log.info("KIS WebSocket unsubscription temporarily disabled for: {}", stockCode);
        
        // 기존 코드는 주석 처리
        /*
        try {
            Map<String, String> header = new HashMap<>();
            header.put("appkey", kisConfig.getApi().getAppKey());
            header.put("appsecret", kisConfig.getApi().getAppSecret());
            header.put("custtype", "P");
            header.put("tr_type", "2");
            header.put("tr_id", "H0STASP0");

            Map<String, String> input = new HashMap<>();
            input.put("tr_id", "H0STASP0");
            input.put("tr_key", stockCode);

            Map<String, Object> body = new HashMap<>();
            body.put("input", input);

            Map<String, Object> request = new HashMap<>();
            request.put("header", header);
            request.put("body", body);

            String message = objectMapper.writeValueAsString(request);
            webSocketClient.send(message);

            log.info("Unsubscribed from KIS order book for: {}", stockCode);

        } catch (Exception e) {
            log.error("Failed to unsubscribe KIS order book for: " + stockCode, e);
            throw new RuntimeException("Failed to unsubscribe KIS order book", e);
        }
        */
    }
}
