package com.stockr.be.domain.stock.service;

import com.stockr.be.domain.stock.dto.StockResponseDto;
import com.stockr.be.domain.stock.dto.RealtimeStockPriceDto;
import com.stockr.be.domain.stock.entity.Stock;
import com.stockr.be.domain.stock.repository.StockRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockService {
    private final StockRepository stockRepository;
    private final StockPriceService stockPriceService;
    
    public StockResponseDto getStock(String ticker) {
        Stock stock = stockRepository.findById(ticker)
                .orElseThrow(() -> new EntityNotFoundException("Stock not found: " + ticker));
        return StockResponseDto.from(stock);
    }
    
    public List<StockResponseDto> getStocks(List<String> tickers) {
        return stockRepository.findByTickerIn(tickers).stream()
                .map(StockResponseDto::from)
                .collect(Collectors.toList());
    }
    
    public List<StockResponseDto> getAllStocks() {
        return stockRepository.findAll().stream()
                .map(StockResponseDto::from)
                .collect(Collectors.toList());
    }
    
    public List<StockResponseDto> getTopMarketCapStocks() {
        return stockRepository.findTop10ByOrderByMarketCapDesc().stream()
                .map(StockResponseDto::from)
                .collect(Collectors.toList());
    }

    public List<String> getIndustryTypes() {
        return stockRepository.findDistinctIndustryTypes();
    }

    public List<Stock> getStocksByIndustry(String industryType) {
        return stockRepository.findByIndustryType(industryType);
    }
    
    public StockResponseDto getStockWithRealtimePrice(String ticker) {
        Stock stock = stockRepository.findById(ticker)
                .orElseThrow(() -> new EntityNotFoundException("Stock not found: " + ticker));
        
        StockResponseDto.StockResponseDtoBuilder builder = StockResponseDto.builder()
                .ticker(stock.getTicker())
                .name(stock.getName())
                .closePrice(stock.getClosePrice())
                .priceDiff(stock.getPriceDiff())
                .fluctuationRate(stock.getFluctuationRate())
                .eps(stock.getEps())
                .per(stock.getPer())
                .forwardEps(stock.getForwardEps())
                .forwardPer(stock.getForwardPer())
                .bps(stock.getBps())
                .pbr(stock.getPbr())
                .dividendPerShare(stock.getDividendPerShare())
                .dividendYield(stock.getDividendYield())
                .marketType(stock.getMarketType())
                .industryType(stock.getIndustryType())
                .marketCap(stock.getMarketCap());
        
        // 실시간 가격 데이터 조회
        try {
            RealtimeStockPriceDto realtimePrice = stockPriceService.getLatestPrice(ticker);
            if (realtimePrice != null && realtimePrice.getPrice() > 0) {
                builder.currentPrice(realtimePrice.getPrice().intValue());
            }
        } catch (Exception e) {
            // 실시간 데이터 조회 실패 시 종가 사용
        }
        
        return builder.build();
    }
    
    public List<StockResponseDto> getStocksWithRealtimePrice(List<String> tickers) {
        return tickers.stream()
                .map(this::getStockWithRealtimePrice)
                .collect(Collectors.toList());
    }
} 