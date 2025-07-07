package com.stockr.be.domain.trade.repository;

import com.stockr.be.domain.trade.entity.Order;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface OrderRepository extends MongoRepository<Order, String> {
    // 기본 CRUD 메서드는 MongoRepository에서 제공
} 