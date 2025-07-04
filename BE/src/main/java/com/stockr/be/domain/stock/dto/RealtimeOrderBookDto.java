package com.stockr.be.domain.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.List;

@Getter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class RealtimeOrderBookDto {

    private List<OrderBookItem> askPrices; // 매도 호가
    private List<OrderBookItem> bidPrices; // 매수 호가
    private long totalAskVolume; // 매도 호가 총 잔량
    private long totalBidVolume; // 매수 호가 총 잔량

    @Getter
    @ToString
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderBookItem {
        private long price;
        private long volume;
    }
} 