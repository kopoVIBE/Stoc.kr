package com.stockr.be.domain.trade.dto;

import com.stockr.be.domain.trade.entity.Order;
import com.stockr.be.domain.trade.entity.OrderStatus;
import com.stockr.be.domain.trade.entity.OrderType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class OrderResponseDto {
    private String orderId;
    private String accountId;
    private String stockCode;
    private OrderType orderType;
    private OrderStatus status;
    private int quantity;
    private BigDecimal price;
    private LocalDateTime orderTime;
    private LocalDateTime executionTime;
    private String kisOrderId;

    public static OrderResponseDto from(Order order) {
        return OrderResponseDto.builder()
                .orderId(order.getId())
                .accountId(order.getAccountId())
                .stockCode(order.getStockCode())
                .orderType(order.getOrderType())
                .status(order.getStatus())
                .quantity(order.getQuantity())
                .price(order.getPrice())
                .orderTime(order.getOrderTime())
                .executionTime(order.getExecutionTime())
                .kisOrderId(order.getKisOrderId())
                .build();
    }
} 