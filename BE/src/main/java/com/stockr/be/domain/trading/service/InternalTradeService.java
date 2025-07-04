package com.stockr.be.domain.trading.service;

import com.stockr.be.account.domain.Account;
import com.stockr.be.domain.stock.entity.Stock;
import com.stockr.be.domain.stock.entity.StockHolding;
import com.stockr.be.domain.stock.repository.StockHoldingRepository;
import com.stockr.be.domain.trading.entity.LimitOrder;
import com.stockr.be.domain.trading.entity.TradeLog;
import com.stockr.be.domain.trading.entity.TradingOrderStatus;
import com.stockr.be.domain.trading.repository.LimitOrderRepository;
import com.stockr.be.domain.trading.repository.TradeLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class InternalTradeService {

    private final StockHoldingRepository stockHoldingRepository;
    private final LimitOrderRepository limitOrderRepository;
    private final TradeLogRepository tradeLogRepository;

    @Transactional
    public void processOrder(LimitOrder order, BigDecimal executionPrice) {
        if (order.getStatus() != TradingOrderStatus.PENDING) {
            // Already processed or cancelled
            return;
        }

        switch (order.getOrderType()) {
            case BUY:
                executeBuyOrder(order, executionPrice);
                break;
            case SELL:
                executeSellOrder(order, executionPrice);
                break;
        }
    }

    private void executeBuyOrder(LimitOrder order, BigDecimal executionPrice) {
        Account account = order.getAccount();
        Stock stock = order.getStock();
        long quantity = order.getQuantity();

        BigDecimal totalCost = executionPrice.multiply(BigDecimal.valueOf(quantity));
        account.withdraw(totalCost);

        StockHolding holding = stockHoldingRepository.findByAccountAndStock(account, stock)
                .orElseGet(() -> {
                    StockHolding newHolding = StockHolding.builder()
                            .account(account)
                            .stock(stock)
                            .quantity(0L)
                            .averagePurchasePrice(BigDecimal.ZERO)
                            .build();
                    return stockHoldingRepository.save(newHolding);
                });

        BigDecimal currentTotalValue = holding.getAveragePurchasePrice()
                .multiply(BigDecimal.valueOf(holding.getQuantity()));
        long newTotalQuantity = holding.getQuantity() + quantity;
        BigDecimal newTotalValue = currentTotalValue.add(totalCost);
        BigDecimal newAveragePrice = newTotalValue.divide(BigDecimal.valueOf(newTotalQuantity), 2,
                RoundingMode.HALF_UP);

        holding.updateQuantityAndPrice(newTotalQuantity, newAveragePrice);

        finishOrder(order, executionPrice);
    }

    private void executeSellOrder(LimitOrder order, BigDecimal executionPrice) {
        Account account = order.getAccount();
        Stock stock = order.getStock();
        long quantity = order.getQuantity();

        StockHolding holding = stockHoldingRepository.findByAccountAndStock(account, stock)
                .orElseThrow(() -> new NoSuchElementException("Stock holding not found for selling."));

        if (holding.getQuantity() < quantity) {
            throw new IllegalArgumentException("Not enough stock to sell.");
        }

        long newQuantity = holding.getQuantity() - quantity;
        holding.updateQuantityAndPrice(newQuantity, holding.getAveragePurchasePrice());

        BigDecimal totalProceeds = executionPrice.multiply(BigDecimal.valueOf(quantity));
        account.deposit(totalProceeds);

        finishOrder(order, executionPrice);
    }

    private void finishOrder(LimitOrder order, BigDecimal executionPrice) {
        order.updateStatus(TradingOrderStatus.EXECUTED);
        limitOrderRepository.save(order);

        TradeLog log = TradeLog.builder()
                .executedOrder(order)
                .account(order.getAccount())
                .stock(order.getStock())
                .orderType(order.getOrderType())
                .executedQuantity(order.getQuantity())
                .executedPrice(executionPrice)
                .build();
        tradeLogRepository.save(log);
    }
}