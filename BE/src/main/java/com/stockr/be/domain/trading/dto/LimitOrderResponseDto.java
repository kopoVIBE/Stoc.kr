package com.stockr.be.domain.trading.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.stockr.be.domain.trading.entity.LimitOrder;
import com.stockr.be.domain.trading.entity.TradingOrderStatus;
import com.stockr.be.domain.trading.entity.TradingOrderType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LimitOrderResponseDto {
    private Long id; // 주문 ID
    private String stockId; // 종목 코드
    private TradingOrderType orderType; // 주문 유형 (매수/매도)
    private Long quantity; // 주문 수량
    private BigDecimal price; // 주문 가격
    private TradingOrderStatus status; // 주문 상태
    private LocalDateTime createdAt; // 주문 생성 시간

    public static LimitOrderResponseDto from(LimitOrder order) {
        return LimitOrderResponseDto.builder()
                .id(order.getId())
                .stockId(order.getStock().getStockId())
                .orderType(order.getOrderType())
                .quantity(order.getQuantity())
                .price(order.getPrice())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .build();
    }
}