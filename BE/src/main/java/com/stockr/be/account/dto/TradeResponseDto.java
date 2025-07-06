package com.stockr.be.account.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TradeResponseDto {
    private String ticker;
    private Integer quantity;
    private BigDecimal tradedPrice;
    private BigDecimal totalAmount;
    private BigDecimal remainingBalance;
    private String type;
    private String status;
} 