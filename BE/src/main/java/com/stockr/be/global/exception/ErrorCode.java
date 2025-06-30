package com.stockr.be.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    // Common
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "C001", "잘못된 입력값입니다"),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C002", "서버 내부 오류"),

    // User
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U001", "사용자를 찾을 수 없습니다"),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "U002", "이미 존재하는 이메일입니다"),

    // Stock
    STOCK_NOT_FOUND(HttpStatus.NOT_FOUND, "S001", "주식을 찾을 수 없습니다"),
    STOCK_PRICE_NOT_FOUND(HttpStatus.NOT_FOUND, "S002", "주식 가격 정보를 찾을 수 없습니다"),
    INVALID_STOCK_PRICE(HttpStatus.BAD_REQUEST, "S003", "유효하지 않은 주식 가격입니다");

    private final HttpStatus httpStatus;
    private final String code;
    private final String defaultMessage;
}