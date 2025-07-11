"use client";

import { useState, useRef, useEffect, useCallback, useMemo, use } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { useStock } from "@/contexts/StockContext";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import {
  Stock,
  stockApi,
  checkFavorite,
  addFavorite,
  removeFavorite,
  getSimilarStocks,
  SimilarStock,
  subscribeToRealtimeStock,
  unsubscribeFromRealtimeStock,
  getPredictionResults,
} from "@/api/stock";
import { getAccount, createOrder, getHoldings, type TradeRequest } from "@/api/account";
import { useToast } from "@/components/ui/use-toast";
import { FavoriteConfirmDialog } from "@/components/favorite-confirm-dialog";
import { useRouter } from "next/navigation";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";
import type { OrderBook, OrderBookItem } from "@/hooks/useStockWebSocket";
import { PendingOrdersTab } from "@/components/pending-orders-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface UnderlineStyle {
  left?: number;
  width?: number;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface StockPrice {
  ticker: string;
  stockCode: string;
  price: number;
  volume: number;
  timestamp: number;
}

// prediction_results.json 파일의 결과를 가져오는 함수 수정
const getPredictionResult = async (ticker: string) => {
  try {
    const data = await getPredictionResults();
    const predictions = JSON.parse(data);
    const stockPrediction = predictions.find((item: any) => item.stock_code === ticker);
    return stockPrediction?.prediction === 1 ? "상승" : "하락";
  } catch (error) {
    console.error('Failed to fetch prediction result:', error);
    return "예측 불가";
  }
};

export default function StockDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const ticker = id;
  const [stock, setStock] = useState<Stock | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [prediction, setPrediction] = useState<string>("예측 중");  // 예측 결과 상태 추가
  const { toast } = useToast();
  const router = useRouter();
  const { setStock: setContextStock } = useStock();

  // 웹소켓 연결
  const {
    stockData,
    orderBookData,
    isConnected,
    error,
    subscribeToStock,
    unsubscribeFromStock,
  } = useStockWebSocket();

  // 초기 데이터 로드 및 웹소켓 구독
  useEffect(() => {
    const fetchStockAndInitialize = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching stock data for ticker:", ticker);
        const data = await stockApi.getStock(ticker);
        console.log("Received stock data:", data);
        setStock(data);
        setContextStock(data); // StockContext 업데이트

        if (isConnected) {
          subscribeToStock(ticker);
          subscribeToRealtimeStock(ticker);
        }
      } catch (error) {
        console.error("Failed to fetch stock:", error);
        toast({
          title: "데이터 로드 실패",
          description: "종목 정보를 불러오는데 실패했습니다.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockAndInitialize();

    return () => {
      unsubscribeFromStock(ticker);
      unsubscribeFromRealtimeStock(ticker);
      setContextStock(null); // 컴포넌트 언마운트 시 StockContext 초기화
    };
  }, [ticker, isConnected, setContextStock, toast]);

  // 실시간 데이터 업데이트
  useEffect(() => {
    if (!stockData || !stock) return;

    if (stockData.ticker === ticker && stockData.price !== stock.currentPrice) {
      const priceDiff = stockData.price - stock.closePrice;
      const fluctuationRate = (priceDiff / stock.closePrice) * 100;

      const updatedStock = {
        ...stock,
        currentPrice: stockData.price,
        priceDiff: priceDiff,
        fluctuationRate: fluctuationRate,
        volume: stockData.volume,
      };

      setStock(updatedStock);
      setContextStock(updatedStock);
    }
  }, [stockData, ticker, stock, setContextStock]);

  // 예측 결과 가져오기
  useEffect(() => {
    const fetchPrediction = async () => {
      const result = await getPredictionResult(ticker);
      setPrediction(result);
    };
    fetchPrediction();
  }, [ticker]);

  const [activeTab, setActiveTab] = useState("price");
  const [underlineStyle, setUnderlineStyle] = useState({
    width: 0,
    transform: "translateX(0)",
  });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs = useMemo(
    () =>
      [
        { id: "price", label: "호가" },
        { id: "info", label: "종목 상세" },
        { id: "recommend", label: "추천 종목" },
      ] as const,
    []
  );

  // 탭 변경 핸들러
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  // 언더라인 스타일 업데이트
  useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
    const activeElement = tabRefs.current[activeIndex];

    if (activeElement) {
      setUnderlineStyle({
        width: activeElement.offsetWidth,
        transform: `translateX(${activeElement.offsetLeft}px)`,
      });
    }
  }, [activeTab, tabs]);

  useEffect(() => {
    const checkIsFavorite = async () => {
      try {
        const response = await checkFavorite(ticker);
        if (response.success) {
          setIsFavorite(response.data);
        }
      } catch (error) {
        console.error("Failed to check favorite status:", error);
        setIsFavorite(false);
      }
    };

    const token = localStorage.getItem("token");
    if (token) {
      checkIsFavorite();
    }
  }, [ticker]);

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        setIsDialogOpen(true);
      } else {
        const response = await addFavorite(ticker);
        if (response.success) {
          setIsFavorite(true);
          toast({
            title: "즐겨찾기 추가",
            description: "관심 종목에 추가되었습니다.",
          });
        }
      }
    } catch (error: any) {
      // 401 Unauthorized 에러인 경우 로그인 페이지로 리다이렉트
      if (error.response?.status === 401) {
        toast({
          title: "로그인 필요",
          description: "즐겨찾기 기능은 로그인 후 이용 가능합니다.",
          variant: "destructive",
        });
        router.push("/login");
        return;
      }
      toast({
        title: "오류 발생",
        description: "즐겨찾기 추가에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmRemove = async () => {
    try {
      await removeFavorite(ticker);
      setIsFavorite(false);
      toast({
        title: "관심 종목이 삭제되었습니다.",
        description: `${stock?.name}이(가) 관심 종목에서 제거되었습니다.`,
      });
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      toast({
        title: "관심 종목 삭제 실패",
        description: "관심 종목 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gray-50/50 p-4 rounded-lg">
      <div className="lg:col-span-2 space-y-4">
        {/* Stock Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-white">
                <img
                  src={`/stock-images/${ticker}.png`}
                  alt={stock?.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder-logo.svg";
                  }}
                />
              </div>
              <h1 className="text-2xl font-bold">
                {stock?.name} ({ticker})
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold">
                  현재가: {stock?.currentPrice?.toLocaleString() || "-"}원
                  {stock?.currentPrice && stock?.prevPrice && (
                    <span
                      className={`ml-2 ${
                        stock.currentPrice > stock.prevPrice
                          ? "text-red-500"
                          : "text-blue-500"
                      }`}
                    >
                      {stock.currentPrice > stock.prevPrice ? "+" : "-"}
                      {Math.abs(
                        stock.currentPrice - stock.prevPrice
                      ).toLocaleString()}
                      원 (
                      {Math.abs(
                        ((stock.currentPrice - stock.prevPrice) /
                          stock.prevPrice) *
                          100
                      ).toFixed(2)}
                      %)
                    </span>
                  )}
                </p>
              </div>
              <span className={`text-sm px-2 py-1 ${prediction === "상승" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"} rounded-full font-medium whitespace-nowrap`}>
                {prediction} 예측
              </span>
            </div>
          </div>
          <Heart
            className={`w-6 h-6 cursor-pointer ${
              isFavorite ? "text-red-500 fill-current" : "text-gray-300"
            }`}
            onClick={handleToggleFavorite}
          />
        </div>

        {/* Chart */}
        <Card>
          <CardContent className="p-2">
            <CandlestickChart ticker={ticker} realtimeData={stockData} />
          </CardContent>
        </Card>

        {/* Info Tabs */}
        <div className="relative border-b-2 border-gray-200">
          <div className="flex space-x-8">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                ref={(el: HTMLButtonElement | null): void => {
                  tabRefs.current[index] = el;
                }}
                onClick={() => handleTabChange(tab.id)}
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
          <div className={activeTab === "price" ? "block" : "hidden"}>
            <PriceTabContent
              ticker={ticker}
              stockData={stockData}
              orderBookData={orderBookData}
            />
          </div>
          <div className={activeTab === "info" ? "block" : "hidden"}>
            <InfoTabContent />
          </div>
          <div className={activeTab === "recommend" ? "block" : "hidden"}>
            {stock?.name && <RecommendTabContent stockName={stock.name} />}
          </div>
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
                <OrderForm type="buy" stockData={stockData} />
              </TabsContent>
              <TabsContent value="sell" className="mt-4 space-y-4">
                <div className="p-2 bg-blue-50 text-blue-800 rounded-lg text-xs">
                  보유 주식을 매도할 수 있습니다
                </div>
                <OrderForm type="sell" stockData={stockData} />
              </TabsContent>
              <TabsContent value="wait" className="mt-4 space-y-4">
                <div className="p-2 bg-gray-50 text-gray-800 rounded-lg text-xs">
                  대기 중인 주문 목록입니다
                </div>
                <PendingOrdersTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <FavoriteConfirmDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleConfirmRemove}
        stockName={stock?.name || ""}
        action="remove"
      />
    </div>
  );
}

function PriceTabContent({
  ticker,
  stockData,
  orderBookData,
}: {
  ticker: string;
  stockData: any;
  orderBookData: any;
}) {
  const [priceHistory, setPriceHistory] = useState<StockPrice[]>([]);
  const [currentOrderBook, setCurrentOrderBook] = useState<OrderBook | null>(
    null
  );

  // 체결 내역 업데이트
  useEffect(() => {
    if (stockData && stockData.ticker === ticker) {
      setPriceHistory((prev) => {
        const newHistory = [stockData, ...prev];
        return newHistory.slice(0, 10); // 최근 10개만 유지
      });
    }
  }, [stockData, ticker]);

  // 호가 데이터 업데이트
  useEffect(() => {
    if (orderBookData && orderBookData.askPrices && orderBookData.bidPrices) {
      setCurrentOrderBook(orderBookData);
    }
  }, [orderBookData]);

  if (!currentOrderBook) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 flex justify-center items-center h-40">
            <div>호가 정보를 불러오는 중입니다...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 등락률 계산 함수
  const calculateDiff = (price: number, basePrice: number) => {
    if (!basePrice) return "0.00%";
    const diff = ((price - basePrice) / basePrice) * 100;
    return `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}%`;
  };

  // 현재가 기준으로 등락률 계산
  const basePrice = stockData?.price || 0;

  return (
    <div className="space-y-4">
      {/* 호가창 */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-1">
            {/* 매도 호가 */}
            <div className="space-y-1">
              {currentOrderBook.askPrices.map(
                (item: OrderBookItem, index: number) => (
                  <div
                    key={`ask-${index}`}
                    className="grid grid-cols-12 text-xs items-center relative h-6"
                  >
                    {/* 배경 막대 - 중앙에서 왼쪽으로 */}
                    <div
                      className="absolute inset-y-0 left-[50%] bg-red-100"
                      style={{
                        width: `${
                          (item.volume / currentOrderBook.totalAskVolume) * 50
                        }%`,
                        transform: "translateX(-100%)",
                      }}
                    />
                    {/* 가격과 등락률 - 왼쪽에 배치 */}
                    <div className="col-span-4 text-right text-red-500 font-semibold relative z-10">
                      {item.price.toLocaleString()}
                    </div>
                    <div className="col-span-4 text-right text-red-500 relative z-10">
                      {calculateDiff(item.price, basePrice)}
                    </div>
                    <div className="col-span-4 text-right relative z-10">
                      {item.volume.toLocaleString()}
                    </div>
                  </div>
                )
              )}
            </div>

            {/* 매수 호가 */}
            <div className="space-y-1">
              {currentOrderBook.bidPrices.map(
                (item: OrderBookItem, index: number) => (
                  <div
                    key={`bid-${index}`}
                    className="grid grid-cols-12 text-xs items-center relative h-6"
                  >
                    {/* 배경 막대 - 중앙에서 오른쪽으로 */}
                    <div
                      className="absolute inset-y-0 left-[50%] bg-blue-100"
                      style={{
                        width: `${
                          (item.volume / currentOrderBook.totalBidVolume) * 50
                        }%`,
                      }}
                    />
                    {/* 가격과 등락률 - 오른쪽에 배치 */}
                    <div className="col-span-4 text-right text-blue-500 font-semibold relative z-10">
                      {item.price.toLocaleString()}
                    </div>
                    <div className="col-span-4 text-right text-blue-500 relative z-10">
                      {calculateDiff(item.price, basePrice)}
                    </div>
                    <div className="col-span-4 text-right relative z-10">
                      {item.volume.toLocaleString()}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* 매도/매수 잔량 합계 */}
          <div className="grid grid-cols-2 gap-1 mt-4 text-xs border-t pt-2">
            <div className="text-right">
              <span className="text-gray-500">매도잔량 </span>
              <span className="font-semibold">
                {currentOrderBook.totalAskVolume.toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="text-gray-500">매수잔량 </span>
              <span className="font-semibold">
                {currentOrderBook.totalBidVolume.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 체결 내역 테이블 */}
      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>체결가</TableHead>
                <TableHead>체결량(주)</TableHead>
                <TableHead>시간</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceHistory.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-semibold">
                    {item.price.toLocaleString()}원
                  </TableCell>
                  <TableCell>{item.volume.toLocaleString()}</TableCell>
                  <TableCell>
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoTabContent() {
  const { stock } = useStock();
  const [industryStocks, setIndustryStocks] = useState<Stock[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>("marketCap");

  useEffect(() => {
    const fetchIndustryStocks = async () => {
      if (!stock?.industryType) return;
      try {
        const response = await stockApi.getStocksByIndustry(stock.industryType);
        console.log("Industry Stocks:", response);
        setIndustryStocks(response);
      } catch (error) {
        console.error("Failed to fetch industry stocks:", error);
      }
    };

    fetchIndustryStocks();
  }, [stock?.industryType]);

  const metrics = [
    {
      id: "marketCap",
      label: "시가총액",
      description:
        "발행주식 수와 주가를 곱한 기업의 시장 가치입니다. 기업의 전체 규모를 나타내는 중요한 지표입니다.",
      format: (value: number | undefined) =>
        value ? formatMarketCap(value) : "-",
    },
    {
      id: "per",
      label: "PER",
      description:
        "주가를 주당순이익(EPS)으로 나눈 값입니다. 수익 대비 주가의 수준을 나타내며, 일반적으로 낮을수록 저평가되었다고 볼 수 있습니다. 단, 업종별로 적정 PER 수준이 다를 수 있습니다.",
      format: (value: number | undefined) =>
        value ? `${value.toFixed(2)}배` : "-",
    },
    {
      id: "forwardPer",
      label: "선행 PER",
      description:
        "주가를 예상 주당순이익으로 나눈 값입니다. 미래 수익 대비 현재 주가의 수준을 나타내며, 기업의 성장성을 반영한 투자 지표입니다.",
      format: (value: number | undefined) =>
        value ? `${value.toFixed(2)}배` : "-",
    },
    {
      id: "pbr",
      label: "PBR",
      description:
        "주가를 주당순자산(BPS)으로 나눈 값입니다. 자산 가치 대비 주가의 수준을 나타내며, 일반적으로 1배 미만이면 청산가치보다 저평가되었다고 볼 수 있습니다.",
      format: (value: number | undefined) =>
        value ? `${value.toFixed(2)}배` : "-",
    },
    {
      id: "eps",
      label: "EPS",
      description:
        "당기순이익을 발행주식 수로 나눈 값입니다. 주당 수익을 나타내며, 기업의 수익성을 판단하는 핵심 지표입니다. EPS가 높을수록 기업의 수익성이 좋다고 볼 수 있습니다.",
      format: (value: number | undefined) =>
        value ? `${value.toLocaleString()}원` : "-",
    },
    {
      id: "forwardEps",
      label: "선행 EPS",
      description:
        "예상 당기순이익을 발행주식 수로 나눈 값입니다. 향후 1년간의 예상 주당순이익을 의미하며, 기업의 미래 수익성을 전망하는데 도움이 됩니다.",
      format: (value: number | undefined) =>
        value ? `${value.toLocaleString()}원` : "-",
    },
  ];

  return (
    <Card>
      <CardContent className="p-6 space-y-8">
        <div>
          <h3 className="text-lg font-semibold">투자 지표</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {metrics.map((metric) => (
              <div key={metric.id} className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">{metric.label}</div>
                <p className="font-bold text-base">
                  {metric.format(
                    stock?.[metric.id as keyof Stock] as number | undefined
                  )}
                </p>
              </div>
            ))}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">시장구분</div>
              <p className="font-bold text-base">{stock?.marketType || "-"}</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold">업종 별 지표 비교</h3>
            <span className="text-sm text-primary font-semibold">
              {stock?.industryType}
            </span>
          </div>

          <div className="space-y-4">
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white"
            >
              {metrics.map((metric) => (
                <option key={metric.id} value={metric.id}>
                  {metric.label}
                </option>
              ))}
            </select>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={industryStocks}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const metric = metrics.find(
                          (m) => m.id === selectedMetric
                        );
                        const value = payload[0].value;
                        return (
                          <div className="bg-white p-2 border rounded shadow">
                            <p className="text-sm">{payload[0].payload.name}</p>
                            <p className="text-sm font-semibold">
                              {metric ? metric.format(value as number) : value}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey={selectedMetric} fill="#8884d8">
                    {industryStocks.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.ticker === stock?.ticker ? "#ff7300" : "#8884d8"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendTabContent({ stockName }: { stockName: string }) {
  const [similarStocks, setSimilarStocks] = useState<SimilarStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSimilarStocks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        if (!stockName) {
          throw new Error("종목명이 없습니다.");
        }
        const data = await getSimilarStocks(stockName);
        setSimilarStocks(data);
      } catch (error) {
        console.error("Error fetching similar stocks:", error);
        setError("유사 종목을 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimilarStocks();
  }, [stockName]);

  const handleRowClick = (ticker: string) => {
    router.push(`/stocks/${ticker}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 flex justify-center items-center h-40">
          <div>로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 flex justify-center items-center h-40 text-red-500">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>순위</TableHead>
              <TableHead>종목명</TableHead>
              <TableHead>업종</TableHead>
              <TableHead>유사도</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {similarStocks.map((stock, index) => (
              <TableRow
                key={index}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleRowClick(stock.ticker)}
              >
                <TableCell>
                  <span className="font-bold text-primary">{index + 1}</span>
                </TableCell>
                <TableCell className="font-semibold">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                      <img
                        src={`/stock-images/${stock.ticker}.png`}
                        alt={stock.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder-logo.svg";
                        }}
                      />
                    </div>
                    {stock.name}
                  </div>
                </TableCell>
                <TableCell>{stock.industry}</TableCell>
                <TableCell>{(stock.similarity * 100).toFixed(2)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

interface OrderFormProps {
  type: "buy" | "sell";
  stockData: StockPrice | null;
}

function OrderForm({ type, stockData }: OrderFormProps) {
  const [orderType, setOrderType] = useState<"fixed" | "market">("fixed");
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [account, setAccount] = useState<any>(null);
  const [holdings, setHoldings] = useState<any[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  // 계좌 정보 조회
  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const data = await getAccount();
        setAccount(data);
      } catch (error) {
        console.error("계좌 조회 실패:", error);
        setAccount(null);
      }
    };
    fetchAccount();
  }, []);

  // 보유 주식 정보 조회
  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        if (account) {  // 계좌가 있을 때만 보유 주식 조회
          const data = await getHoldings();
          setHoldings(data);
        }
      } catch (error) {
        console.error("보유 주식 조회 실패:", error);
      }
    };
    fetchHoldings();
  }, [account]);  // account가 변경될 때마다 실행

  // 현재 종목의 보유 수량 계산
  const currentHolding = holdings.find(
    (h) => h.stockCode === stockData?.ticker
  );
  const holdingQuantity = currentHolding?.quantity || 0;

  // 실시간 가격 반영
  useEffect(() => {
    if (stockData?.price) {
      if (orderType === "market" || price === 0) {
        setPrice(stockData.price);
      }
    }
  }, [stockData?.price, orderType, price]);

  // 가격 조정 함수
  const adjustPrice = (amount: number) => {
    if (orderType === "fixed") {
      setPrice((prev) => Math.max(0, prev + amount));
    }
  };

  // 수량 조정 함수
  const adjustQuantity = (amount: number) => {
    setQuantity((prev) => {
      const newQuantity = Math.max(0, prev + amount);
      if (type === "sell") {
        return Math.min(newQuantity, holdingQuantity);
      }
      return newQuantity;
    });
  };

  // 계좌가 없는 경우 안내 메시지와 계좌 생성 버튼을 보여줌
  if (account === null) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-6">
        <img 
          src="/noAccount-image.png" 
          alt="계좌 없음" 
          className="w-32 h-32 object-contain"
        />
        <p className="text-center text-gray-600 font-medium">
          계좌를 먼저 생성해주세요.
        </p>
        <Button 
          onClick={() => router.push('/my-page')}
          className="w-full max-w-xs"
        >
          계좌 생성하러 가기
        </Button>
      </div>
    );
  }

  // 총 주문 금액 계산
  const totalOrderAmount = price * quantity;

  // 주문 가능 여부 확인
  const canOrder =
    type === "buy"
      ? account?.balance >= totalOrderAmount && totalOrderAmount > 0
      : quantity > 0 && quantity <= holdingQuantity;

  const handleOrder = async () => {
    try {
      console.log("[Order] 주문 시작:", {
        계좌정보: account,
        주식정보: stockData,
        수량: quantity,
        가격: price,
        주문타입: type,
        시간: new Date().toISOString()
      });

      // 기본 유효성 검사
      if (!stockData || !account || quantity <= 0) {
        console.warn("[Order] 주문 유효성 검사 실패:", {
          stockData: !!stockData,
          account: !!account,
          quantity: quantity
        });
        toast({
          title: "주문 실패",
          description: "주문 정보가 올바르지 않습니다. 수량과 가격을 확인해주세요.",
          variant: "destructive",
        });
        return;
      }

      // 매도 시 보유 수량 체크
      if (type === "sell" && quantity > holdingQuantity) {
        console.warn("[Order] 매도 수량 초과:", {
          요청수량: quantity,
          보유수량: holdingQuantity
        });
        toast({
          title: "주문 실패",
          description: `보유 수량(${holdingQuantity}주)을 초과하여 매도할 수 없습니다.`,
          variant: "destructive",
        });
        return;
      }

      // 매수 시 잔액 체크
      if (type === "buy") {
        const totalAmount = price * quantity;
        if (totalAmount > account.balance) {
          console.warn("[Order] 잔액 부족:", {
            주문금액: totalAmount,
            계좌잔액: account.balance
          });
          toast({
            title: "주문 실패",
            description: `주문 금액(${totalAmount.toLocaleString()}원)이 계좌 잔액(${account.balance.toLocaleString()}원)을 초과합니다.`,
            variant: "destructive",
          });
          return;
        }
      }

      const currentPrice = stockData.price;
      const orderPrice = orderType === "market" ? currentPrice : price;
      let willExecuteImmediately = false;

      if (type === "buy") {
        // 매수: 지정가가 현재가보다 크거나 같으면 즉시 체결
        willExecuteImmediately = orderPrice >= currentPrice;
      } else {
        // 매도: 지정가가 현재가보다 작거나 같으면 즉시 체결
        willExecuteImmediately = orderPrice <= currentPrice;
      }

      console.log("[Order] 주문 실행 조건:", {
        현재가: currentPrice,
        주문가격: orderPrice,
        즉시체결여부: willExecuteImmediately,
        주문유형: type
      });

      // 숫자 형식을 정확하게 처리
      const orderData: TradeRequest = {
        stockId: stockData.ticker,
        orderType: type === "buy" ? "BUY" : "SELL",
        quantity: Math.floor(Number(quantity)),
        price: Number(orderPrice),
      };

      console.log("[Order] API 요청 데이터:", orderData);
      
      const response = await createOrder(orderData);
      console.log("[Order] API 응답 데이터:", response);

      // 주문 성공 처리
      toast({
        title: `${type === "buy" ? "매수" : "매도"} 주문 ${willExecuteImmediately ? "완료" : "접수"}`,
        description: willExecuteImmediately 
          ? `${stockData.ticker} ${quantity}주가 ${orderPrice.toLocaleString()}원에 체결되었습니다.`
          : `${stockData.ticker} ${quantity}주 ${orderPrice.toLocaleString()}원 주문이 접수되었습니다.`,
      });

      // 입력값 초기화
      setQuantity(0);
      setPrice(0);

      // 계좌 정보 갱신
      await Promise.all([
        getAccount().then(setAccount),
        getHoldings().then(setHoldings)
      ]);
    } catch (error: any) {
      console.error("[Order] 주문 처리 실패");
      
      let title = "주문 실패";
      let description = "주문 처리 중 오류가 발생했습니다.";

      if (error.message) {
        description = error.message;
      }

      // 특정 에러 상황에 대한 사용자 친화적인 메시지
      if (description.includes("실시간 주가 정보")) {
        title = "시세 조회 실패";
        description = "현재 시세 정보를 조회할 수 없습니다. 잠시 후 다시 시도해주세요.";
      } else if (description.includes("잔액")) {
        title = "잔액 부족";
      } else if (description.includes("보유")) {
        title = "보유 수량 부족";
      }

      toast({
        title: title,
        description: description,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="font-semibold text-xs">
          {type === "buy" ? "구매" : "매도"} 가격
        </label>
        <Tabs
          value={orderType}
          onValueChange={(value) => setOrderType(value as "fixed" | "market")}
          className="w-full mt-1"
        >
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
            onClick={() => adjustPrice(-100)}
            disabled={orderType === "market"}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Input
            value={`${price.toLocaleString()} 원`}
            className="text-center font-bold text-base h-9"
            readOnly={orderType === "market"}
            onChange={(e) => {
              if (orderType === "fixed") {
                const value = parseInt(e.target.value.replace(/[^0-9]/g, ""));
                if (!isNaN(value)) {
                  setPrice(value);
                }
              }
            }}
          />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-transparent"
            onClick={() => adjustPrice(100)}
            disabled={orderType === "market"}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div>
        <label className="font-semibold text-xs">
          수량{" "}
          {type === "sell" && `(보유: ${holdingQuantity.toLocaleString()}주)`}
        </label>
        <div className="flex items-center gap-2 mt-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-transparent"
            onClick={() => adjustQuantity(-1)}
            disabled={quantity === 0}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Input
            value={quantity}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value >= 0) {
                if (type === "sell") {
                  setQuantity(Math.min(value, holdingQuantity));
                } else {
                  setQuantity(value);
                }
              }
            }}
            className="text-center h-9"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-transparent"
            onClick={() => adjustQuantity(1)}
            disabled={type === "sell" && quantity >= holdingQuantity}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-1 text-xs border-t pt-3 mt-3">
        <div className="flex justify-between">
          <span>{type === "buy" ? "구매가능 금액" : "예상 매도 금액"}</span>
          <span>{account?.balance?.toLocaleString()}원</span>
        </div>
        <div className="flex justify-between">
          <span>총 주문 금액</span>
          <span
            className={
              totalOrderAmount > (account?.balance || 0)
                ? "text-red-500"
                : "text-blue-600"
            }
          >
            {totalOrderAmount.toLocaleString()}원
          </span>
        </div>
      </div>
      <Button
        className={`w-full h-10 text-base ${
          type === "buy"
            ? "bg-primary hover:bg-primary/90"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
        disabled={!canOrder}
        onClick={handleOrder}
      >
        {type === "buy" ? "매수 주문하기" : "매도 주문하기"}
      </Button>
    </div>
  );
}

// 시가총액을 조 단위로 변환하는 함수
const formatMarketCap = (value?: number) => {
  if (!value) return "-";

  const trillion = 1000000000000; // 1조
  const billion = 100000000; // 1억

  if (value >= trillion) {
    const trillionPart = Math.floor(value / trillion);
    const billionPart = Math.floor((value % trillion) / billion);

    if (billionPart > 0) {
      return `${trillionPart}조 ${billionPart}억`;
    }
    return `${trillionPart}조`;
  } else {
    const billionPart = Math.floor(value / billion);
    return `${billionPart}억`;
  }
};
