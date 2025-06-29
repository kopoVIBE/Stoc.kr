package com.stockr.be.domain.stock.dto;

import com.stockr.be.domain.stock.entity.StockPrice;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class StockPriceDto {
    private String ticker;
    private String stockCode;
    private long price;
    private long volume;
    private long timestamp;

    public static StockPriceDto from(StockPrice stockPrice) {
        return StockPriceDto.builder()
                .ticker(stockPrice.getTicker())
                .stockCode(stockPrice.getTicker()) // ticker를 stockCode로도 사용
                .price(stockPrice.getPrice())
                .volume(stockPrice.getVolume())
                .timestamp(Long.parseLong(stockPrice.getTimestamp().toString()))
                .build();
    }
}