import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";

interface StockPrice {
  ticker: string;
  stockCode: string;
  price: number;
  volume: number;
  timestamp: number;
}

export const useStockWebSocket = (initialStockCode?: string) => {
  const [stockData, setStockData] = useState<StockPrice | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);
        setError(null);
        console.log('WebSocket Connected');
        
        if (initialStockCode) {
          subscribeToStock(initialStockCode);
        }
      },
      onDisconnect: () => {
        setIsConnected(false);
        console.log('WebSocket Disconnected');
      },
      onStompError: (frame) => {
        setError(`WebSocket Error: ${frame.headers['message']}`);
        console.error('STOMP error', frame);
      },
      onWebSocketError: (event) => {
        console.error('WebSocket Error:', event);
        setError('WebSocket connection error');
      }
    });

    clientRef.current = client;
    client.activate();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      client.deactivate();
    };
  }, [initialStockCode]);

  const subscribeToStock = (stockCode: string) => {
    if (!clientRef.current?.connected) {
      setError('WebSocket is not connected');
      return;
    }

    // 이전 구독 해제
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    try {
      // 구독 요청 전송
      clientRef.current.publish({
        destination: `/app/stock/subscribe/${stockCode}`,
        body: JSON.stringify({ stockCode }),
        headers: { 'content-type': 'application/json' }
      });

      // 실시간 데이터 구독
      subscriptionRef.current = clientRef.current.subscribe(
        `/topic/price/${stockCode}`,
        (message) => {
          try {
            const data = JSON.parse(message.body) as StockPrice;
            setStockData(data);
            setError(null);
          } catch (e) {
            setError('Failed to parse stock data');
            console.error('Parse error:', e);
          }
        }
      );

      console.log(`Subscribed to ${stockCode}`);
    } catch (e) {
      setError('Failed to subscribe to stock');
      console.error('Subscribe error:', e);
    }
  };

  const unsubscribeFromStock = (stockCode: string) => {
    if (!clientRef.current?.connected) {
      return;
    }

    try {
      clientRef.current.publish({
        destination: `/app/stock/unsubscribe/${stockCode}`,
        body: JSON.stringify({ stockCode }),
        headers: { 'content-type': 'application/json' }
      });

      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }

      setStockData(null);
      console.log(`Unsubscribed from ${stockCode}`);
    } catch (e) {
      setError('Failed to unsubscribe from stock');
      console.error('Unsubscribe error:', e);
    }
  };

  return {
    stockData,
    isConnected,
    error,
    subscribeToStock,
    unsubscribeFromStock,
  };
};
