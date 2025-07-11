package com.stockr.be.domain.stock.dto;

import com.stockr.be.domain.stock.entity.StockPrediction;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class StockPredictionResponseDto {
    private String stock_code;
    private Integer prediction;
    private LocalDateTime predicted_at;

    public StockPredictionResponseDto(StockPrediction prediction) {
        this.stock_code = prediction.getStockCode();
        this.prediction = prediction.getPrediction();
        this.predicted_at = prediction.getPredictedAt();
    }
} 