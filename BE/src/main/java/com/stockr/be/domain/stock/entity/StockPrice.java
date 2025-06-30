package com.stockr.be.domain.stock.entity;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Document(collection = "stock_prices")
public class StockPrice {
    @Id
    private String id;

    @Field("ticker")
    private String ticker;

    @Field("date")
    private LocalDateTime date;

    @Field("interval")
    private String interval;

    @Field("open")
    private Long open;

    @Field("high")
    private Long high;

    @Field("low")
    private Long low;

    @Field("close")
    private Long close;

    @Field("volume")
    private Long volume;

    @Builder
    public StockPrice(String ticker, LocalDateTime date, String interval,
                     Long open, Long high, Long low, Long close, Long volume) {
        this.ticker = ticker;
        this.date = date;
        this.interval = interval;
        this.open = open;
        this.high = high;
        this.low = low;
        this.close = close;
        this.volume = volume;
    }
}