package com.stockr.be.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    // Common
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "C001", "Invalid Input Value"),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "C002", "Invalid Method Type"),
    ENTITY_NOT_FOUND(HttpStatus.BAD_REQUEST, "C003", "Entity Not Found"),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C004", "Server Error"),
    INVALID_TYPE_VALUE(HttpStatus.BAD_REQUEST, "C005", "Invalid Type Value"),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "C006", "Access is Denied"),
    EXTERNAL_API_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C007", "External API Error"),

    // User
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U001", "User Not Found"),
    DUPLICATE_EMAIL(HttpStatus.BAD_REQUEST, "U002", "Email is Duplicate"),
    INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "U003", "Password is Invalid"),
    UNAUTHORIZED_USER(HttpStatus.UNAUTHORIZED, "U004", "Unauthorized User"),

    // Account
    ACCOUNT_NOT_FOUND(HttpStatus.NOT_FOUND, "A001", "Account Not Found"),
    ACCOUNT_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "A002", "Account Already Exists"),
    INSUFFICIENT_BALANCE(HttpStatus.BAD_REQUEST, "A003", "Insufficient Balance"),

    // Stock
    STOCK_NOT_FOUND(HttpStatus.NOT_FOUND, "S001", "Stock Not Found"),
    INVALID_TRADE_TYPE(HttpStatus.BAD_REQUEST, "S002", "Invalid Trade Type"),
    FAVORITE_NOT_FOUND(HttpStatus.NOT_FOUND, "S003", "Favorite Not Found"),
    DUPLICATE_FAVORITE(HttpStatus.BAD_REQUEST, "S004", "Duplicate Favorite"),
    INVALID_INTERVAL(HttpStatus.BAD_REQUEST, "S005", "Invalid interval value. Use 'daily', 'weekly', or 'monthly'"),
    STOCK_PRICE_NOT_FOUND(HttpStatus.NOT_FOUND, "S006", "Stock price not found"),
    STOCK_HOLDING_NOT_FOUND(HttpStatus.NOT_FOUND, "S007", "Stock Holding Not Found"),

    // Community
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "P001", "게시글을 찾을 수 없습니다."),
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "P002", "댓글을 찾을 수 없습니다."),
    UNAUTHORIZED_ACCESS(HttpStatus.FORBIDDEN, "P003", "접근 권한이 없습니다."),
    NICKNAME_NOT_SET(HttpStatus.BAD_REQUEST, "P004", "커뮤니티 이용을 위해 닉네임을 먼저 설정해주세요."),
    NO_FAVORITE_STOCKS(HttpStatus.BAD_REQUEST, "P005", "커뮤니티 글 작성을 위해 관심 종목을 먼저 추가해주세요.");

    private final HttpStatus status;
    private final String code;
    private final String message;

    public String getMessage() {
        return message;
    }
}