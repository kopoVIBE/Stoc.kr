package com.stockr.be.domain.stock.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockr.be.domain.stock.entity.StockPrice;
import com.stockr.be.global.exception.BusinessException;
import com.stockr.be.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class StockPriceRepositoryImpl implements StockPriceRepository {
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String KEY_PREFIX = "stock:price:";

    @Override
    public void save(StockPrice stockPrice) {
        try {
            String key = KEY_PREFIX + stockPrice.getTicker();
            String value = objectMapper.writeValueAsString(stockPrice);
            redisTemplate.opsForValue().set(key, value);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.INVALID_STOCK_PRICE, "Failed to save stock price");
        }
    }

    @Override
    public Optional<StockPrice> findLatestByTicker(String ticker) {
        String key = KEY_PREFIX + ticker;
        String value = redisTemplate.opsForValue().get(key);

        if (value == null) {
            return Optional.empty();
        }

        try {
            return Optional.of(objectMapper.readValue(value, StockPrice.class));
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.INVALID_STOCK_PRICE, "Failed to parse stock price");
        }
    }
}