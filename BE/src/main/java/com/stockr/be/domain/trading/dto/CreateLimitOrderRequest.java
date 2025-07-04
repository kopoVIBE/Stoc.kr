package com.stockr.be.domain.trading.dto;

import com.stockr.be.domain.trading.entity.TradingOrderType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
public class CreateLimitOrderRequest {

    @NotNull
    private String stockId;

    @NotNull
    private TradingOrderType orderType;

    @NotNull
    @Min(1)
    private Long quantity;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal price;
}