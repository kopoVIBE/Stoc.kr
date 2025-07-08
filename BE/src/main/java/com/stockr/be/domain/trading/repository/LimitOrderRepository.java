package com.stockr.be.domain.trading.repository;

import com.stockr.be.account.domain.Account;
import com.stockr.be.domain.stock.entity.Stock;
import com.stockr.be.domain.trading.entity.LimitOrder;
import com.stockr.be.domain.trading.entity.TradingOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LimitOrderRepository extends JpaRepository<LimitOrder, Long> {

    List<LimitOrder> findByStockAndStatus(Stock stock, TradingOrderStatus status);

    List<LimitOrder> findByAccountAndStatus(Account account, TradingOrderStatus status);
}