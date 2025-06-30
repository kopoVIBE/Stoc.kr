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
    private long marketCap;          // 시가총액
    
    // 표준화 지표들
    private float epsStd;            // EPS 표준화
    private float perStd;            // PER 표준화
    private float forwardEpsStd;     // 선행 EPS 표준화
    private float forwardPerStd;     // 선행 PER 표준화
    private float bpsStd;            // BPS 표준화
    private float pbrStd;            // PBR 표준화
    private float dividendPerShareStd;  // 주당 배당금 표준화
    private float dividendYieldStd;     // 배당 수익률 표준화
    private float marketCapStd;         // 시가총액 표준화
    
    // 추가 지표
    private float beta;               // 베타 계수
    private float return1yPercent;    // 1년 수익률
    private float returnVolatility;   // 수익률 변동성
    
    private long currentPrice;  // 현재가
    private long volume;        // 거래량
    private LocalDateTime lastUpdated; // 마지막 업데이트 시간
} 