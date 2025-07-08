package com.stockr.be.domain.trade.client;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.net.URI;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockr.be.domain.stock.dto.RealtimeOrderBookDto;
import com.stockr.be.domain.stock.dto.RealtimeStockPriceDto;
import com.stockr.be.global.config.KISConfig;

import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class StockWebSocketClient {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final KISConfig kisConfig;
    private final ObjectMapper objectMapper;
    private final ScheduledExecutorService scheduler;
    private final WebSocketClient client;
    private WebSocketSession session;
    private ScheduledFuture<?> pingTask;
    private final AtomicBoolean isReconnecting = new AtomicBoolean(false);
    
    public StockWebSocketClient(SimpMessagingTemplate messagingTemplate,
                              KISConfig kisConfig,
                              ObjectMapper objectMapper,
                              ScheduledExecutorService scheduler) {
        this.messagingTemplate = messagingTemplate;
        this.kisConfig = kisConfig;
        this.objectMapper = objectMapper;
        this.scheduler = scheduler;
        this.client = new StandardWebSocketClient();
    }
    
    public void connect() {
        if (session != null && session.isOpen()) {
            log.info("WebSocket is already connected.");
            return;
        }
        try {
            log.info("Attempting to connect to WebSocket at {}...", kisConfig.getApi().getWsUrl());
            WebSocketHandler handler = new TextWebSocketHandler() {
                @Override
                public void afterConnectionEstablished(WebSocketSession session) {
                    log.info("WebSocket Connection Established. Session ID: {}", session.getId());
                    StockWebSocketClient.this.session = session;
                    startPingTask();
                }
                
                @Override
                protected void handleTextMessage(WebSocketSession session, TextMessage message) {
                    String payload = message.getPayload();
//                    log.info("Received from KIS: {}", payload);

                    if (payload.startsWith("0|H0STASP0")) { // 주식호가
                        try {
                            String[] parts = payload.split("\\|");
                            if (parts.length < 4) return;

                            String[] data = parts[3].split("\\^");
                            String stockCode = data[0];

                            // 실시간 시세 처리
                            RealtimeStockPriceDto priceDto = RealtimeStockPriceDto.builder()
                                    .stockCode(stockCode)
                                    .hour(data[1]) // 체결시간
                                    .price(Long.parseLong(data[2])) // 현재가
                                    .compareYesterdaySign(data[4]) // 전일 대비 부호
                                    .compareYesterday(Double.parseDouble(data[5])) // 전일 대비
                                    .compareYesterdayRate(Double.parseDouble(data[6])) // 전일 대비율
                                    .accumulatedTradeVolume(Long.parseLong(data[13])) // 누적 거래량
                                    .build();
                            messagingTemplate.convertAndSend("/topic/price/" + stockCode, priceDto);

                            // 실시간 호가 처리 (인덱스 전면 수정)
                            List<RealtimeOrderBookDto.OrderBookItem> askPrices = new ArrayList<>();
                            List<RealtimeOrderBookDto.OrderBookItem> bidPrices = new ArrayList<>();

                            // KIS H0STASP0 명세 기준: 매도호가(3~12), 매수호가(13~22), 매도호가잔량(23~32), 매수호가잔량(33~42)
                            for (int i = 0; i < 10; i++) {
                                askPrices.add(new RealtimeOrderBookDto.OrderBookItem(Long.parseLong(data[3 + i]), Long.parseLong(data[23 + i])));
                                bidPrices.add(new RealtimeOrderBookDto.OrderBookItem(Long.parseLong(data[13 + i]), Long.parseLong(data[33 + i])));
                            }

                            RealtimeOrderBookDto orderBookDto = new RealtimeOrderBookDto(askPrices, bidPrices, Long.parseLong(data[43]), Long.parseLong(data[44]));
                            log.info("Processed Order Book for {}: {}", stockCode, orderBookDto);
                            messagingTemplate.convertAndSend("/topic/orderbook/" + stockCode, orderBookDto);

                        } catch (Exception e) {
                            log.error("Error processing KIS real-time data: {}", payload, e);
                        }
                    } else if (payload.startsWith("1|")) { // 주식체결
                        // 필요 시 체결 데이터 처리 로직 추가
                    } else if (payload.startsWith("{")) {
//                        log.info("Received JSON message (likely auth response): {}", payload);
                    }
                }

                @Override
                public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) {
                    log.warn("WebSocket Connection Closed. Session ID: {}, Status: {}", session.getId(), status);
                    stopPingTask();
                    if (!isReconnecting.get()) {
                        scheduleReconnect();
                    }
                }

                @Override
                public void handleTransportError(WebSocketSession session, Throwable exception) {
                    log.error("WebSocket Transport Error. Session ID: {}", session.getId(), exception);
                }
            };
            
            client.execute(handler, new WebSocketHttpHeaders(), URI.create(kisConfig.getApi().getWsUrl()));
            log.info("WebSocket handshake initiated.");
            
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
                log.info("Sending to KIS: {}", message);
                session.sendMessage(new TextMessage(message));
            } else {
                log.warn("WebSocket session is not available. Message not sent: {}", message);
                connect(); // Try to reconnect
            }
        } catch (Exception e) {
            log.error("Failed to send message: {}", message, e);
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