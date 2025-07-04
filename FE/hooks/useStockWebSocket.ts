import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export interface StockPrice {
  ticker: string;
  stockCode: string;
  price: number;
  volume: number;
  timestamp: number;
}

export interface OrderBookItem {
  price: number;
  volume: number;
  diff: string;
}

export interface OrderBook {
  askPrices: OrderBookItem[];
  bidPrices: OrderBookItem[];
  totalAskVolume: number;
  totalBidVolume: number;
}

export const useStockWebSocket = () => {
  const [stockData, setStockData] = useState<StockPrice | null>(null);
  const [orderBookData, setOrderBookData] = useState<OrderBook | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    const client = new Client({
      // brokerURL: "ws://localhost:8080/ws", // SockJS를 위해 이 부분을 주석 처리
      webSocketFactory: () => {
        return new SockJS("http://localhost:8080/ws");
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("WebSocket Connected");
        setIsConnected(true);
        setError(null);
      },
      onDisconnect: () => {
        console.log("WebSocket Disconnected");
        setIsConnected(false);
        subscriptionsRef.current = {};
      },
      onStompError: (frame) => {
        console.error("STOMP error", frame);
        setError(`WebSocket Error: ${frame.headers["message"]}`);
      },
      onWebSocketError: (event) => {
        console.error("WebSocket Error:", event);
        setError("WebSocket connection error");
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      console.log("WebSocket hook cleanup");
      if (client.connected) {
        Object.keys(subscriptionsRef.current).forEach(unsubscribeFromStock);
        client.deactivate();
      }
    };
  }, []);

  const subscribeToStock = useCallback((ticker: string) => {
    if (!clientRef.current?.connected) {
      console.log(`Cannot subscribe to ${ticker}: WebSocket not connected`);
      return;
    }

    if (subscriptionsRef.current[ticker]) {
      console.log(`Already subscribed to ${ticker}`);
      return;
    }

    try {
      console.log(`Subscribing to ${ticker}`);

      subscriptionsRef.current[`price_${ticker}`] = clientRef.current.subscribe(
        `/topic/price/${ticker}`,
        (message) => {
          try {
            const data = JSON.parse(message.body) as StockPrice;
            setStockData(data);
            setError(null);
          } catch (e) {
            console.error(`Parse error for ${ticker} price:`, e);
            setError("Failed to parse stock data");
          }
        }
      );

      subscriptionsRef.current[`orderbook_${ticker}`] =
        clientRef.current.subscribe(`/topic/orderbook/${ticker}`, (message) => {
          try {
            const data = JSON.parse(message.body) as OrderBook;
            setOrderBookData(data);
            setError(null);
          } catch (e) {
            console.error(`Parse error for ${ticker} orderbook:`, e);
            setError("Failed to parse orderbook data");
          }
        });

      clientRef.current.publish({
        destination: `/app/subscribe/${ticker}`,
        body: JSON.stringify({ stockCode: ticker }),
        headers: { "content-type": "application/json" },
      });

      console.log(`Successfully subscribed to ${ticker}`);
    } catch (e) {
      console.error(`Failed to subscribe to ${ticker}:`, e);
      setError("Failed to subscribe to stock");
      delete subscriptionsRef.current[`price_${ticker}`];
      delete subscriptionsRef.current[`orderbook_${ticker}`];
    }
  }, []);

  const unsubscribeFromStock = useCallback((ticker: string) => {
    if (!clientRef.current?.connected) {
      console.log(`Cannot unsubscribe from ${ticker}: WebSocket not connected`);
      return;
    }

    try {
      console.log(`Unsubscribing from ${ticker}`);

      if (subscriptionsRef.current[`price_${ticker}`]) {
        subscriptionsRef.current[`price_${ticker}`].unsubscribe();
        delete subscriptionsRef.current[`price_${ticker}`];
      }

      if (subscriptionsRef.current[`orderbook_${ticker}`]) {
        subscriptionsRef.current[`orderbook_${ticker}`].unsubscribe();
        delete subscriptionsRef.current[`orderbook_${ticker}`];
      }

      clientRef.current.publish({
        destination: `/app/unsubscribe/${ticker}`,
        body: JSON.stringify({ stockCode: ticker }),
        headers: { "content-type": "application/json" },
      });

      console.log(`Successfully unsubscribed from ${ticker}`);
    } catch (e) {
      console.error(`Failed to unsubscribe from ${ticker}:`, e);
      setError("Failed to unsubscribe from stock");
    }
  }, []);

  return {
    stockData,
    orderBookData,
    isConnected,
    error,
    subscribeToStock,
    unsubscribeFromStock,
  };
};
