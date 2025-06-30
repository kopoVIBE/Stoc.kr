package com.stockr.be.domain.stock.dto;

import com.stockr.be.domain.stock.entity.Stock;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class StockResponseDto {
    private String ticker;           // 종목 코드
    private String name;            // 종목명
    private int closePrice;         // 종가
    private float priceDiff;        // 전일 대비 변화량
    private float fluctuationRate;  // 등락률
    private float eps;              // 주당순이익
    private float per;              // PER
    private float forwardEps;       // 선행 EPS
    private float forwardPer;       // 선행 PER
    private float bps;              // 주당순자산
    private float pbr;              // PBR
    private float dividendPerShare; // 주당 배당금
    private float dividendYield;    // 배당 수익률
    private String marketType;      // 시장 구분
    private String industryType;    // 업종명
    private long marketCap;         // 시가총액
    
    // 표준화 지표들
    private float epsStd;           // EPS 표준화
    private float perStd;           // PER 표준화
    private float forwardEpsStd;    // 선행 EPS 표준화
    private float forwardPerStd;    // 선행 PER 표준화
    private float bpsStd;           // BPS 표준화
    private float pbrStd;           // PBR 표준화
    private float dividendPerShareStd; // 주당 배당금 표준화
    private float dividendYieldStd;    // 배당 수익률 표준화
    private float marketCapStd;        // 시가총액 표준화
    
    // 추가 지표
    private float beta;              // 베타 계수
    private float return1yPercent;   // 1년 수익률
    private float returnVolatility;  // 수익률 변동성
    
    private long currentPrice;       // 현재가
    private long volume;             // 거래량
    private LocalDateTime lastUpdated; // 마지막 업데이트 시간
    
    public static StockResponseDto from(Stock stock) {
        return StockResponseDto.builder()
                .ticker(stock.getTicker())
                .name(stock.getName())
                .closePrice(stock.getClosePrice())
                .priceDiff(stock.getPriceDiff())
                .fluctuationRate(stock.getFluctuationRate())
                .eps(stock.getEps())
                .per(stock.getPer())
                .forwardEps(stock.getForwardEps())
                .forwardPer(stock.getForwardPer())
                .bps(stock.getBps())
                .pbr(stock.getPbr())
                .dividendPerShare(stock.getDividendPerShare())
                .dividendYield(stock.getDividendYield())
                .marketType(stock.getMarketType())
                .industryType(stock.getIndustryType())
                .marketCap(stock.getMarketCap())
                .epsStd(stock.getEpsStd())
                .perStd(stock.getPerStd())
                .forwardEpsStd(stock.getForwardEpsStd())
                .forwardPerStd(stock.getForwardPerStd())
                .bpsStd(stock.getBpsStd())
                .pbrStd(stock.getPbrStd())
                .dividendPerShareStd(stock.getDividendPerShareStd())
                .dividendYieldStd(stock.getDividendYieldStd())
                .marketCapStd(stock.getMarketCapStd())
                .beta(stock.getBeta())
                .return1yPercent(stock.getReturn1yPercent())
                .returnVolatility(stock.getReturnVolatility())
                .currentPrice(stock.getCurrentPrice())
                .volume(stock.getVolume())
                .lastUpdated(stock.getLastUpdated())
                .build();
    }
} 