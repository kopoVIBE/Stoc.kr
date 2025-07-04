package com.stockr.be.domain.trading.dto;

import java.math.BigDecimal;
import com.stockr.be.domain.trading.entity.TradingOrderType;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class LimitOrderRequestDto {
    private String stockId; // 종목 코드
    private TradingOrderType orderType; // 주문 유형 (매수/매도)
    private Long quantity; // 주문 수량
    private BigDecimal price; // 주문 가격
}