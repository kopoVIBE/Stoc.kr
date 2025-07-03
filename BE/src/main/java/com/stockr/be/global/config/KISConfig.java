package com.stockr.be.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@ConfigurationProperties(prefix = "kis")
@Getter
@Setter
public class KISConfig {
    private App app;
    private Api api;

    @Getter
    @Setter
    public static class App {
        private String key;
        private String secret;
    }

    @Getter
    @Setter
    public static class Api {
        private String baseUrl;
        private String wsUrl;
    }

    @Bean
    public WebClient kisWebClient() {
        return WebClient.builder()
                .baseUrl(api.getBaseUrl())
                .build();
    }
} 