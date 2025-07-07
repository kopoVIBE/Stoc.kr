package com.stockr.be.domain.stock.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RealtimeStockPriceDto {
    @JsonProperty("stock_code")
    private String stockCode;

    @JsonProperty("hour")
    private String hour;

    @JsonProperty("price")
    private Long price;

    @JsonProperty("compare_yesterday_sign")
    private String compareYesterdaySign;

    @JsonProperty("compare_yesterday")
    private Double compareYesterday;

    @JsonProperty("compare_yesterday_rate")
    private Double compareYesterdayRate;

    @JsonProperty("accumulated_trade_volume")
    private Long accumulatedTradeVolume;
}