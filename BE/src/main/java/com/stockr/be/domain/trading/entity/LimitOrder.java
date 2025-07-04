package com.stockr.be.domain.trading.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.stockr.be.account.domain.Account;
import com.stockr.be.domain.stock.entity.Stock;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LimitOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "account_id")
    private Account account;

    @ManyToOne
    @JoinColumn(name = "stock_id")
    private Stock stock;

    @Enumerated(EnumType.STRING)
    private TradingOrderType orderType;

    private Long quantity;

    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    private TradingOrderStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime executedAt;

    public LimitOrder(Account account, Stock stock, TradingOrderType orderType, Long quantity, BigDecimal price,
            TradingOrderStatus status) {
        this.account = account;
        this.stock = stock;
        this.orderType = orderType;
        this.quantity = quantity;
        this.price = price;
        this.status = status;
        this.createdAt = LocalDateTime.now();
    }

    public void updateStatus(TradingOrderStatus status) {
        this.status = status;
        if (status == TradingOrderStatus.EXECUTED) {
            this.executedAt = LocalDateTime.now();
        }
    }
}