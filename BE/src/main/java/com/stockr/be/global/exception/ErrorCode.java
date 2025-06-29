package com.stockr.be.global.exception;

import lombok.Getter;

@Getter
public enum ErrorCode {
    STOCK_PRICE_NOT_FOUND("주식 가격 정보를 찾을 수 없습니다."),
    INVALID_STOCK_PRICE("잘못된 주식 가격 정보입니다.");

    private final String message;

    ErrorCode(String message) {
        this.message = message;
    }
}