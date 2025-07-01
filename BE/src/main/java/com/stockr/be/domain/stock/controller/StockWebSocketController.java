package com.stockr.be.domain.stock.controller;

import com.stockr.be.domain.stock.dto.RealtimeStockPriceDto;
import com.stockr.be.domain.stock.service.StockPriceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.util.Set;

@Slf4j
@Controller
@RequiredArgsConstructor
public class StockWebSocketController {

    private final StockPriceService stockPriceService;
    private final SimpMessagingTemplate messagingTemplate;
    private final StringRedisTemplate stringRedisTemplate;

    private static final String TARGET_STOCKS_REDIS_KEY = "target_stocks";

    @MessageMapping("/price/{stockCode}")
    @SendTo("/topic/price/{stockCode}")
    public RealtimeStockPriceDto handleStockPrice(@DestinationVariable String stockCode, RealtimeStockPriceDto priceData) {
        log.info("실시간 시세 데이터 수신 - 종목코드: {}, 데이터: {}", stockCode, priceData);
        
        if (!stockCode.equals(priceData.getStockCode())) {
            log.warn("URL의 종목 코드와 데이터의 종목 코드가 일치하지 않습니다. URL: {}, Data: {}", 
                stockCode, priceData.getStockCode());
            return null;
        }
        
        try {
            RealtimeStockPriceDto processedData = stockPriceService.handleRealtimePrice(priceData);
            if (processedData != null) {
                log.info("종목 {} 시세 처리 완료 - 가격: {}, 거래량: {}", 
                    stockCode, 
                    processedData.getPrice(), 
                    processedData.getVolume());
            } else {
                log.warn("종목 {} 시세 처리 결과가 null입니다", stockCode);
            }
            return processedData;
        } catch (Exception e) {
            log.error("종목 {} 시세 처리 중 오류 발생: {}", stockCode, e.getMessage(), e);
            return null;
        }
    }

    @MessageMapping("/stock/subscribe/{stockCode}")
    public void subscribe(@DestinationVariable String stockCode) {
        log.info("종목 구독 요청 수신: {}", stockCode);
        
        if (stockCode != null && !stockCode.isBlank()) {
            try {
                Long added = stringRedisTemplate.opsForSet().add(TARGET_STOCKS_REDIS_KEY, stockCode);
                if (added > 0) {
                    log.info("새로운 종목 추가 성공: {}", stockCode);
                } else {
                    log.info("이미 추적 중인 종목입니다: {}", stockCode);
                }
                
                // 현재 추적 중인 전체 종목 목록 로깅
                Set<String> allStocks = stringRedisTemplate.opsForSet().members(TARGET_STOCKS_REDIS_KEY);
                log.info("현재 추적 중인 전체 종목 목록: {}", allStocks);
                
            } catch (Exception e) {
                log.error("종목 {} 추가 중 Redis 오류 발생: {}", stockCode, e.getMessage(), e);
            }
        } else {
            log.warn("잘못된 종목 코드로 구독 요청됨: {}", stockCode);
        }
    }

    @MessageMapping("/stock/unsubscribe/{stockCode}")
    public void unsubscribe(@DestinationVariable String stockCode) {
        log.info("종목 구독 해제 요청 수신: {}", stockCode);
        
        if (stockCode != null && !stockCode.isBlank()) {
            try {
                Long removed = stringRedisTemplate.opsForSet().remove(TARGET_STOCKS_REDIS_KEY, stockCode);
                if (removed > 0) {
                    log.info("종목 구독 해제 성공: {}", stockCode);
                } else {
                    log.info("구독 해제할 종목이 목록에 없습니다: {}", stockCode);
                }
                
                // 남은 추적 종목 목록 로깅
                Set<String> remainingStocks = stringRedisTemplate.opsForSet().members(TARGET_STOCKS_REDIS_KEY);
                log.info("구독 해제 후 남은 종목 목록: {}", remainingStocks);
                
            } catch (Exception e) {
                log.error("종목 {} 구독 해제 중 Redis 오류 발생: {}", stockCode, e.getMessage(), e);
            }
        } else {
            log.warn("잘못된 종목 코드로 구독 해제 요청됨: {}", stockCode);
        }
    }
}