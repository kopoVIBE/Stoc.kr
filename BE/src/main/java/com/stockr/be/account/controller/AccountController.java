package com.stockr.be.account.controller;

import com.stockr.be.account.dto.AccountCreateRequestDto;
import com.stockr.be.account.dto.AccountResponseDto;
import com.stockr.be.account.dto.TradeRequestDto;
import com.stockr.be.account.dto.TradeResponseDto;
import com.stockr.be.account.service.AccountService;
import com.stockr.be.global.common.ApiResponse;
import com.stockr.be.user.domain.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * 계좌 관련 요청을 처리하는 REST 컨트롤러 (JWT 기반)
 */
@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    // JWT에서 인증된 사용자 정보 꺼내는 헬퍼 메서드
    private Long getCurrentUserId() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return user.getUserId(); // ← 필드 이름 맞게 수정
    }

    /**
     * 계좌 생성 API (JWT 사용자)
     */
    @PostMapping
    public ResponseEntity<AccountResponseDto> createAccount(
            @Valid @RequestBody AccountCreateRequestDto requestDto
    ) {
        Long userId = getCurrentUserId();
        AccountResponseDto responseDto = accountService.createAccount(userId, requestDto);
        return ResponseEntity.ok(responseDto);
    }

    /**
     * 계좌 조회 API (JWT 사용자)
     */
    @GetMapping
    public ResponseEntity<AccountResponseDto> getAccount() {
        Long userId = getCurrentUserId();
        AccountResponseDto responseDto = accountService.getAccountByUserId(userId);

        // null이 반환돼도 정상 응답으로 처리 (200 OK)
        return ResponseEntity.ok(responseDto);
    }
    
    @PostMapping("/trade")
    public ResponseEntity<ApiResponse<TradeResponseDto>> trade(
            @AuthenticationPrincipal Long userId,
            @RequestBody TradeRequestDto request) {
        TradeResponseDto response = accountService.processTrade(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
