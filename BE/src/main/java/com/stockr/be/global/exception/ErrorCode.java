package com.stockr.be.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    // === 주식 관련 에러 ===
    STOCK_PRICE_NOT_FOUND("STOCK_001", "주식 가격 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    INVALID_STOCK_PRICE("STOCK_002", "잘못된 주식 가격 정보입니다.", HttpStatus.BAD_REQUEST),
    STOCK_CODE_NOT_FOUND("STOCK_003", "존재하지 않는 종목 코드입니다.", HttpStatus.NOT_FOUND),
    
    // === 입력 검증 에러 ===
    INVALID_INPUT_VALUE("VALIDATION_001", "입력값이 올바르지 않습니다.", HttpStatus.BAD_REQUEST),
    MISSING_REQUIRED_FIELD("VALIDATION_002", "필수 입력값이 누락되었습니다.", HttpStatus.BAD_REQUEST),
    INVALID_FORMAT("VALIDATION_003", "입력 형식이 올바르지 않습니다.", HttpStatus.BAD_REQUEST),
    
    // === 서버 에러 ===
    INTERNAL_SERVER_ERROR("SERVER_001", "서버 내부 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),
    EXTERNAL_API_ERROR("SERVER_002", "외부 API 호출에 실패했습니다.", HttpStatus.SERVICE_UNAVAILABLE),
    DATABASE_ERROR("SERVER_003", "데이터베이스 처리 중 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),
    
    // === 인증/권한 에러 ===
    UNAUTHORIZED("AUTH_001", "인증이 필요합니다.", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("AUTH_002", "권한이 없습니다.", HttpStatus.FORBIDDEN),
    TOKEN_EXPIRED("AUTH_003", "토큰이 만료되었습니다.", HttpStatus.UNAUTHORIZED);

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;
}