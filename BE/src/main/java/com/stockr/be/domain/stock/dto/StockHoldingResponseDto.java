package com.stockr.be.domain.stock.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class StockHoldingResponseDto {
    private String stockCode; // 종목 코드
    private String stockName; // 종목명
    private Long quantity; // 보유 수량
    private BigDecimal averagePurchasePrice; // 평균 매수가
    private BigDecimal currentPrice; // 현재가
    private BigDecimal totalPurchaseAmount; // 총 매수금액
    private BigDecimal evaluationAmount; // 평가금액
    private BigDecimal evaluationProfitLoss; // 평가손익
    private Double profitLossRate; // 손익률 (%)
}