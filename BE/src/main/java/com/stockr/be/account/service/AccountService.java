package com.stockr.be.account.service;

import com.stockr.be.account.domain.Account;
import com.stockr.be.account.dto.*;
import com.stockr.be.account.repository.AccountRepository;
import com.stockr.be.domain.stock.dto.RealtimeStockPriceDto;
import com.stockr.be.domain.stock.entity.Stock;
import com.stockr.be.domain.stock.entity.StockHolding;
import com.stockr.be.domain.stock.repository.StockHoldingRepository;
import com.stockr.be.domain.stock.repository.StockRepository;
import com.stockr.be.domain.stock.service.StockPriceService;
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
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

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
    private final StockHoldingRepository stockHoldingRepository;
    private final StockPriceService stockPriceService;

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
        log.debug("AccountService.getAccountByUserId 호출됨 - userId: {}", userId);
        User user = userRepository.findById(userId).orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        log.debug("사용자 조회 완료 - user: {}", user);
        Account account = accountRepository.findByUser(user)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));
        log.debug("계좌 조회 완료 - account: {}", account);
        return AccountResponseDto.fromEntity(account);
    }

    @Transactional
    public TradeResponseDto processTrade(Long userId, TradeRequestDto request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
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

    public List<TopPerformerDto> getTopPerformers() {
        try {
            return accountRepository.findAll().stream()
                .filter(account -> account.getUser().getNickname() != null)  // 닉네임이 있는 사용자만 필터링
                .map(account -> {
                    try {
                        // 계좌의 총 수익률 계산
                        List<StockHolding> holdings = stockHoldingRepository.findByAccount(account);
                        
                        if (holdings.isEmpty()) {
                            // 보유 종목이 없는 경우 0% 수익률
                            return TopPerformerDto.builder()
                                .nickname(account.getUser().getNickname())
                                .profitRate(0.0)
                                .build();
                        }
                        
                        BigDecimal totalProfitRate = holdings.stream()
                            .map(holding -> {
                                try {
                                    RealtimeStockPriceDto realtimePrice = stockPriceService.getLatestPrice(holding.getStock().getTicker());
                                    BigDecimal currentPrice = realtimePrice != null ? 
                                        BigDecimal.valueOf(realtimePrice.getPrice()) : 
                                        BigDecimal.valueOf(holding.getStock().getClosePrice());
                                    
                                    BigDecimal totalPurchaseAmount = holding.getAveragePurchasePrice()
                                        .multiply(BigDecimal.valueOf(holding.getQuantity()));
                                    
                                    // 0으로 나누기 방지
                                    if (totalPurchaseAmount.compareTo(BigDecimal.ZERO) <= 0) {
                                        return BigDecimal.ZERO;
                                    }
                                    
                                    BigDecimal evaluationAmount = currentPrice
                                        .multiply(BigDecimal.valueOf(holding.getQuantity()));
                                    BigDecimal evaluationProfitLoss = evaluationAmount.subtract(totalPurchaseAmount);
                                    
                                    return evaluationProfitLoss
                                        .divide(totalPurchaseAmount, 4, RoundingMode.HALF_UP)
                                        .multiply(BigDecimal.valueOf(100));
                                } catch (Exception e) {
                                    log.warn("보유 종목 수익률 계산 중 오류 발생 - holding: {}, error: {}", holding.getStock().getTicker(), e.getMessage());
                                    return BigDecimal.ZERO;
                                }
                            })
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                        
                        return TopPerformerDto.builder()
                            .nickname(account.getUser().getNickname())
                            .profitRate(totalProfitRate.doubleValue())
                            .build();
                    } catch (Exception e) {
                        log.warn("사용자 수익률 계산 중 오류 발생 - userId: {}, error: {}", account.getUser().getUserId(), e.getMessage());
                        return TopPerformerDto.builder()
                            .nickname(account.getUser().getNickname())
                            .profitRate(0.0)
                            .build();
                    }
                })
                .sorted((a, b) -> b.getProfitRate().compareTo(a.getProfitRate()))  // 수익률 내림차순 정렬
                .limit(2)  // 상위 2명만 선택
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("상위 수익률 조회 중 오류 발생: {}", e.getMessage(), e);
            return List.of(); // 오류 발생 시 빈 리스트 반환
        }
    }
}
