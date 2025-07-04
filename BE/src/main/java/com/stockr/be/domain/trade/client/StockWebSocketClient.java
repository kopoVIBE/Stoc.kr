package com.stockr.be.domain.trade.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockr.be.global.config.KISConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.net.URI;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class StockWebSocketClient {
    
    private final KISConfig kisConfig;
    private final ObjectMapper objectMapper;
    private final ScheduledExecutorService scheduler;
    private final WebSocketClient client;
    private WebSocketSession session;
    private ScheduledFuture<?> pingTask;
    private final AtomicBoolean isReconnecting = new AtomicBoolean(false);
    
    public StockWebSocketClient(URI serverUri,
                              KISConfig kisConfig,
                              ObjectMapper objectMapper,
                              ScheduledExecutorService scheduler) {
        this.kisConfig = kisConfig;
        this.objectMapper = objectMapper;
        this.scheduler = scheduler;
        this.client = new StandardWebSocketClient();
    }
    
    public void connect() {
        try {
            WebSocketHandler handler = new TextWebSocketHandler() {
                @Override
                public void afterConnectionEstablished(WebSocketSession session) {
                    log.info("WebSocket Connection Established");
                    StockWebSocketClient.this.session = session;
                    startPingTask();
                }
                
                @Override
                protected void handleTextMessage(WebSocketSession session, TextMessage message) {
                    log.info("Received message: {}", message.getPayload());
                    // TODO: 메시지 처리 로직 구현
                }
            };
            
            client.doHandshake(handler, kisConfig.getApi().getWsUrl());
            log.info("WebSocket handshake initiated");
            
        } catch (Exception e) {
            log.error("Failed to connect to WebSocket", e);
            if (!isReconnecting.get()) {
                scheduleReconnect();
            }
        }
    }
    
    public void send(String message) {
        try {
            if (session != null && session.isOpen()) {
                session.sendMessage(new TextMessage(message));
            } else {
                log.warn("WebSocket session is not available");
                connect();
            }
        } catch (Exception e) {
            log.error("Failed to send message", e);
            if (!isReconnecting.get()) {
                scheduleReconnect();
            }
        }
    }
    
    private void startPingTask() {
        stopPingTask();
        pingTask = scheduler.scheduleAtFixedRate(() -> {
            try {
                if (session != null && session.isOpen()) {
                    Map<String, Object> pingHeader = new HashMap<>();
                    pingHeader.put("tr_id", "PINGPONG");
                    Map<String, Object> pingRequest = new HashMap<>();
                    pingRequest.put("header", pingHeader);
                    String pingMessage = objectMapper.writeValueAsString(pingRequest);
                    session.sendMessage(new TextMessage(pingMessage)); // 핑 메시지
                }
            } catch (Exception e) {
                log.error("Error sending ping", e);
            }
        }, 0, 30, TimeUnit.SECONDS);
    }
    
    private void stopPingTask() {
        if (pingTask != null && !pingTask.isCancelled()) {
            pingTask.cancel(true);
        }
    }
    
    private void scheduleReconnect() {
        if (isReconnecting.compareAndSet(false, true)) {
            scheduler.schedule(() -> {
                try {
                    log.info("Attempting to reconnect...");
                    connect();
                } catch (Exception e) {
                    log.error("Reconnection failed", e);
                } finally {
                    isReconnecting.set(false);
                }
            }, 5, TimeUnit.SECONDS);
        }
    }
} 