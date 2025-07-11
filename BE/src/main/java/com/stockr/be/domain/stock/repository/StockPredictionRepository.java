package com.stockr.be.domain.stock.repository;

import com.stockr.be.domain.stock.entity.StockPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface StockPredictionRepository extends JpaRepository<StockPrediction, Long> {
    @Query("SELECT sp FROM StockPrediction sp WHERE sp.stockCode = :stockCode ORDER BY sp.predictedAt DESC LIMIT 1")
    Optional<StockPrediction> findLatestByStockCode(@Param("stockCode") String stockCode);
} 