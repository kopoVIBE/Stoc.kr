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
    DUPLICATE_FAVORITE(HttpStatus.BAD_REQUEST, "S006", "이미 즐겨찾기에 추가된 주식입니다."),

    // Community
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "P001", "게시글을 찾을 수 없습니다."),
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "P002", "댓글을 찾을 수 없습니다."),
    UNAUTHORIZED_ACCESS(HttpStatus.FORBIDDEN, "P003", "접근 권한이 없습니다."),
    NICKNAME_NOT_SET(HttpStatus.BAD_REQUEST, "P004", "커뮤니티 이용을 위해 닉네임을 먼저 설정해주세요."),
    NO_FAVORITE_STOCKS(HttpStatus.BAD_REQUEST, "P005", "커뮤니티 글 작성을 위해 관심 종목을 먼저 추가해주세요.");

    private final HttpStatus status;
    private final String code;
    private final String defaultMessage;

    public String getMessage() {
        return defaultMessage;
    }
}