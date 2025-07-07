package com.stockr.be.domain.trade.entity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "orders")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order {
    @Id
    private String id;
    
    private String accountId;
    private String stockCode;
    private OrderType orderType;
    private OrderStatus status;
    private int quantity;
    private BigDecimal price;
    private LocalDateTime orderTime;
    private LocalDateTime executionTime;
    private String kisOrderId;  // 한투증권 주문번호
    
    @Builder
    public Order(String accountId, String stockCode, OrderType orderType, 
                int quantity, BigDecimal price) {
        this.accountId = accountId;
        this.stockCode = stockCode;
        this.orderType = orderType;
        this.status = OrderStatus.PENDING;
        this.quantity = quantity;
        this.price = price;
        this.orderTime = LocalDateTime.now();
    }
    
    public void complete(String kisOrderId) {
        this.kisOrderId = kisOrderId;
        this.status = OrderStatus.COMPLETED;
        this.executionTime = LocalDateTime.now();
    }
    
    public void fail() {
        this.status = OrderStatus.FAILED;
    }
}