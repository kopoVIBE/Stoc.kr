package com.stockr.be.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

@Configuration
// @EnableWebSocketMessageBroker  // 웹소켓 기능 임시 비활성화
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // config.enableSimpleBroker("/topic");
        // config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // registry.addEndpoint("/ws")
        //         .setAllowedOrigins("*")
        //         .withSockJS()
        //         .setClientLibraryUrl("https://cdn.jsdelivr.net/npm/sockjs-client@1.6.1/dist/sockjs.min.js")
        //         .setWebSocketEnabled(true)
        //         .setSessionCookieNeeded(false);
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        // registration.setMessageSizeLimit(8192)
        //         .setSendTimeLimit(20 * 1000)
        //         .setSendBufferSizeLimit(3 * 512 * 1024);
    }
}