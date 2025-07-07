import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useToast } from "@/components/ui/use-toast";

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

interface OrderEvent {
  type:
    | "ORDER_CREATED"
    | "ORDER_EXECUTED"
    | "ORDER_CANCELLED"
    | "ORDER_WAITING";
  stockCode: string;
  stockName: string;
  orderType: "BUY" | "SELL";
  quantity: number;
  price: number;
  status: string;
}

export function useStockWebSocket() {
  const [stockData, setStockData] = useState<any>(null);
  const [orderBookData, setOrderBookData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stompClientRef = useRef<Client | null>(null);
  const { toast } = useToast();

  const handleOrderEvent = useCallback(
    (orderData: any) => {
      console.log("주문 이벤트 수신:", orderData);

      // 주문 데이터 파싱
      const { stockId, orderType, quantity, price } = orderData;

      // 토스트 알림 표시
      toast({
        title: "주문 접수 완료",
        description: `${stockId} ${quantity}주 ${
          orderType === "BUY" ? "매수" : "매도"
        } 주문이 ${price.toLocaleString()}원에 접수되었습니다.`,
        variant: "default",
      });
    },
    [toast]
  );

  useEffect(() => {
    const connectWebSocket = () => {
      const socket = new SockJS("http://localhost:8080/ws");
      const client = new Client({
        webSocketFactory: () => socket,
        debug: (str) => {
          console.log("STOMP:", str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      client.onConnect = () => {
        console.log("WebSocket 연결됨");
        setIsConnected(true);
        setError(null);

        // 주문 이벤트 구독
        client.subscribe("/topic/order", (message) => {
          try {
            const orderData = JSON.parse(message.body);
            console.log("주문 메시지 수신:", orderData);
            handleOrderEvent(orderData);
          } catch (error) {
            console.error("주문 메시지 처리 실패:", error);
          }
        });
      };

      client.onDisconnect = () => {
        console.log("WebSocket 연결 해제됨");
        setIsConnected(false);
      };

      client.onStompError = (frame) => {
        console.error("STOMP 에러:", frame);
        setError("WebSocket 연결 오류가 발생했습니다.");
      };

      client.activate();
      stompClientRef.current = client;

      return () => {
        if (client.active) {
          client.deactivate();
        }
      };
    };

    const cleanup = connectWebSocket();
    return () => cleanup();
  }, [handleOrderEvent]);

  const subscribeToStock = useCallback((ticker: string) => {
    if (!stompClientRef.current?.active) {
      console.warn("WebSocket이 연결되지 않았습니다.");
      return;
    }

    console.log(`${ticker} 구독 시작`);

    // 실시간 가격 구독
    stompClientRef.current.subscribe(`/topic/stock/${ticker}`, (message) => {
      try {
        const data = JSON.parse(message.body);
        setStockData(data);
      } catch (error) {
        console.error("실시간 가격 메시지 처리 실패:", error);
      }
    });

    // 호가 데이터 구독
    stompClientRef.current.subscribe(
      `/topic/orderbook/${ticker}`,
      (message) => {
        try {
          const data = JSON.parse(message.body);
          setOrderBookData(data);
        } catch (error) {
          console.error("호가 데이터 메시지 처리 실패:", error);
        }
      }
    );
  }, []);

  const unsubscribeFromStock = useCallback((ticker: string) => {
    if (!stompClientRef.current?.active) return;
    console.log(`${ticker} 구독 해제`);
    // 구독 해제 로직은 STOMP 클라이언트가 자동으로 처리
  }, []);

  return {
    stockData,
    orderBookData,
    isConnected,
    error,
    subscribeToStock,
    unsubscribeFromStock,
  };
}
