package com.stockr.be.domain.stock.repository;

import com.stockr.be.account.domain.Account;
import com.stockr.be.domain.stock.entity.Stock;
import com.stockr.be.domain.stock.entity.StockHolding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StockHoldingRepository extends JpaRepository<StockHolding, Long> {
    List<StockHolding> findByAccount(Account account);

    Optional<StockHolding> findByAccountAndStock(Account account, Stock stock);

    boolean existsByAccountAndStock(Account account, Stock stock);
}