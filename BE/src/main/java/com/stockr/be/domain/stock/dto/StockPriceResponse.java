package com.stockr.be.domain.stock.dto;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class StockPriceResponse {
    private String ticker;
    private String interval;
    private List<StockPriceDto> prices;
    private MetaData meta;

    @Getter
    @Builder
    public static class MetaData {
        private int totalCount;
        private String startDate;
        private String endDate;
    }
} 