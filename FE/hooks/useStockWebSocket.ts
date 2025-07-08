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
  const pathnameRef = useRef<string>("");

  useEffect(() => {
    // 클라이언트 사이드에서만 pathname 설정
    pathnameRef.current = window.location.pathname;

    const client = new Client({
      // brokerURL: "ws://localhost:8080/ws", // SockJS를 위해 이 부분을 주석 처리
      webSocketFactory: () => {
        return new SockJS("http://52.79.250.104:8080/ws");
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);
        setError(null);
      },
      onDisconnect: () => {
        setIsConnected(false);
        subscriptionsRef.current = {};
      },
      onStompError: (frame) => {
        setError(`WebSocket Error: ${frame.headers["message"]}`);
      },
      onWebSocketError: (event) => {
        setError("WebSocket connection error");
      },
    });

    // pathname 변경 감지 함수
    const handlePathChange = () => {
      const currentPath = window.location.pathname;
      if (currentPath !== pathnameRef.current) {
        console.log("Path changed, cleaning up subscriptions");
        Object.keys(subscriptionsRef.current).forEach((key) => {
          const ticker = key.replace("price_", "").replace("orderbook_", "");
          if (subscriptionsRef.current[key]) {
            subscriptionsRef.current[key].unsubscribe();
            delete subscriptionsRef.current[key];

            // 서버에 구독 해제 알림
            if (clientRef.current?.connected) {
              clientRef.current.publish({
                destination: `/app/stock/unsubscribe/${ticker}`,
                body: JSON.stringify({ stockCode: ticker }),
                headers: { "content-type": "application/json" },
              });
            }
          }
        });
        pathnameRef.current = currentPath;
      }
    };

    clientRef.current = client;
    client.activate();

    // popstate 이벤트 리스너 추가
    window.addEventListener("popstate", handlePathChange);

    return () => {
      window.removeEventListener("popstate", handlePathChange);
      console.log("WebSocket hook cleanup");
      if (client.connected) {
        Object.keys(subscriptionsRef.current).forEach(unsubscribeFromStock);
        client.deactivate();
      }
    };
  }, []); // 빈 dependency array 사용

  const subscribeToStock = useCallback((ticker: string) => {
    if (!clientRef.current?.connected) {
      console.log("Cannot subscribe: WebSocket not connected");
      return;
    }

    // 각각의 구독에 대해 개별적으로 체크
    const priceKey = `price_${ticker}`;
    const orderBookKey = `orderbook_${ticker}`;

    console.log("Current subscriptions before:", subscriptionsRef.current);

    try {
      // 가격 구독이 없을 경우에만 구독
      if (!subscriptionsRef.current[priceKey]) {
        console.log(`Subscribing to price feed: /topic/price/${ticker}`);
        const priceSubscription = clientRef.current.subscribe(
          `/topic/price/${ticker}`,
          (message) => {
            try {
              const data = JSON.parse(message.body) as StockPrice;
              setStockData(data);
              setError(null);
            } catch (e) {
              setError("Failed to parse stock data");
            }
          }
        );
        console.log("Price subscription created:", priceSubscription);
        subscriptionsRef.current[priceKey] = priceSubscription;
      }

      // 호가 구독이 없을 경우에만 구독
      if (!subscriptionsRef.current[orderBookKey]) {
        console.log(
          `Subscribing to orderbook feed: /topic/orderbook/${ticker}`
        );
        const orderBookSubscription = clientRef.current.subscribe(
          `/topic/orderbook/${ticker}`,
          (message) => {
            try {
              console.log(`[OrderBook] Received message for ${ticker}:`, {
                raw: message.body,
                parsed: JSON.parse(message.body),
              });
              const data = JSON.parse(message.body) as OrderBook;
              setOrderBookData(data);
              setError(null);
            } catch (e) {
              console.error(`[OrderBook] Parse error:`, e);
              setError("Failed to parse orderbook data");
            }
          }
        );
        console.log("OrderBook subscription created:", orderBookSubscription);
        subscriptionsRef.current[orderBookKey] = orderBookSubscription;
      }

      console.log("Current subscriptions after:", subscriptionsRef.current);

      console.log(`Publishing subscription request for ${ticker}`);
      clientRef.current.publish({
        destination: `/app/subscribe/${ticker}`,
        body: JSON.stringify({ stockCode: ticker }),
        headers: { "content-type": "application/json" },
      });
    } catch (e) {
      console.error("Subscription error:", e);
      setError("Failed to subscribe to stock");
      delete subscriptionsRef.current[priceKey];
      delete subscriptionsRef.current[orderBookKey];
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
