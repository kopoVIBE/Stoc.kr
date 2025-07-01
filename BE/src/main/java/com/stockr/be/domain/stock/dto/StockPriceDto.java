package com.stockr.be.domain.stock.dto;

import com.stockr.be.domain.stock.entity.StockPrice;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class StockPriceDto {
    private final String ticker;
    private final LocalDateTime date;
    private final String interval;
    private final Long open;
    private final Long high;
    private final Long low;
    private final Long close;
    private final Long volume;

    public static StockPriceDto from(StockPrice stockPrice) {
        return StockPriceDto.builder()
                .ticker(stockPrice.getTicker())
                .date(stockPrice.getDate())
                .interval(stockPrice.getInterval())
                .open(stockPrice.getOpen())
                .high(stockPrice.getHigh())
                .low(stockPrice.getLow())
                .close(stockPrice.getClose())
                .volume(stockPrice.getVolume())
                .build();
    }
}