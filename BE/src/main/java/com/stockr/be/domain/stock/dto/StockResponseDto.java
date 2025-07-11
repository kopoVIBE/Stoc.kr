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
    private Integer currentPrice;   // 현재가 (실시간 데이터가 있을 때)
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
    private float marketCap;        // 시가총액
    
    public static StockResponseDto from(Stock stock) {
        return StockResponseDto.builder()
                .ticker(stock.getTicker())
                .name(stock.getName())
                .closePrice(stock.getClosePrice())
                .currentPrice(null) // 기본값은 null, 실시간 데이터는 별도로 설정
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
                .build();
    }
} 