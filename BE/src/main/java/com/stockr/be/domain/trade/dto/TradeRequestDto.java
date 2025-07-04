package com.stockr.be.domain.trade.dto;

import com.stockr.be.domain.trade.entity.OrderType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
public class TradeRequestDto {
    @NotBlank(message = "계좌 ID는 필수입니다.")
    private String accountId;
    
    @NotBlank(message = "종목 코드는 필수입니다.")
    private String stockCode;
    
    @NotNull(message = "주문 유형은 필수입니다.")
    private OrderType orderType;
    
    @Min(value = 1, message = "수량은 1 이상이어야 합니다.")
    private int quantity;
    
    @NotNull(message = "가격은 필수입니다.")
    private BigDecimal price;
} 