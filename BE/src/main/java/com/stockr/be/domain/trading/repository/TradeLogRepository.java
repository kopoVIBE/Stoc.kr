package com.stockr.be.domain.trading.repository;

import com.stockr.be.domain.trading.entity.TradeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TradeLogRepository extends JpaRepository<TradeLog, Long> {
    // 특정 사용자들의 거래 내역 조회
    List<TradeLog> findByAccount_User_UserIdIn(List<Long> userIds);
}