package com.stockr.be.domain.stock.repository;

import com.stockr.be.domain.stock.entity.StockPrice;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface StockPriceRepository extends MongoRepository<StockPrice, String> {
    
    List<StockPrice> findByTickerAndIntervalAndDateBetweenOrderByDateDesc(
            String ticker,
            String interval,
            LocalDateTime startDate,
            LocalDateTime endDate
    );

    List<StockPrice> findByTickerAndIntervalOrderByDateDesc(
            String ticker,
            String interval
    );

    Optional<StockPrice> findFirstByTickerAndIntervalOrderByDateDesc(
            String ticker,
            String interval
    );

    @Query("{'ticker': ?0, 'date': ?1, 'interval': ?2}")
    Optional<StockPrice> findByTickerAndDateAndInterval(
            String ticker,
            LocalDateTime date,
            String interval
    );

    List<StockPrice> findByTickerInAndIntervalAndDateGreaterThanEqualOrderByDateDesc(
            List<String> tickers,
            String interval,
            LocalDateTime date
    );
}