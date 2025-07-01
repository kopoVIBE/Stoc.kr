package com.stockr.be.domain.stock.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "stocks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Stock {
    @Id
    @Column(name = "stock_id")
    private String ticker;  // 종목 코드
    
    @Column(name = "stock_name")
    private String name;  // 종목명
    private int closePrice;    // 종가
    private float priceDiff;   // 전일 대비 변화량
    private float fluctuationRate;  // 등락률
    private float eps;         // 주당순이익
    private float per;         // PER
    private float forwardEps;  // 선행 EPS
    private float forwardPer;  // 선행 PER
    private float bps;         // 주당순자산
    private float pbr;         // PBR
    private float dividendPerShare;  // 주당 배당금
    private float dividendYield;     // 배당 수익률
    private String marketType;       // 시장 구분
    private String industryType;     // 업종명
    private float marketCap;         // 시가총액
} 