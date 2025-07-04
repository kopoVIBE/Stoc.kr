package com.stockr.be.domain.stock.service;

import com.stockr.be.account.dto.AccountResponseDto;
import com.stockr.be.domain.stock.dto.RealtimeStockPriceDto;
import com.stockr.be.domain.stock.dto.StockHoldingResponseDto;
import com.stockr.be.domain.stock.entity.Stock;
import com.stockr.be.domain.stock.entity.StockHolding;
import com.stockr.be.domain.stock.repository.StockHoldingRepository;
import com.stockr.be.account.repository.AccountRepository;
import com.stockr.be.global.exception.BusinessException;
import com.stockr.be.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockHoldingService {
    private final StockHoldingRepository stockHoldingRepository;
    private final AccountRepository accountRepository;
    private final StockPriceService stockPriceService;

    public List<StockHoldingResponseDto> getStockHoldings(AccountResponseDto accountDto) {
        var account = accountRepository.findById(accountDto.getAccountId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));

        return stockHoldingRepository.findByAccount(account).stream()
                .map(this::calculateStockHoldingInfo)
                .collect(Collectors.toList());
    }

    private StockHoldingResponseDto calculateStockHoldingInfo(StockHolding holding) {
        // Redis에서 실시간 가격 조회
        RealtimeStockPriceDto realtimePrice = stockPriceService.getLatestPrice(holding.getStock().getTicker());
        BigDecimal currentPrice = realtimePrice != null ? BigDecimal.valueOf(realtimePrice.getPrice())
                : BigDecimal.valueOf(holding.getStock().getClosePrice());

        BigDecimal totalPurchaseAmount = holding.getAveragePurchasePrice()
                .multiply(BigDecimal.valueOf(holding.getQuantity()));
        BigDecimal evaluationAmount = currentPrice
                .multiply(BigDecimal.valueOf(holding.getQuantity()));
        BigDecimal evaluationProfitLoss = evaluationAmount.subtract(totalPurchaseAmount);
        Double profitLossRate = evaluationProfitLoss
                .divide(totalPurchaseAmount, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();

        return StockHoldingResponseDto.builder()
                .stockCode(holding.getStock().getTicker())
                .stockName(holding.getStock().getName())
                .quantity(holding.getQuantity())
                .averagePurchasePrice(holding.getAveragePurchasePrice())
                .currentPrice(currentPrice)
                .totalPurchaseAmount(totalPurchaseAmount)
                .evaluationAmount(evaluationAmount)
                .evaluationProfitLoss(evaluationProfitLoss)
                .profitLossRate(profitLossRate)
                .build();
    }

    public StockHolding getStockHolding(AccountResponseDto accountDto, Stock stock) {
        return stockHoldingRepository.findByAccountAndStock(
                accountRepository.findById(accountDto.getAccountId())
                        .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND)),
                stock)
                .orElseThrow(() -> new BusinessException(ErrorCode.STOCK_HOLDING_NOT_FOUND));
    }

    @Transactional
    public StockHolding createOrUpdateStockHolding(AccountResponseDto accountDto, Stock stock, Long quantity,
            BigDecimal averagePrice) {
        var account = accountRepository.findById(accountDto.getAccountId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));

        return stockHoldingRepository.findByAccountAndStock(account, stock)
                .map(holding -> {
                    holding.updateQuantityAndPrice(quantity, averagePrice);
                    return holding;
                })
                .orElseGet(() -> stockHoldingRepository.save(
                        StockHolding.builder()
                                .account(account)
                                .stock(stock)
                                .quantity(quantity)
                                .averagePurchasePrice(averagePrice)
                                .build()));
    }
}