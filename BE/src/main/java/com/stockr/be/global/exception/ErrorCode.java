package com.stockr.be.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    // Common
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "C001", "Invalid input value"),
    DATA_NOT_FOUND(HttpStatus.NOT_FOUND, "C002", "Data not found"),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C003", "Internal server error"),
    EXTERNAL_API_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C004", "External API call failed"),

    // User
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U001", "사용자를 찾을 수 없습니다."),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "U002", "이미 존재하는 이메일입니다."),

    // Stock
    INVALID_INTERVAL(HttpStatus.BAD_REQUEST, "S001", "Invalid interval value. Use 'daily', 'weekly', or 'monthly'"),
    STOCK_NOT_FOUND(HttpStatus.NOT_FOUND, "S002", "Stock not found"),
    STOCK_PRICE_NOT_FOUND(HttpStatus.NOT_FOUND, "S003", "Stock price not found"),
    INVALID_STOCK_PRICE(HttpStatus.BAD_REQUEST, "S004", "유효하지 않은 주식 가격입니다."),
    FAVORITE_NOT_FOUND(HttpStatus.NOT_FOUND, "S005", "즐겨찾기를 찾을 수 없습니다."),
    DUPLICATE_FAVORITE(HttpStatus.BAD_REQUEST, "S006", "이미 즐겨찾기에 추가된 주식입니다.");

    private final HttpStatus status;
    private final String code;
    private final String defaultMessage;

    public String getMessage() {
        return defaultMessage;
    }
}