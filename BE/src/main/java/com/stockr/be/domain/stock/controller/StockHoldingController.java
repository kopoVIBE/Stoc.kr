package com.stockr.be.domain.stock.controller;

import com.stockr.be.account.dto.AccountResponseDto;
import com.stockr.be.account.service.AccountService;
import com.stockr.be.domain.stock.dto.StockHoldingResponseDto;
import com.stockr.be.domain.stock.service.StockHoldingService;
import com.stockr.be.global.common.ApiResponse;
import com.stockr.be.global.exception.BusinessException;
import com.stockr.be.global.exception.ErrorCode;
import com.stockr.be.user.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/holdings")
@RequiredArgsConstructor
public class StockHoldingController {
    private final StockHoldingService stockHoldingService;
    private final AccountService accountService;

    @GetMapping
    public ApiResponse<List<StockHoldingResponseDto>> getStockHoldings() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            log.error("인증 정보가 없거나 잘못된 형식입니다. authentication: {}", authentication);
            throw new BusinessException(ErrorCode.UNAUTHORIZED_USER);
        }

        User user = (User) authentication.getPrincipal();
        log.debug("StockHoldingController.getStockHoldings 호출됨 - user: {}", user);

        AccountResponseDto accountDto = accountService.getAccountByUserId(user.getUserId());
        log.debug("계좌 정보 조회 완료 - accountDto: {}", accountDto);

        List<StockHoldingResponseDto> holdings = stockHoldingService.getStockHoldings(accountDto);
        log.debug("주식 보유 정보 조회 완료 - holdings size: {}", holdings != null ? holdings.size() : 0);

        return ApiResponse.success(holdings);
    }
}