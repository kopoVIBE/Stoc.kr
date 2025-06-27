package com.stockr.be.domain.stock.entity;

import lombok.Builder;
import lombok.Getter;
import java.time.Instant;

@Getter
@Builder
public class StockPrice {
    private final String ticker;
    private final double price;
    private final double volume;
    private final Instant timestamp;

    public static StockPrice of(String ticker, double price, double volume) {
        return StockPrice.builder()
                .ticker(ticker)
                .price(price)
                .volume(volume)
                .timestamp(Instant.now())
                .build();
    }
}