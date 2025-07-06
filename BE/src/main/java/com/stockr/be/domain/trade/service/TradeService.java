package com.stockr.be.domain.trade.service;

import com.stockr.be.domain.trade.client.KISTradeClient;
import com.stockr.be.domain.trade.dto.OrderResponseDto;
import com.stockr.be.domain.trade.dto.TradeRequestDto;
import com.stockr.be.domain.trade.entity.Order;
import com.stockr.be.domain.trade.repository.OrderRepository;
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

    @Transactional
    public Mono<OrderResponseDto> createOrder(TradeRequestDto request) {
        // 1. 주문 엔티티 생성
        final Order order = Order.builder()
                .accountId(request.getAccountId())
                .stockCode(request.getStockCode())
                .orderType(request.getOrderType())
                .quantity(request.getQuantity())
                .price(request.getPrice())
                .build();

        // 2. 주문 저장
        final Order savedOrder = orderRepository.save(order);
        final String orderId = savedOrder.getId();

        // 3. Python 서비스로 주문 요청
        return kisTradeClient.createOrder(orderId, request)
                .map(response -> {
                    // 4. 주문 완료 처리
                    savedOrder.complete(response.getData().getKisOrderId());
                    Order updatedOrder = orderRepository.save(savedOrder);
                    return OrderResponseDto.from(updatedOrder);
                })
                .onErrorResume(e -> {
                    // 5. 주문 실패 처리
                    savedOrder.fail();
                    Order failedOrder = orderRepository.save(savedOrder);
                    return Mono.error(e);
                });
    }
} 