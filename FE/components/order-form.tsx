import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OrderFormProps {
  type: "buy" | "sell";
  stockData: {
    price: number;
    stockCode: string;
  } | null;
}

export function OrderForm({ type, stockData }: OrderFormProps) {
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState(stockData?.price?.toString() || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 주문 처리 로직
    console.log("Order submitted:", {
      type,
      stockCode: stockData?.stockCode,
      quantity,
      price,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">주문가격</label>
        <Input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="주문 가격을 입력하세요"
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">주문수량</label>
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="주문 수량을 입력하세요"
          className="w-full"
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        variant={type === "buy" ? "default" : "secondary"}
      >
        {type === "buy" ? "매수" : "매도"}
      </Button>
    </form>
  );
}
