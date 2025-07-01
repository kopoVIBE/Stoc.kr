package com.stockr.be.domain.stock.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockFinancialRatioDto {
    private String ticker;
    private String date;
    private Double per;
    private Double psr;
    private Double pbr;
    private Double eps;
    private Double bps;
    private Double roe;
    private Double price;
} 