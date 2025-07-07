package com.stockr.be.domain.trading.repository;

import com.stockr.be.domain.trading.entity.TradeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TradeLogRepository extends JpaRepository<TradeLog, Long> {
}