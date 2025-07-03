package com.stockr.be.domain.trade.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class KISOrderResponse {
    private String status;
    private KISOrderData data;
} 