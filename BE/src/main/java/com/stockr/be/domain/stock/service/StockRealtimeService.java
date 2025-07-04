package com.stockr.be.domain.stock.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockr.be.domain.trade.client.StockWebSocketClient;
import com.stockr.be.global.config.KISConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockRealtimeService {
    
    private final StockWebSocketClient webSocketClient;
    private final KISConfig kisConfig;
    private final ObjectMapper objectMapper;
    
    /**
     * 실시간 호가 구독
     * @param stockCode 종목코드
     */
    public void subscribeStockPrice(String stockCode) {
        try {
            // 1. 실시간 시세 요청 TR: H0STASP0 (주식 호가)
            Map<String, String> header = new HashMap<>();
            header.put("appkey", kisConfig.getVirtual().getKey());
            header.put("appsecret", kisConfig.getVirtual().getSecret());
            header.put("custtype", "P");
            header.put("tr_type", "1");
            header.put("tr_id", "H0STASP0"); // 주식 호가 TR ID

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
            
            log.info("Subscribed to stock price for: {}", stockCode);
            
        } catch (Exception e) {
            log.error("Failed to subscribe stock price for: " + stockCode, e);
            throw new RuntimeException("Failed to subscribe stock price", e);
        }
    }
    
    /**
     * 실시간 호가 구독 취소
     * @param stockCode 종목코드
     */
    public void unsubscribeStockPrice(String stockCode) {
        try {
            Map<String, String> header = new HashMap<>();
            header.put("appkey", kisConfig.getVirtual().getKey());
            header.put("appsecret", kisConfig.getVirtual().getSecret());
            header.put("custtype", "P");
            header.put("tr_type", "2"); // 구독 취소
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
            
            log.info("Unsubscribed from stock price for: {}", stockCode);
            
        } catch (Exception e) {
            log.error("Failed to unsubscribe stock price for: " + stockCode, e);
            throw new RuntimeException("Failed to unsubscribe stock price", e);
        }
    }
} 