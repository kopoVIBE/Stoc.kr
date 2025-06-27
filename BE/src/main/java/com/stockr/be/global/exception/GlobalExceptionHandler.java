package com.stockr.be.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException e) {
        return ResponseEntity
                .badRequest()
                .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
    }

    @Getter
    @RequiredArgsConstructor
    static class ErrorResponse {
        private final ErrorCode errorCode;
        private final String message;
    }
}