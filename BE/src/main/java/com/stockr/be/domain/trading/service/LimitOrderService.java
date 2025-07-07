package com.stockr.be.domain.trading.service;

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
import com.stockr.be.domain.trading.dto.LimitOrderRequestDto;
import com.stockr.be.domain.trading.entity.LimitOrder;
import com.stockr.be.domain.trading.entity.TradingOrderStatus;
import com.stockr.be.domain.trading.entity.TradingOrderType;
import com.stockr.be.domain.trading.repository.LimitOrderRepository;
import com.stockr.be.user.domain.User;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LimitOrderService {

    private final LimitOrderRepository limitOrderRepository;
    private final AccountRepository accountRepository;
    private final StockRepository stockRepository;
    private final StockHoldingRepository stockHoldingRepository;

    private Long getCurrentUserId() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return user.getUserId();
    }

    @Transactional
    public LimitOrder createOrder(LimitOrderRequestDto request) {
        Long userId = getCurrentUserId();
        Account account = accountRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new NoSuchElementException("User account not found."));

        Stock stock = stockRepository.findById(request.getStockId())
                .orElseThrow(() -> new NoSuchElementException("Stock not found."));

        if (request.getOrderType() == TradingOrderType.SELL) {
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

        return limitOrderRepository.save(order);
    }

    private void validateSellOrder(Account account, Stock stock, Long quantityToSell) {
        stockHoldingRepository.findByAccountAndStock(account, stock)
                .ifPresentOrElse(holding -> {
                    if (holding.getQuantity() < quantityToSell) {
                        throw new IllegalArgumentException("Not enough stock to sell.");
                    }
                }, () -> {
                    throw new IllegalArgumentException("No stock holding found to sell.");
                });
    }

    @Transactional
    public LimitOrder cancelOrder(Long orderId) {
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
    }

    @Transactional(readOnly = true)
    public LimitOrder getOrder(Long orderId) {
        Long userId = getCurrentUserId();
        LimitOrder order = limitOrderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found."));

        if (!order.getAccount().getUser().getUserId().equals(userId)) {
            throw new IllegalStateException("User does not have permission to view this order.");
        }

        return order;
    }

    @Transactional(readOnly = true)
    public List<LimitOrder> getPendingOrdersForUser(Long userId) {
        Account account = accountRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new NoSuchElementException("User account not found."));
        return limitOrderRepository.findByAccountAndStatus(account, TradingOrderStatus.PENDING);
    }
}