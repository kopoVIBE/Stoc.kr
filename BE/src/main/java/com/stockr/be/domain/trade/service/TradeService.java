package com.stockr.be.domain.trade.service;

import com.stockr.be.account.domain.Account;
import com.stockr.be.account.repository.AccountRepository;
import com.stockr.be.domain.trade.client.KISTradeClient;
import com.stockr.be.domain.trade.dto.OrderResponseDto;
import com.stockr.be.domain.trade.dto.TradeRequestDto;
import com.stockr.be.domain.trade.entity.Order;
import com.stockr.be.domain.trade.repository.OrderRepository;
import com.stockr.be.global.exception.BusinessException;
import com.stockr.be.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class TradeService {
    private final KISTradeClient kisTradeClient;
    private final OrderRepository orderRepository;
    private final AccountRepository accountRepository;

    @Transactional
    public Mono<OrderResponseDto> createOrder(TradeRequestDto request) {
        // 1. 계좌 조회 및 계좌번호 설정
        Account account = accountRepository.findById(Long.parseLong(request.getAccountId()))
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));
        
        // TradeRequestDto에 계좌번호 설정
        request.setAccountNumber(account.getAccountNumber());
        
        // 2. 주문 엔티티 생성
        final Order order = Order.builder()
                .accountId(request.getAccountId())
                .stockCode(request.getStockCode())
                .orderType(request.getOrderType())
                .quantity(request.getQuantity())
                .price(request.getPrice())
                .build();

        // 3. 주문 저장
        final Order savedOrder = orderRepository.save(order);
        final String orderId = savedOrder.getId();

        // 4. Python 서비스로 주문 요청
        return kisTradeClient.createOrder(orderId, request)
                .map(response -> {
                    // 5. 주문 완료 처리
                    savedOrder.complete(response.getData().getKisOrderId());
                    Order updatedOrder = orderRepository.save(savedOrder);
                    return OrderResponseDto.from(updatedOrder);
                })
                .onErrorResume(e -> {
                    // 6. 주문 실패 처리
                    savedOrder.fail();
                    Order failedOrder = orderRepository.save(savedOrder);
                    return Mono.error(e);
                });
    }
} 