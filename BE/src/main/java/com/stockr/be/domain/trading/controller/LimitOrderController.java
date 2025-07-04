package com.stockr.be.domain.trading.controller;

import com.stockr.be.domain.trading.dto.LimitOrderRequestDto;
import com.stockr.be.domain.trading.dto.LimitOrderResponseDto;
import com.stockr.be.domain.trading.entity.LimitOrder;
import com.stockr.be.domain.trading.service.LimitOrderService;
import com.stockr.be.global.common.ApiResponse;
import com.stockr.be.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trading/orders")
@RequiredArgsConstructor
public class LimitOrderController {

    private final LimitOrderService limitOrderService;

    private Long getCurrentUserId() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return user.getUserId();
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LimitOrderResponseDto>> createOrder(
            @RequestBody LimitOrderRequestDto requestDto) {
        LimitOrder order = limitOrderService.createOrder(requestDto);
        return ResponseEntity.ok(ApiResponse.success(LimitOrderResponseDto.from(order)));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<LimitOrderResponseDto>> getOrder(@PathVariable Long orderId) {
        LimitOrder order = limitOrderService.getOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success(LimitOrderResponseDto.from(order)));
    }

    @DeleteMapping("/{orderId}")
    public ResponseEntity<ApiResponse<LimitOrderResponseDto>> cancelOrder(@PathVariable Long orderId) {
        LimitOrder cancelledOrder = limitOrderService.cancelOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success(LimitOrderResponseDto.from(cancelledOrder)));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<LimitOrder>>> getPendingOrders() {
        Long userId = getCurrentUserId();
        List<LimitOrder> orders = limitOrderService.getPendingOrdersForUser(userId);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }
}