package com.stockr.be.domain.stock.service;

import com.stockr.be.domain.stock.dto.StockPriceDto;
import com.stockr.be.domain.stock.dto.StockPriceResponse;
import com.stockr.be.domain.stock.entity.StockPrice;
import com.stockr.be.domain.stock.repository.StockPriceRepository;
import com.stockr.be.global.exception.BusinessException;
import com.stockr.be.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockPriceService {

    private final StockPriceRepository stockPriceRepository;
    private final Map<String, String> stockNameMap;  // 종목코드-종목명 매핑 (실제로는 DB나 외부 API에서 가져와야 함)

    @Transactional
    public StockPriceDto savePrice(StockPriceDto dto) {
        StockPrice stockPrice = StockPrice.builder()
                .ticker(dto.getTicker())
                .date(dto.getDate())
                .interval(dto.getInterval())
                .open(dto.getOpen())
                .high(dto.getHigh())
                .low(dto.getLow())
                .close(dto.getClose())
                .volume(dto.getVolume())
                .build();

        stockPriceRepository.save(stockPrice);
        return StockPriceDto.from(stockPrice);
    }

    public StockPriceResponse getPrices(String ticker, String interval, LocalDate startDate, LocalDate endDate, Integer limit) {
        validateInterval(interval);
        String stockName = getStockName(ticker);

        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : LocalDate.now().minusYears(3).atStartOfDay();
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);

        List<StockPrice> prices;
        if (startDate != null || endDate != null) {
            prices = stockPriceRepository.findByTickerAndIntervalAndDateBetweenOrderByDateDesc(
                    ticker, interval, startDateTime, endDateTime);
        } else {
            prices = stockPriceRepository.findByTickerAndIntervalOrderByDateDesc(ticker, interval);
        }

        if (limit != null && limit > 0) {
            prices = prices.stream().limit(limit).collect(Collectors.toList());
        }

        return StockPriceResponse.from(ticker, stockName, interval, prices);
    }

    public StockPriceResponse getPriceByDate(String ticker, String interval, LocalDate date) {
        validateInterval(interval);
        String stockName = getStockName(ticker);

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        StockPrice price = stockPriceRepository.findByTickerAndDateAndInterval(ticker, startOfDay, interval)
                .orElseThrow(() -> new BusinessException(ErrorCode.DATA_NOT_FOUND));

        return StockPriceResponse.from(ticker, stockName, interval, List.of(price));
    }

    public List<StockPriceResponse> getLatestPrices(List<String> tickers) {
        LocalDateTime yesterday = LocalDate.now().minusDays(1).atStartOfDay();
        
        List<StockPrice> prices = stockPriceRepository.findByTickerInAndIntervalAndDateGreaterThanEqualOrderByDateDesc(
                tickers, "daily", yesterday);

        return tickers.stream()
                .map(ticker -> {
                    String stockName = getStockName(ticker);
                    List<StockPrice> tickerPrices = prices.stream()
                            .filter(p -> p.getTicker().equals(ticker))
                            .collect(Collectors.toList());
                    return StockPriceResponse.from(ticker, stockName, "daily", tickerPrices);
                })
                .collect(Collectors.toList());
    }

    private void validateInterval(String interval) {
        if (!List.of("daily", "weekly", "monthly").contains(interval)) {
            throw new BusinessException(ErrorCode.INVALID_INTERVAL);
        }
    }

    private String getStockName(String ticker) {
        return stockNameMap.getOrDefault(ticker, ticker);
    }
}