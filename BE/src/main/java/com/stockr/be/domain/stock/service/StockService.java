package com.stockr.be.domain.stock.service;

import com.stockr.be.domain.stock.dto.StockResponseDto;
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
    
    public List<StockResponseDto> getTopVolumeStocks() {
        return stockRepository.findTop10ByOrderByVolumeDesc().stream()
                .map(StockResponseDto::from)
                .collect(Collectors.toList());
    }
} 