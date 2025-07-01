import { useEffect, useRef, useState } from "react";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

interface StockPrice {
  ticker: string;
  price: number;
  volume: number;
  timestamp: number;
}

export function useStockWebSocket(tickers: string[]) {
  const [stockPrices, setStockPrices] = useState<Record<string, number>>({});
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const client = useRef<Client | null>(null);
  const subscriptions = useRef<StompSubscription[]>([]);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!tickers.length) {
      console.log("No tickers provided, skipping websocket connection");
      return;
    }

    console.log("Connecting to WebSocket with tickers:", tickers);

    const wsClient = new Client({
      webSocketFactory: () => {
        console.log("Creating SockJS connection...");
        return new SockJS("http://localhost:8080/ws");
      },
      onConnect: () => {
        console.log("WebSocket Connected Successfully!");
        setConnectionError(null);
        reconnectAttempts.current = 0;

        // 기존 구독 해제
        subscriptions.current.forEach((sub) => {
          console.log("Unsubscribing from:", sub);
          sub.unsubscribe();
        });
        subscriptions.current = [];

        // 각 종목에 대한 구독 설정
        tickers.forEach((ticker) => {
          console.log(`Subscribing to stock: ${ticker}`);
          const subscription = wsClient.subscribe(
            `/topic/price`, // 모든 종목의 실시간 시세를 하나의 토픽으로 받음
            (message: IMessage) => {
              try {
                const priceData: StockPrice = JSON.parse(message.body);
                console.log(`Received price update:`, priceData);
                if (tickers.includes(priceData.ticker)) {
                  // 구독 중인 종목인 경우만 처리
                  setStockPrices((prev) => ({
                    ...prev,
                    [priceData.ticker]: priceData.price,
                  }));
                }
              } catch (error) {
                console.error(`Failed to parse price data:`, error);
              }
            }
          );
          subscriptions.current.push(subscription);
        });
      },
      onDisconnect: () => {
        console.log("WebSocket Disconnected!");
        setConnectionError("연결이 끊어졌습니다. 재연결을 시도합니다...");
      },
      onStompError: (frame) => {
        console.error("STOMP Error:", frame);
        setConnectionError(`STOMP 오류: ${frame.body}`);
      },
      onWebSocketError: (event) => {
        console.error("WebSocket Error:", event);
        reconnectAttempts.current++;

        if (reconnectAttempts.current >= maxReconnectAttempts) {
          setConnectionError(
            "웹소켓 연결에 실패했습니다. 페이지를 새로고침해주세요."
          );
          if (wsClient.active) {
            wsClient.deactivate();
          }
        } else {
          setConnectionError(
            `연결 오류 발생. 재시도 중... (${reconnectAttempts.current}/${maxReconnectAttempts})`
          );
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.current = wsClient;
    console.log("Activating STOMP client...");
    wsClient.activate();

    return () => {
      console.log("Cleaning up websocket connection...");
      subscriptions.current.forEach((sub) => sub.unsubscribe());
      if (wsClient.active) {
        wsClient.deactivate();
      }
    };
  }, [tickers]);

  return { stockPrices, connectionError };
}
