package com.stockr.be.domain.stock.service;

import com.stockr.be.domain.stock.dto.StockResponseDto;
import com.stockr.be.domain.stock.entity.Stock;
import com.stockr.be.domain.stock.entity.StockHolding;
import com.stockr.be.domain.stock.repository.StockRepository;
import com.stockr.be.domain.stock.repository.StockHoldingRepository;
import com.stockr.be.domain.trading.entity.TradeLog;
import com.stockr.be.domain.trading.repository.TradeLogRepository;
import com.stockr.be.user.domain.User;
import com.stockr.be.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockRecommendationService {

    private final TradeLogRepository tradeLogRepository;
    private final UserRepository userRepository;
    private final StockRepository stockRepository;
    private final StockHoldingRepository stockHoldingRepository;
    private final StockService stockService;

    /**
     * 사용자의 투자자 성향을 기반으로 추천 종목을 반환합니다.
     * 같은 투자자 성향을 가진 사용자들이 거래한 종목들을 분석하여 추천합니다.
     * 사용자가 이미 보유하고 있는 종목은 제외합니다.
     */
    public List<StockResponseDto> getRecommendedStocksByInvestmentStyle(String investmentStyle, Long userId, int limit) {
        log.info("투자자 성향 기반 추천 종목 조회 - 성향: {}, 사용자: {}, 개수: {}", investmentStyle, userId, limit);

        try {
            // 1. 사용자가 보유하고 있는 종목들의 티커 조회
            Set<String> userHoldingTickers = getUserHoldingTickers(userId);
            log.info("사용자 보유 종목 수: {}", userHoldingTickers.size());

            // 2. 같은 투자자 성향을 가진 사용자들의 계좌 ID 조회
            List<Long> userIdsWithSameStyle = userRepository.findByInvestmentStyle(investmentStyle)
                    .stream()
                    .map(User::getUserId)
                    .collect(Collectors.toList());

            if (userIdsWithSameStyle.isEmpty()) {
                log.warn("같은 투자자 성향을 가진 사용자가 없습니다: {}", investmentStyle);
                return getFallbackRecommendationsExcludingHoldings(userHoldingTickers, limit);
            }

            // 3. 해당 사용자들의 거래 내역에서 거래된 종목들 조회
            List<TradeLog> tradeLogs = tradeLogRepository.findByAccount_User_UserIdIn(userIdsWithSameStyle);
            
            if (tradeLogs.isEmpty()) {
                log.warn("같은 투자자 성향 사용자들의 거래 내역이 없습니다: {}", investmentStyle);
                return getFallbackRecommendationsExcludingHoldings(userHoldingTickers, limit);
            }

            // 4. 종목별 거래 빈도 계산 (보유 종목 제외)
            Map<String, Long> stockTradeCount = tradeLogs.stream()
                    .filter(tradeLog -> !userHoldingTickers.contains(tradeLog.getStock().getTicker()))
                    .collect(Collectors.groupingBy(
                            tradeLog -> tradeLog.getStock().getTicker(),
                            Collectors.counting()
                    ));

            if (stockTradeCount.isEmpty()) {
                log.warn("보유 종목을 제외한 거래 내역이 없습니다: {}", investmentStyle);
                return getFallbackRecommendationsExcludingHoldings(userHoldingTickers, limit);
            }

            // 5. 거래 빈도순으로 정렬하고 상위 종목들 선택
            List<String> topTradedTickers = stockTradeCount.entrySet().stream()
                    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                    .limit(limit * 3) // 더 많은 종목을 가져와서 랜덤 선택
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toList());

            // 6. 랜덤하게 limit개 선택
            Collections.shuffle(topTradedTickers);
            List<String> selectedTickers = topTradedTickers.stream()
                    .limit(limit)
                    .collect(Collectors.toList());

            // 7. 선택된 종목들의 상세 정보 조회 (실시간 가격 포함)
            List<StockResponseDto> recommendations = stockService.getStocksWithRealtimePrice(selectedTickers);

            log.info("투자자 성향 기반 추천 종목 조회 완료 - 성향: {}, 추천 종목 수: {}", 
                    investmentStyle, recommendations.size());

            return recommendations;

        } catch (Exception e) {
            log.error("투자자 성향 기반 추천 종목 조회 중 오류 발생: {}", e.getMessage(), e);
            return getFallbackRecommendationsExcludingHoldings(getUserHoldingTickers(userId), limit);
        }
    }

    /**
     * 사용자가 보유하고 있는 종목들의 티커를 조회합니다.
     */
    public Set<String> getUserHoldingTickers(Long userId) {
        try {
            List<StockHolding> holdings = stockHoldingRepository.findByAccount_User_UserId(userId);
            return holdings.stream()
                    .map(holding -> holding.getStock().getTicker())
                    .collect(Collectors.toSet());
        } catch (Exception e) {
            log.warn("사용자 보유 종목 조회 실패 (사용자 ID: {}): {}", userId, e.getMessage());
            return new HashSet<>();
        }
    }

    /**
     * 추천 종목을 찾을 수 없을 때 사용할 대체 추천 (시가총액 상위 종목, 보유 종목 제외)
     */
    public List<StockResponseDto> getFallbackRecommendationsExcludingHoldings(Set<String> userHoldingTickers, int limit) {
        log.info("대체 추천 종목 조회 - 시가총액 상위 {}개 (보유 종목 제외)", limit);
        
        List<Stock> topMarketCapStocks = stockRepository.findTop10ByOrderByMarketCapDesc();
        List<String> selectedTickers = topMarketCapStocks.stream()
                .filter(stock -> !userHoldingTickers.contains(stock.getTicker()))
                .limit(limit)
                .map(Stock::getTicker)
                .collect(Collectors.toList());
        
        return stockService.getStocksWithRealtimePrice(selectedTickers);
    }

    /**
     * 추천 종목을 찾을 수 없을 때 사용할 대체 추천 (시가총액 상위 종목)
     */
    private List<StockResponseDto> getFallbackRecommendations(int limit) {
        log.info("대체 추천 종목 조회 - 시가총액 상위 {}개", limit);
        
        List<Stock> topMarketCapStocks = stockRepository.findTop10ByOrderByMarketCapDesc();
        return topMarketCapStocks.stream()
                .limit(limit)
                .map(StockResponseDto::from)
                .collect(Collectors.toList());
    }
} 