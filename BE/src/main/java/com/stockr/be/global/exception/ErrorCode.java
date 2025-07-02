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
    STOCK_PRICE_NOT_FOUND(HttpStatus.NOT_FOUND, "S006", "Stock price not found");

    private final HttpStatus status;
    private final String code;
    private final String message;

    public String getMessage() {
        return message;
    }
}