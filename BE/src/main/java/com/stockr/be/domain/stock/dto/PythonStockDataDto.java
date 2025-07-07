package com.stockr.be.domain.stock.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PythonStockDataDto {
    private String ticker;
    private String stockCode;
    private long price;
    private long volume;
    private long timestamp;
} 