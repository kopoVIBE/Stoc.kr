package com.stockr.be.domain.trading.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stockr.be.account.domain.Account;
import com.stockr.be.account.repository.AccountRepository;
import com.stockr.be.domain.stock.entity.Stock;
import com.stockr.be.domain.stock.repository.StockHoldingRepository;
import com.stockr.be.domain.stock.repository.StockRepository;
import com.stockr.be.domain.stock.service.StockPriceService;
import com.stockr.be.domain.stock.dto.RealtimeStockPriceDto;
import com.stockr.be.domain.trading.dto.LimitOrderRequestDto;
import com.stockr.be.domain.trading.entity.LimitOrder;
import com.stockr.be.domain.trading.entity.TradingOrderStatus;
import com.stockr.be.domain.trading.entity.TradingOrderType;
import com.stockr.be.domain.trading.repository.LimitOrderRepository;
import com.stockr.be.user.domain.User;
import com.stockr.be.global.exception.BusinessException;
import com.stockr.be.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class LimitOrderService {

    private final LimitOrderRepository limitOrderRepository;
    private final AccountRepository accountRepository;
    private final StockRepository stockRepository;
    private final StockHoldingRepository stockHoldingRepository;
    private final InternalTradeService internalTradeService;
    private final StockPriceService stockPriceService;

    private Long getCurrentUserId() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return user.getUserId();
    }

    @Transactional
    public LimitOrder createOrder(LimitOrderRequestDto request) {
        try {
            log.debug("Creating order: {}", request);
            
            Long userId = getCurrentUserId();
            Account account = accountRepository.findByUser_UserId(userId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));

            Stock stock = stockRepository.findByTicker(request.getStockId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.STOCK_NOT_FOUND));

            // 주문 수량과 가격 검증
            if (request.getQuantity() <= 0) {
                throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE, "주문 수량은 0보다 커야 합니다.");
            }
            if (request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE, "주문 가격은 0보다 커야 합니다.");
            }

            // Redis에서 현재가 조회
            RealtimeStockPriceDto realtimePrice = stockPriceService.getLatestPrice(stock.getTicker());
            if (realtimePrice == null) {
                log.error("실시간 주가 정보를 찾을 수 없습니다. stockId: {}", stock.getTicker());
                throw new BusinessException(ErrorCode.STOCK_PRICE_NOT_FOUND, 
                    String.format("실시간 주가 정보를 찾을 수 없습니다. (종목코드: %s)", stock.getTicker()));
            }

            BigDecimal currentPrice = BigDecimal.valueOf(realtimePrice.getPrice());
            log.debug("Current price for {} ({}): {}", stock.getName(), stock.getTicker(), currentPrice);

            boolean shouldExecuteImmediately = false;

            if (request.getOrderType() == TradingOrderType.BUY) {
                // 매수: 지정가가 현재가보다 크거나 같으면 즉시 체결
                shouldExecuteImmediately = request.getPrice().compareTo(currentPrice) >= 0;
                log.debug("매수 주문 - 종목: {} ({}), 지정가: {}, 현재가: {}, 즉시체결: {}", 
                    stock.getName(), stock.getTicker(), request.getPrice(), currentPrice, shouldExecuteImmediately);

                // 매수 주문 시 잔액 검증
                BigDecimal totalAmount = request.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));
                if (account.getBalance().compareTo(totalAmount) < 0) {
                    log.error("잔액 부족 - 계좌: {}, 주문금액: {}, 잔액: {}", 
                        account.getId(), totalAmount, account.getBalance());
                    throw new BusinessException(ErrorCode.INSUFFICIENT_BALANCE, 
                        String.format("주문 금액(%s원)이 계좌 잔액(%s원)을 초과합니다.", 
                            totalAmount.toString(), account.getBalance().toString()));
                }
            } else {
                // 매도: 지정가가 현재가보다 작거나 같으면 즉시 체결
                shouldExecuteImmediately = request.getPrice().compareTo(currentPrice) <= 0;
                log.debug("매도 주문 - 종목: {} ({}), 지정가: {}, 현재가: {}, 즉시체결: {}", 
                    stock.getName(), stock.getTicker(), request.getPrice(), currentPrice, shouldExecuteImmediately);

                // 매도 주문 시 보유 수량 검증
                validateSellOrder(account, stock, request.getQuantity());
            }

            LimitOrder order = LimitOrder.builder()
                    .account(account)
                    .stock(stock)
                    .orderType(request.getOrderType())
                    .quantity(request.getQuantity())
                    .price(request.getPrice())
                    .status(TradingOrderStatus.PENDING)
                    .build();

            LimitOrder savedOrder = limitOrderRepository.save(order);
            log.debug("Order saved with ID: {}", savedOrder.getId());

            if (shouldExecuteImmediately) {
                try {
                    log.debug("Attempting to execute order immediately: {}", savedOrder.getId());
                    internalTradeService.processOrder(savedOrder, currentPrice);
                    log.debug("Order executed successfully: {}", savedOrder.getId());
                } catch (Exception e) {
                    log.error("Failed to execute order {}: {}", savedOrder.getId(), e.getMessage(), e);
                    // 체결 실패 시 주문 취소
                    savedOrder.updateStatus(TradingOrderStatus.CANCELLED);
                    savedOrder = limitOrderRepository.save(savedOrder);
                    throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, 
                        "주문 체결 중 오류가 발생했습니다: " + e.getMessage());
                }
            } else {
                log.debug("Order added to pending list: {}", savedOrder.getId());
            }

            return savedOrder;
        } catch (BusinessException e) {
            log.error("Business error while creating order: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error while creating order: {}", e.getMessage(), e);
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, 
                "주문 생성 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    private void validateSellOrder(Account account, Stock stock, Long quantityToSell) {
        stockHoldingRepository.findByAccountAndStock(account, stock)
                .ifPresentOrElse(holding -> {
                    if (holding.getQuantity() < quantityToSell) {
                        throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE,
                            String.format("보유 수량(%d)이 매도 수량(%d)보다 적습니다.", 
                                holding.getQuantity(), quantityToSell));
                    }
                }, () -> {
                    throw new BusinessException(ErrorCode.STOCK_HOLDING_NOT_FOUND, 
                        "매도할 주식을 보유하고 있지 않습니다.");
                });
    }

    @Transactional
    public LimitOrder cancelOrder(Long orderId) {
        try {
            Long userId = getCurrentUserId();
            LimitOrder order = limitOrderRepository.findById(orderId)
                    .orElseThrow(() -> new NoSuchElementException("Order not found."));

            if (!order.getAccount().getUser().getUserId().equals(userId)) {
                throw new IllegalStateException("User does not have permission to cancel this order.");
            }

            if (order.getStatus() != TradingOrderStatus.PENDING) {
                throw new IllegalStateException("Only pending orders can be cancelled.");
            }

            order.updateStatus(TradingOrderStatus.CANCELLED);
            return limitOrderRepository.save(order);
        } catch (Exception e) {
            log.error("Failed to cancel order {}: {}", orderId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public LimitOrder getOrder(Long orderId) {
        try {
            Long userId = getCurrentUserId();
            LimitOrder order = limitOrderRepository.findById(orderId)
                    .orElseThrow(() -> new NoSuchElementException("Order not found."));

            if (!order.getAccount().getUser().getUserId().equals(userId)) {
                throw new IllegalStateException("User does not have permission to view this order.");
            }

            return order;
        } catch (Exception e) {
            log.error("Failed to get order {}: {}", orderId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<LimitOrder> getPendingOrdersForUser(Long userId) {
        try {
            Account account = accountRepository.findByUser_UserId(userId)
                    .orElseThrow(() -> new NoSuchElementException("User account not found."));
            return limitOrderRepository.findByAccountAndStatus(account, TradingOrderStatus.PENDING);
        } catch (Exception e) {
            log.error("Failed to get pending orders for user {}: {}", userId, e.getMessage(), e);
            throw e;
        }
    }
}