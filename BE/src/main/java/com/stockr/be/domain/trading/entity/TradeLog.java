package com.stockr.be.domain.trading.entity;

import com.stockr.be.account.domain.Account;
import com.stockr.be.domain.stock.entity.Stock;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "trade_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TradeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "executed_order_id", nullable = false)
    private LimitOrder executedOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stock;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TradingOrderType orderType;

    @Column(nullable = false)
    private Long executedQuantity;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal executedPrice;

    @Column(nullable = false)
    private LocalDateTime executedAt;

    @Builder
    public TradeLog(LimitOrder executedOrder, Account account, Stock stock, TradingOrderType orderType,
            Long executedQuantity, BigDecimal executedPrice) {
        this.executedOrder = executedOrder;
        this.account = account;
        this.stock = stock;
        this.orderType = orderType;
        this.executedQuantity = executedQuantity;
        this.executedPrice = executedPrice;
        this.executedAt = LocalDateTime.now();
    }
}