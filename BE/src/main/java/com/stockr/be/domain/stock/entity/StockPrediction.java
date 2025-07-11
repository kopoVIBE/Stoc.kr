package com.stockr.be.domain.stock.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "stock_predictions")
@Getter
@Setter
@NoArgsConstructor
public class StockPrediction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stock_code", nullable = false)
    private String stockCode;

    @Column(nullable = false)
    private Integer prediction;  // 1: 상승, 0: 하락

    @Column(name = "predicted_at", nullable = false)
    private LocalDateTime predictedAt;

    public StockPrediction(String stockCode, Integer prediction, LocalDateTime predictedAt) {
        this.stockCode = stockCode;
        this.prediction = prediction;
        this.predictedAt = predictedAt;
    }
} 