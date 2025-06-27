package com.stockr.be.domain.stock.repository;

import com.stockr.be.domain.stock.entity.StockPrice;
import java.util.Optional;

public interface StockPriceRepository {
    void save(StockPrice stockPrice);

    Optional<StockPrice> findLatestByTicker(String ticker);
}