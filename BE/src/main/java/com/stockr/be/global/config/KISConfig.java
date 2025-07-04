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
    private Api api = new Api();
    private Virtual virtual = new Virtual();

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
        private String appKey;
        private String appSecret;
        private String account;
        private String productCode;
    }

    @Getter
    @Setter
    public static class Virtual {
        private String key;
        private String secret;
        private String account;
        private String productCode;
    }

    @Bean
    public WebClient kisWebClient() {
        return WebClient.builder()
                .baseUrl(api.getBaseUrl())
                .build();
    }
} 