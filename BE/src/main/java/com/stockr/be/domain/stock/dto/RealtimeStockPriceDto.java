package com.stockr.be.domain.stock.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RealtimeStockPriceDto {
    private String ticker;
    private String stockCode;
    private double price;
    private long volume;
    private long timestamp;
}