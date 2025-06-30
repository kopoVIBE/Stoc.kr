"use client";

import { TabsContent } from "@/components/ui/tabs";
import { TabsTrigger } from "@/components/ui/tabs";
import { TabsList } from "@/components/ui/tabs";
import { Tabs } from "@/components/ui/tabs";
import { useState, useRef, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Heart, Minus, Plus, Info } from "lucide-react";
import { CandlestickChart } from "@/components/candlestick-chart";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import dynamic from "next/dynamic";
import { Stock, stockApi } from "@/api/stock";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";

interface PriceHistoryItem {
  time: string;
  price: string;
  change: string;
  volume: string;
  isUp: boolean;
}

interface TabItem {
  id: string;
  label: string;
}

const priceHistory: PriceHistoryItem[] = [
  {
    time: "19:59:59",
    price: "60,800원",
    change: "+0.99%",
    volume: "25,560,423",
    isUp: true,
  },
  {
    time: "19:59:59",
    price: "60,900원",
    change: "+1.16%",
    volume: "25,559,723",
    isUp: true,
  },
  {
    time: "19:59:59",
    price: "60,800원",
    change: "+0.99%",
    volume: "25,559,693",
    isUp: true,
  },
];

const tabs: TabItem[] = [
  { id: "price", label: "실시간 시세" },
  { id: "info", label: "종목 정보" },
  { id: "recommend", label: "관련 종목 추천" },
];

// 클라이언트 사이드에서만 렌더링되는 컴포넌트
const ClientSideChart = dynamic(
  () =>
    import("@/components/candlestick-chart").then(
      (mod) => mod.CandlestickChart
    ),
  {
    ssr: false,
  }
);

interface UnderlineStyle {
  left?: number;
  width?: number;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function StockDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [stock, setStock] = useState<Stock | null>(null);
  const realTimePrice = useStockWebSocket(id);
  const [activeTab, setActiveTab] = useState("price");
  const [underlineStyle, setUnderlineStyle] = useState<UnderlineStyle>({});
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const data = await stockApi.getStock(id);
        setStock(data);
      } catch (error) {
        console.error("Failed to fetch stock:", error);
      }
    };

    fetchStock();
  }, [id]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const activeTabIndex = tabs.findIndex((tab) => tab.id === activeTab);
      const activeTabRef = tabRefs.current[activeTabIndex];
      if (activeTabRef) {
        setUnderlineStyle({
          left: activeTabRef.offsetLeft,
          width: activeTabRef.offsetWidth,
        });
      }
    }
  }, [activeTab, mounted]);

  const setTabRef = (el: HTMLButtonElement | null, index: number) => {
    tabRefs.current[index] = el;
  };

  if (!stock) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gray-50/50 p-4 rounded-lg">
      <div className="lg:col-span-2 space-y-4">
        {/* Stock Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/samsung-logo.png"
              alt="Samsung"
              className="w-12 h-12 rounded-md"
            />
            <div>
              <h1 className="text-xl font-bold">
                {stock.name} ({stock.ticker})
              </h1>
              <p className="text-2xl font-bold">
                현재가:{" "}
                {(realTimePrice?.price || stock.currentPrice).toLocaleString()}
                원
              </p>
            </div>
          </div>
          <Button variant="outline" size="icon">
            <Heart className="w-5 h-5 text-gray-400" />
          </Button>
        </div>

        {/* Chart */}
        <Card>
          <CardContent className="p-2">
            <CandlestickChart />
          </CardContent>
        </Card>

        {/* Info Tabs */}
        <div className="relative border-b-2 border-gray-200">
          <div className="flex space-x-8">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                ref={(el) => setTabRef(el, index)}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "py-3",
                  activeTab === tab.id
                    ? "text-black font-semibold"
                    : "text-gray-500"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div
            className="absolute bottom-[-2px] h-1 bg-black transition-all duration-300"
            style={underlineStyle}
          />
        </div>
        <div className="pt-4">
          {activeTab === "price" && <PriceTabContent ticker={id} />}
          {activeTab === "info" && <InfoTabContent />}
          {activeTab === "recommend" && <RecommendTabContent />}
        </div>
      </div>

      {/* Order Panel */}
      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle className="text-lg">주문하기</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="buy" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="buy">매수</TabsTrigger>
                <TabsTrigger value="sell">매도</TabsTrigger>
                <TabsTrigger value="wait">대기</TabsTrigger>
              </TabsList>
              <TabsContent value="buy" className="mt-4 space-y-4">
                <div className="p-2 bg-green-50 text-green-800 rounded-lg text-xs">
                  클릭 한번으로 간편하게 주문해보세요
                </div>
                <OrderForm type="buy" />
              </TabsContent>
              <TabsContent value="sell" className="mt-4 space-y-4">
                <div className="p-2 bg-blue-50 text-blue-800 rounded-lg text-xs">
                  보유 주식을 매도할 수 있습니다
                </div>
                <OrderForm type="sell" />
              </TabsContent>
              <TabsContent value="wait" className="mt-4 space-y-4">
                <h3 className="font-semibold text-base">대기 중인 주문</h3>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PriceTabContent({ ticker }: { ticker: string }) {
  const [stock, setStock] = useState<Stock | null>(null);
  const realTimePrice = useStockWebSocket(ticker);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const data = await stockApi.getStock(ticker);
        setStock(data);
      } catch (error) {
        console.error("Failed to fetch stock:", error);
      }
    };

    fetchStock();
  }, [ticker]);

  if (!stock) return <div>Loading...</div>;

  return (
    <Card>
      <CardContent className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>체결가</TableHead>
              <TableHead>체결량(주)</TableHead>
              <TableHead>등락률</TableHead>
              <TableHead>거래량(주)</TableHead>
              <TableHead>시간</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {priceHistory.map((item, i) => (
              <TableRow key={i}>
                <TableCell
                  className={`font-semibold ${
                    item.isUp ? "text-red-500" : "text-blue-500"
                  }`}
                >
                  {item.price}
                </TableCell>
                <TableCell
                  className={`${item.isUp ? "text-red-500" : "text-blue-500"}`}
                >
                  {i === 1 ? 30 : i === 2 ? 1 : 700}
                </TableCell>
                <TableCell
                  className={`${item.isUp ? "text-red-500" : "text-blue-500"}`}
                >
                  {item.change}
                </TableCell>
                <TableCell>{item.volume}</TableCell>
                <TableCell>{item.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

const salesData = [
  {
    name: "TV, 모니터, 냉장고, 세탁기, 에어컨, 스마트폰, 네트워크시스템, PC 등",
    value: 58.1,
  },
  { name: "DRAM, NAND Flash, 모바일AP 등", value: 36.9 },
  { name: "스마트폰용 OLED패널 등", value: 9.7 },
  { name: "디지털 콕핏, 카오디오, 포터블 스피커 등", value: 4.7 },
  { name: "부문간 내부거래 제거 등", value: -9.5 },
];
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

function InfoTabContent() {
  return (
    <Card>
      <CardContent className="p-6 space-y-8">
        <div>
          <h3 className="text-lg font-semibold">매출·산업 구성</h3>
          <p className="text-sm text-gray-500">
            24년 12월 기준 (출처: FnGuide 및 기업 IR자료)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 items-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={salesData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                >
                  {salesData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <ul className="space-y-2 text-sm">
              {salesData.map((entry, index) => (
                <li key={entry.name} className="flex items-start">
                  <span
                    className="w-3 h-3 rounded-full mr-2 mt-1 flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></span>
                  <span>
                    {entry.name}{" "}
                    <span className="ml-auto font-semibold">
                      {entry.value}%
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold">투자 지표</h3>
          <p className="text-sm text-gray-500">18-10 기준</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[
              { label: "PER", value: "11.8배" },
              { label: "PSR", value: "1.3배" },
              { label: "PBR", value: "1.0배" },
              { label: "EPS", value: "5,161원" },
              { label: "BPS", value: "59,058원" },
              { label: "ROE", value: "9.2%" },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500 flex items-center justify-start gap-1">
                  {item.label} <Info size={12} />
                </p>
                <p className="font-bold text-base">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const recommendedStocks = [
  {
    id: 1,
    name: "JTC",
    price: "6,480원",
    change: "+3.8%",
    changeValue: "+240원",
    isUp: true,
    category: "면세점",
    marketCap: "3,353.2억원",
    volume: "1,050,316주",
  },
  {
    id: 2,
    name: "하나투어",
    price: "54,300원",
    change: "-1.0%",
    changeValue: "-600원",
    isUp: false,
    category: "여행용품",
    marketCap: "8,426.5억원",
    volume: "63,506주",
  },
  {
    id: 3,
    name: "서원",
    price: "1,304원",
    change: "+0.7%",
    changeValue: "+10원",
    isUp: true,
    category: "구리",
    marketCap: "619.1억원",
    volume: "353,222주",
  },
];

function RecommendTabContent() {
  return (
    <Card>
      <CardContent className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>종목명</TableHead>
              <TableHead>현재가</TableHead>
              <TableHead>등락률</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>시가총액</TableHead>
              <TableHead>거래량</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recommendedStocks.map((stock, index) => (
              <TableRow key={stock.id}>
                <TableCell className="font-semibold flex items-center gap-2">
                  <span className="font-bold text-primary">{index + 1}</span>{" "}
                  {stock.name}
                </TableCell>
                <TableCell>{stock.price}</TableCell>
                <TableCell
                  className={stock.isUp ? "text-red-500" : "text-blue-500"}
                >
                  <div>{stock.change}</div>
                  <div className="text-xs">{stock.changeValue}</div>
                </TableCell>
                <TableCell>{stock.category}</TableCell>
                <TableCell>{stock.marketCap}</TableCell>
                <TableCell>{stock.volume}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function OrderForm({ type }: { type: "buy" | "sell" }) {
  const [price, setPrice] = useState(81200);
  return (
    <div className="space-y-4">
      <div>
        <label className="font-semibold text-xs">
          {type === "buy" ? "구매" : "매도"} 가격
        </label>
        <Tabs defaultValue="fixed" className="w-full mt-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fixed">지정가</TabsTrigger>
            <TabsTrigger value="market">시장가</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-transparent"
            onClick={() => setPrice((p) => p - 100)}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Input
            value={`${price.toLocaleString()} 원`}
            className="text-center font-bold text-base h-9"
            readOnly
          />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-transparent"
            onClick={() => setPrice((p) => p + 100)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div>
        <label className="font-semibold text-xs">
          수량 {type === "sell" && "(보유: 0주)"}
        </label>
        <div className="flex items-center gap-2 mt-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-transparent"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Input placeholder="수량 입력" className="text-center h-9" />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-transparent"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {type === "buy" && (
          <div className="grid grid-cols-4 gap-2 mt-2">
            {["10%", "25%", "50%", "최대"].map((p) => (
              <Button
                key={p}
                variant="outline"
                size="sm"
                className="text-xs h-7 bg-transparent"
              >
                {p}
              </Button>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-1 text-xs border-t pt-3 mt-3">
        <div className="flex justify-between">
          <span>{type === "buy" ? "구매가능 금액" : "예상 매도 금액"}</span>{" "}
          <span>0원</span>
        </div>
        <div className="flex justify-between">
          <span>총 주문 금액</span> <span>0원</span>
        </div>
      </div>
      <Button
        className={`w-full h-10 text-base ${
          type === "buy"
            ? "bg-primary hover:bg-primary/90"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {type === "buy" ? "매수 주문하기" : "매도 주문하기"}
      </Button>
    </div>
  );
}
