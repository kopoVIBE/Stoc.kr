package com.stockr.be.global.handler;

import com.stockr.be.global.exception.BusinessException;
import com.stockr.be.global.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientException;

import java.time.LocalDateTime;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException e) {
        log.warn("비즈니스 예외 발생: {} - {}", e.getErrorCode().getCode(), e.getMessage());
        
        return ResponseEntity
                .status(e.getErrorCode().getHttpStatus())
                .body(ErrorResponse.of(e.getErrorCode(), e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException e) {
        log.warn("잘못된 인자: {}", e.getMessage());
        
        return ResponseEntity
                .status(ErrorCode.INVALID_INPUT_VALUE.getHttpStatus())
                .body(ErrorResponse.of(ErrorCode.INVALID_INPUT_VALUE, e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .findFirst()
                .orElse("유효성 검증 실패");
                
        log.warn("유효성 검증 실패: {}", message);
        
        return ResponseEntity
                .status(ErrorCode.INVALID_INPUT_VALUE.getHttpStatus())
                .body(ErrorResponse.of(ErrorCode.INVALID_INPUT_VALUE, message));
    }

    @ExceptionHandler(RestClientException.class)
    public ResponseEntity<ErrorResponse> handleRestClientException(RestClientException e) {
        log.error("외부 API 호출 실패: {}", e.getMessage());
        
        return ResponseEntity
                .status(ErrorCode.EXTERNAL_API_ERROR.getHttpStatus())
                .body(ErrorResponse.of(ErrorCode.EXTERNAL_API_ERROR));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception e) {
        log.error("예상치 못한 서버 오류", e);
        
        return ResponseEntity
                .status(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus())
                .body(ErrorResponse.of(ErrorCode.INTERNAL_SERVER_ERROR));
    }

    @Getter
    @RequiredArgsConstructor
    public static class ErrorResponse {
        private final String code;
        private final String message;
        private final LocalDateTime timestamp;

        public static ErrorResponse of(ErrorCode errorCode) {
            return new ErrorResponse(
                    errorCode.getCode(),
                    errorCode.getDefaultMessage(),
                    LocalDateTime.now()
            );
        }

        public static ErrorResponse of(ErrorCode errorCode, String customMessage) {
            return new ErrorResponse(
                    errorCode.getCode(),
                    customMessage,
                    LocalDateTime.now()
            );
        }
    }
}
