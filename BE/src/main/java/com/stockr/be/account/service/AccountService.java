package com.stockr.be.account.service;

import com.stockr.be.account.domain.Account;
import com.stockr.be.account.dto.AccountCreateRequestDto;
import com.stockr.be.account.dto.AccountResponseDto;
import com.stockr.be.account.dto.TradeRequestDto;
import com.stockr.be.account.dto.TradeResponseDto;
import com.stockr.be.account.repository.AccountRepository;
import com.stockr.be.domain.stock.entity.Stock;
import com.stockr.be.domain.stock.repository.StockRepository;
import com.stockr.be.global.exception.BusinessException;
import com.stockr.be.global.exception.ErrorCode;
import com.stockr.be.user.domain.User;
import com.stockr.be.user.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * 계좌 관련 비즈니스 로직을 처리하는 서비스 클래스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final StockRepository stockRepository;

    /**
     * 계좌 생성
     * - 이미 계좌가 존재하면 예외 발생
     * - 계좌 생성 후 응답 DTO 반환
     *
     * @param userId     사용자 ID
     * @param requestDto 계좌 생성 요청 데이터
     * @return 생성된 계좌 정보
     */
    @Transactional
    public AccountResponseDto createAccount(Long userId, AccountCreateRequestDto requestDto) {
        log.info("계좌 생성 시작 - userId: {}, bankName: {}, accountNumber: {}", 
                userId, requestDto.getBankName(), requestDto.getAccountNumber());

        try {
            // 사용자 조회
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> {
                        log.error("사용자를 찾을 수 없음 - userId: {}", userId);
                        return new BusinessException(ErrorCode.USER_NOT_FOUND);
                    });

            // 중복 계좌 체크 (1:1 관계)
            if (accountRepository.existsByUser_UserId(user.getUserId())) {
                log.error("이미 계좌가 존재함 - userId: {}", userId);
                throw new BusinessException(ErrorCode.ACCOUNT_ALREADY_EXISTS);
            }

            // 계좌 생성 및 저장
            Account account = Account.builder()
                    .user(user)
                    .bankName(requestDto.getBankName())
                    .accountNumber(requestDto.getAccountNumber())
                    .build();

            Account savedAccount = accountRepository.save(account);
            log.info("계좌 생성 완료 - accountId: {}, userId: {}", savedAccount.getId(), userId);

            // 응답 DTO 반환
            return AccountResponseDto.fromEntity(savedAccount);
        } catch (Exception e) {
            log.error("계좌 생성 중 에러 발생 - userId: {}", userId, e);
            throw e;
        }
    }

    /**
     * 사용자 ID로 계좌 조회
     *
     * @param userId 사용자 ID
     * @return 계좌 응답 DTO (없으면 null)
     */
    public AccountResponseDto getAccountByUserId(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(()-> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        Account account = accountRepository.findByUser(user)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));
        return AccountResponseDto.fromEntity(account);
    }

    @Transactional
    public TradeResponseDto processTrade(Long userId, TradeRequestDto request) {
        User user = userRepository.findById(userId).orElseThrow(()-> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        // 1. 계좌와 주식 정보 조회
        Account account = accountRepository.findByUser(user)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));
        
        Stock stock = stockRepository.findByTicker(request.getTicker())
                .orElseThrow(() -> new BusinessException(ErrorCode.STOCK_NOT_FOUND));

        // 2. 거래 금액 계산
        BigDecimal tradeAmount = BigDecimal.valueOf(request.getPrice())
                .multiply(BigDecimal.valueOf(request.getQuantity()));

        // 3. 거래 유형에 따른 처리
        if ("BUY".equals(request.getType())) {
            // 매수 처리
            if (account.getBalance().compareTo(tradeAmount) < 0) {
                throw new BusinessException(ErrorCode.INSUFFICIENT_BALANCE);
            }
            account.setBalance(account.getBalance().subtract(tradeAmount));
        } else if ("SELL".equals(request.getType())) {
            // 매도 처리 (여기서는 보유 주식 확인 로직은 생략)
            account.setBalance(account.getBalance().add(tradeAmount));
        } else {
            throw new BusinessException(ErrorCode.INVALID_TRADE_TYPE);
        }

        // 4. 계좌 정보 저장
        Account updatedAccount = accountRepository.save(account);

        // 5. 거래 결과 반환
        return TradeResponseDto.builder()
                .ticker(request.getTicker())
                .quantity(request.getQuantity())
                .tradedPrice(BigDecimal.valueOf(request.getPrice()))
                .totalAmount(tradeAmount)
                .remainingBalance(updatedAccount.getBalance())
                .type(request.getType())
                .status("COMPLETED")
                .build();
    }
}
