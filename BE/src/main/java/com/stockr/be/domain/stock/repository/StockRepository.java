package com.stockr.be.domain.stock.repository;

import com.stockr.be.domain.stock.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, String> {
    // 기본 CRUD 메서드들은 JpaRepository에서 제공
    
    // 추가 쿼리 메서드들
    List<Stock> findTop10ByOrderByVolumeDesc(); // 거래량 상위 10개
    List<Stock> findByTickerIn(List<String> tickers); // 특정 종목들 조회
    Optional<Stock> findByTicker(String ticker); // 단일 종목 조회
} 