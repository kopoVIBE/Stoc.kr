package com.stockr.be.community.dto;

import com.stockr.be.domain.stock.entity.Stock;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FavoriteStockDto {
    private String code;    // 종목 코드
    private String name;    // 종목명
    
    public static FavoriteStockDto from(Stock stock) {
        return FavoriteStockDto.builder()
                .code(stock.getTicker())
                .name(stock.getName())
                .build();
    }
} 