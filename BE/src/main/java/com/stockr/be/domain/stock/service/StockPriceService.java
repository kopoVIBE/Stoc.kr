package com.stockr.be.domain.stock.service;

import com.stockr.be.domain.stock.dto.StockPriceDto;
import com.stockr.be.domain.stock.entity.StockPrice;
import com.stockr.be.domain.stock.repository.StockPriceRepository;
import com.stockr.be.global.exception.BusinessException;
import com.stockr.be.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StockPriceService {
    private final StockPriceRepository stockPriceRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void updatePrice(StockPriceDto dto) {
        StockPrice stockPrice = StockPrice.of(
                dto.getTicker(),
                dto.getPrice(),
                dto.getVolume());

        // 저장소에 저장
        stockPriceRepository.save(stockPrice);

        // WebSocket으로 실시간 전송
        messagingTemplate.convertAndSend(
                "/topic/price/" + stockPrice.getTicker(),
                StockPriceDto.from(stockPrice));
    }

    public StockPriceDto getLatestPrice(String ticker) {
        return stockPriceRepository.findLatestByTicker(ticker)
                .map(StockPriceDto::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.STOCK_PRICE_NOT_FOUND));
    }
}