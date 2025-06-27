package com.stockr.be.common.controller;

import java.util.HashMap;
import java.util.Map;

import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> status = new HashMap<>();

        // MySQL 헬스체크
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            status.put("mysql", "UP");
        } catch (Exception e) {
            status.put("mysql", "DOWN - " + e.getMessage());
        }

        // MongoDB 헬스체크
        try {
            mongoTemplate.getDb().runCommand(new Document("ping", 1));
            status.put("mongodb", "UP");
        } catch (Exception e) {
            status.put("mongodb", "DOWN - " + e.getMessage());
        }

        // Redis 헬스체크
        try {
            redisTemplate.opsForValue().set("health", "check");
            String value = redisTemplate.opsForValue().get("health");
            if ("check".equals(value)) {
                status.put("redis", "UP");
            } else {
                status.put("redis", "DOWN - Value mismatch");
            }
        } catch (Exception e) {
            status.put("redis", "DOWN - " + e.getMessage());
        }

        // Kafka 헬스체크
        try {
            kafkaTemplate.send("health-check", "test").get();
            status.put("kafka", "UP");
        } catch (Exception e) {
            status.put("kafka", "DOWN - " + e.getMessage());
        }

        status.put("status", "UP");
        return ResponseEntity.ok(status);
    }
}