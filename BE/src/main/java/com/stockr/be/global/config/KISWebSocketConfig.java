package com.stockr.be.global.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockr.be.domain.trade.client.StockWebSocketClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.URI;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

@Configuration
public class KISWebSocketConfig {

    @Bean
    public ScheduledExecutorService scheduledExecutorService() {
        return Executors.newScheduledThreadPool(1);
    }

    @Bean
    public StockWebSocketClient stockWebSocketClient(KISConfig kisConfig,
                                                     ObjectMapper objectMapper,
                                                     ScheduledExecutorService scheduler) {
        URI serverUri = URI.create(kisConfig.getApi().getWsUrl());
        StockWebSocketClient client = new StockWebSocketClient(serverUri, kisConfig, objectMapper, scheduler);
        client.connect();
        return client;
    }
} 