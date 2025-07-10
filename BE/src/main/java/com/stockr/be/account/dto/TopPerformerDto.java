package com.stockr.be.account.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TopPerformerDto {
    private String nickname;
    private Double profitRate;
} 