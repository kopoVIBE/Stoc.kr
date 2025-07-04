package com.stockr.be.domain.stock.entity;

import com.stockr.be.account.domain.Account;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_holdings", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "account_id", "stock_id" })
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StockHolding {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stock;

    @Column(nullable = false)
    private Long quantity; // 보유 수량

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal averagePurchasePrice; // 평균 매수가

    @Column(nullable = false)
    private LocalDateTime lastModifiedAt;

    @Builder
    public StockHolding(Account account, Stock stock, Long quantity, BigDecimal averagePurchasePrice) {
        this.account = account;
        this.stock = stock;
        this.quantity = quantity;
        this.averagePurchasePrice = averagePurchasePrice;
        this.lastModifiedAt = LocalDateTime.now();
    }

    public void updateQuantityAndPrice(Long quantity, BigDecimal averagePurchasePrice) {
        this.quantity = quantity;
        this.averagePurchasePrice = averagePurchasePrice;
        this.lastModifiedAt = LocalDateTime.now();
    }
}