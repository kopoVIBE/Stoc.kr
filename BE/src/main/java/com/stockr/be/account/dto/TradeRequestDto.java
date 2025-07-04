package com.stockr.be.account.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TradeRequestDto {
    private String ticker;
    private Integer quantity;
    private Double price;
    private String type; // "BUY" or "SELL"
} 