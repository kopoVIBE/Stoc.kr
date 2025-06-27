package com.stockr.be.common.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.bson.Document;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/health")
public class HealthCheckController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @GetMapping
    public ResponseEntity<Map<String, String>> checkHealth() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");

        try {
            // MySQL 헬스체크
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            status.put("mysql", "UP");
        } catch (Exception e) {
            status.put("mysql", "DOWN - " + e.getMessage());
        }

        try {
            // MongoDB 헬스체크
            mongoTemplate.getDb().runCommand(new Document("ping", 1));
            status.put("mongodb", "UP");
        } catch (Exception e) {
            status.put("mongodb", "DOWN - " + e.getMessage());
        }

        try {
            // Redis 헬스체크
            redisTemplate.opsForValue().get("health");
            status.put("redis", "UP");
        } catch (Exception e) {
            status.put("redis", "DOWN - " + e.getMessage());
        }

        try {
            // Kafka 헬스체크
            kafkaTemplate.send("health-check", "ping");
            status.put("kafka", "UP");
        } catch (Exception e) {
            status.put("kafka", "DOWN - " + e.getMessage());
        }

        return ResponseEntity.ok(status);
    }
} 