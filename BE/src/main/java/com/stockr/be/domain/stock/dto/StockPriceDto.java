package com.stockr.be.domain.stock.dto;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class StockPriceDto {
    private String ticker;
    private LocalDateTime date;
    private String interval;  // daily, weekly, monthly
    private double open;
    private double high;
    private double low;
    private double close;
    private double volume;
}