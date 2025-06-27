package com.stockr.be.domain.stock.dto;

import com.stockr.be.domain.stock.entity.StockPrice;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StockPriceDto {
    private String ticker;
    private double price;
    private double volume;
    private String timestamp;

    public static StockPriceDto from(StockPrice stockPrice) {
        return StockPriceDto.builder()
                .ticker(stockPrice.getTicker())
                .price(stockPrice.getPrice())
                .volume(stockPrice.getVolume())
                .timestamp(stockPrice.getTimestamp().toString())
                .build();
    }
}