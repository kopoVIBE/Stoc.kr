package com.stockr.be.domain.stock.dto;

import com.stockr.be.domain.stock.entity.StockPrice;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class StockPriceResponse {
    private final String ticker;
    private final String stockName;
    private final String interval;
    private final List<PriceData> prices;

    @Getter
    @Builder
    public static class PriceData {
        private final LocalDateTime date;
        private final Long open;
        private final Long high;
        private final Long low;
        private final Long close;
        private final Long volume;

        public static PriceData from(StockPrice stockPrice) {
            return PriceData.builder()
                    .date(stockPrice.getDate())
                    .open(stockPrice.getOpen())
                    .high(stockPrice.getHigh())
                    .low(stockPrice.getLow())
                    .close(stockPrice.getClose())
                    .volume(stockPrice.getVolume())
                    .build();
        }
    }

    public static StockPriceResponse from(String ticker, String stockName, String interval, List<StockPrice> prices) {
        return StockPriceResponse.builder()
                .ticker(ticker)
                .stockName(stockName)
                .interval(interval)
                .prices(prices.stream()
                        .map(PriceData::from)
                        .collect(Collectors.toList()))
                .build();
    }
} 