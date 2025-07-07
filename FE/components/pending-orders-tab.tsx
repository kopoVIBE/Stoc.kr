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
      setPendingOrders(orders);
    } catch (error) {
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
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={
                      order.orderType === "BUY"
                        ? "text-blue-600 font-semibold"
                        : "text-red-600 font-semibold"
                    }
                  >
                    {order.orderType === "BUY" ? "매수" : "매도"} 주문
                  </span>
                  <span className="text-sm text-gray-500">
                    ({order.stockId})
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {formatPrice(order.price)}원 × {order.quantity}주
                </div>
                <div className="text-sm text-gray-500">
                  총 {formatPrice(order.price * order.quantity)}원
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
