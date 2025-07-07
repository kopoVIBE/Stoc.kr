"use client";

import { useEffect, useState } from "react";
import { LimitOrder, getPendingOrders } from "@/api/stock";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export function PendingOrdersTab() {
  const [pendingOrders, setPendingOrders] = useState<LimitOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPendingOrders = async () => {
    try {
      setIsLoading(true);
      const orders = await getPendingOrders();
      console.log("대기 주문 데이터:", orders);
      setPendingOrders(orders);
    } catch (error) {
      console.error("대기 주문 조회 실패:", error);
      toast({
        title: "주문 조회 실패",
        description: "대기 중인 주문을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  if (isLoading) {
    return <div className="text-center py-4">로딩 중...</div>;
  }

  if (pendingOrders.length === 0) {
    return <div className="text-center py-4">대기 중인 주문이 없습니다.</div>;
  }

  return (
    <div className="space-y-2">
      {pendingOrders.map((order) => (
        <Card key={order.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-white">
                    <img
                      src={`/stock-images/${order.stock.ticker}.png`}
                      alt={order.stock.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder-logo.svg";
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{order.stock.name}</span>
                      <span className="text-sm text-gray-500">
                        ({order.stock.ticker})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          order.orderType === "BUY"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {order.orderType === "BUY" ? "매수" : "매도"}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatPrice(order.price)}원 × {order.quantity}주
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    // TODO: 주문 취소 기능 구현
                    toast({
                      title: "주문 취소",
                      description: "주문 취소 기능은 아직 구현되지 않았습니다.",
                    });
                  }}
                >
                  취소
                </Button>
              </div>
              <div className="text-sm text-gray-500 border-t pt-2">
                <div className="flex justify-between items-center">
                  <span>총 주문 금액</span>
                  <span className="font-semibold text-gray-700">
                    {formatPrice(order.price * order.quantity)}원
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
