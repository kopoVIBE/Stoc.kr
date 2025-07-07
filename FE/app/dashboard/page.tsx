"use client";

import {
  Heart,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  getFavorites,
  removeFavorite,
  addFavorite,
  subscribeToRealtimeStock,
  unsubscribeFromRealtimeStock,
} from "@/api/stock";
import { getHoldings, type StockHolding } from "@/api/account";
import { FavoriteConfirmDialog } from "@/components/favorite-confirm-dialog";
import { FavoriteAddDialog } from "@/components/favorite-add-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { getMyInfo } from "@/api/user";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";

const initialRecommendedStocks: Stock[] = [
  {
    ticker: "039130",
    name: "하나투어",
    closePrice: 54300,
    fluctuationRate: -1.0,
    category: "여행용품",
    marketCap: "8,426.5억원",
    volume: "63,506주",
    logo: "/placeholder.svg?height=32&width=32",
  },
  {
    ticker: "402340",
    name: "SK스퀘어",
    closePrice: 176400,
    fluctuationRate: -5.8,
    category: "지주사",
    marketCap: "23.4조원",
    volume: "1,043,174주",
    logo: "/placeholder.svg?height=32&width=32",
  },
];

const communityPosts = [
  {
    id: 1,
    title: "삼성전자 실적 분석 및 전망",
    author: "주식왕",
    time: "10분 전",
  },
  {
    id: 2,
    title: "2024년 반도체 산업 전망",
    author: "반도체전문가",
    time: "15분 전",
  },
  {
    id: 3,
    title: "신규 상장 기업 분석",
    author: "IPO연구소",
    time: "30분 전",
  },
  {
    id: 4,
    title: "코스피 3000 돌파 전망",
    author: "시장분석가",
    time: "1시간 전",
  },
];

interface Stock {
  ticker: string;
  name: string;
  closePrice: number;
  currentPrice?: number;
  fluctuationRate: number;
  logo?: string;
  category?: string;
  marketCap?: string;
  volume?: string;
}

interface StockTableProps {
  stocks: Stock[];
  isRecommended: boolean;
  onToggleFavorite?: (stock: Stock) => void;
  isFavorite?: (stock: Stock) => boolean;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  isConnected: boolean;
}

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [favoriteStocks, setFavoriteStocks] = useState<Stock[]>([]);
  const [recommendedStocks, setRecommendedStocks] = useState<Stock[]>(
    initialRecommendedStocks
  );
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [favoritePage, setFavoritePage] = useState(1);
  const [recommendedPage, setRecommendedPage] = useState(1);
  const subscribedTickersRef = useRef<string[]>([]);
  const previousTickersRef = useRef<string[]>([]);
  const itemsPerPage = 4; // 한 페이지당 표시할 종목 수
  const { toast } = useToast();
  const router = useRouter();
  const [holdings, setHoldings] = useState<StockHolding[]>([]);

  // 웹소켓 연결
  const {
    stockData,
    isConnected,
    error,
    subscribeToStock,
    unsubscribeFromStock,
  } = useStockWebSocket();

  // 현재 페이지의 종목들 계산
  const getFavoritePageStocks = () => {
    const startIndex = (favoritePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return favoriteStocks.slice(startIndex, endIndex);
  };

  const getRecommendedPageStocks = () => {
    const startIndex = (recommendedPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return recommendedStocks.slice(startIndex, endIndex);
  };

  // 웹소켓 구독 관리
  useEffect(() => {
    if (!isConnected) {
      console.log("🔌 웹소켓 연결 안됨 - 구독 스킵");
      return;
    }

    // 현재 페이지의 종목들만 구독
    const currentFavorites = getFavoritePageStocks();
    const currentRecommended = getRecommendedPageStocks();
    const allCurrentTickers = [...currentFavorites, ...currentRecommended].map(
      (stock) => stock.ticker
    );
    const uniqueTickers = Array.from(new Set(allCurrentTickers));

    // 이전 구독 목록과 현재 구독할 목록이 동일한지 확인
    const currentTickersStr = uniqueTickers.sort().join(",");
    const previousTickersStr = previousTickersRef.current.sort().join(",");

    if (currentTickersStr === previousTickersStr) {
      console.log("🔄 구독 목록 동일 - 갱신 스킵");
      return;
    }

    console.log("📊 구독 상태 변경 감지");
    console.log("이전 구독:", previousTickersRef.current);
    console.log("현재 구독 예정:", uniqueTickers);

    // 이전 구독과 비교하여 변경된 것만 처리
    const tickersToUnsubscribe = previousTickersRef.current.filter(
      (ticker) => !uniqueTickers.includes(ticker)
    );
    const tickersToSubscribe = uniqueTickers.filter(
      (ticker) => !previousTickersRef.current.includes(ticker)
    );

    // 필요한 구독 해제만 수행
    if (tickersToUnsubscribe.length > 0) {
      console.log("❌ 구독 해제:", tickersToUnsubscribe);
      tickersToUnsubscribe.forEach((ticker) => {
        unsubscribeFromStock(ticker);
        unsubscribeFromRealtimeStock(ticker);
      });
    }

    // 필요한 구독 추가만 수행
    if (tickersToSubscribe.length > 0) {
      console.log("✅ 새로운 구독:", tickersToSubscribe);
      tickersToSubscribe.forEach((ticker) => {
        subscribeToStock(ticker);
        subscribeToRealtimeStock(ticker);
      });
    }

    // 현재 구독 목록 저장
    previousTickersRef.current = uniqueTickers;
    subscribedTickersRef.current = uniqueTickers;

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      if (subscribedTickersRef.current.length > 0) {
        console.log("🔚 구독 정리:", subscribedTickersRef.current);
        subscribedTickersRef.current.forEach((ticker) => {
          unsubscribeFromStock(ticker);
          unsubscribeFromRealtimeStock(ticker);
        });
        subscribedTickersRef.current = [];
        previousTickersRef.current = [];
      }
    };
  }, [
    isConnected,
    favoritePage,
    recommendedPage,
    favoriteStocks.length,
    recommendedStocks.length,
  ]);

  // 실시간 데이터 처리
  useEffect(() => {
    if (!stockData) return;

    const updateStockData = (prevStocks: Stock[]) =>
      prevStocks.map((stock) => {
        if (stock.ticker === stockData.ticker) {
          const priceChange =
            ((stockData.price - stock.closePrice) / stock.closePrice) * 100;
          return {
            ...stock,
            currentPrice: stockData.price,
            fluctuationRate: priceChange,
          };
        }
        return stock;
      });

    setFavoriteStocks((prev) => updateStockData(prev));
    setRecommendedStocks((prev) => updateStockData(prev));
  }, [stockData]);

  useEffect(() => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    setCurrentTime(`${hours}:${minutes}`);

    const fetchInitialData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // 사용자 정보와 관심 종목을 병렬로 가져오기
        const [userResponse, favoritesResponse] = await Promise.all([
          getMyInfo(),
          getFavorites(),
        ]);

        setUser(userResponse);
        setFavoriteStocks(favoritesResponse.data);
      } catch (error) {
        toast({
          title: "오류",
          description: "데이터를 불러오는데 실패했습니다.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // 보유 종목 조회
  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const data = await getHoldings();
        console.log("보유 종목 데이터:", data);
        setHoldings(data);
      } catch (error) {
        console.error("보유 종목 조회 실패:", error);
        setHoldings([]);
        toast({
          title: "보유 종목 조회 실패",
          description: "보유 종목 정보를 불러오는데 실패했습니다.",
          variant: "destructive",
        });
      }
    };

    fetchHoldings();
  }, []);

  // 주문 이벤트 처리
  useEffect(() => {
    if (!stockData) return;

    // 보유 종목 중 해당 종목이 있는지 확인
    const holdingStock = holdings.find((h) => h.stockCode === stockData.ticker);
    if (!holdingStock) return;

    // 가격 변동이 1% 이상인 경우 알림
    const priceChange =
      ((stockData.price - holdingStock.currentPrice) /
        holdingStock.currentPrice) *
      100;
    if (Math.abs(priceChange) >= 1) {
      toast({
        title: `${holdingStock.stockName} 가격 변동 알림`,
        description: `현재가: ${stockData.price.toLocaleString()}원 (${
          priceChange >= 0 ? "+" : ""
        }${priceChange.toFixed(2)}%)`,
        variant: priceChange >= 0 ? "default" : "destructive",
      });
    }
  }, [stockData, holdings]);

  const handleToggleFavorite = async (stock: Stock) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "로그인 필요",
        description: "관심 종목 기능을 사용하려면 로그인이 필요합니다.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    try {
      if (favoriteStocks.some((s) => s.ticker === stock.ticker)) {
        await removeFavorite(stock.ticker);
        setFavoriteStocks((prev) =>
          prev.filter((s) => s.ticker !== stock.ticker)
        );
        toast({
          description: `${stock.name}이(가) 관심 종목에서 제거되었습니다.`,
        });
      } else {
        await addFavorite(stock.ticker);
        setFavoriteStocks((prev) => [...prev, stock]);
        toast({
          description: `${stock.name}이(가) 관심 종목에 추가되었습니다.`,
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "관심 종목 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 관심 종목 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>관심 종목</CardTitle>
              <FavoriteAddDialog />
            </CardHeader>
            <CardContent>
              <StockTable
                stocks={getFavoritePageStocks()}
                isRecommended={false}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={() => true}
                currentPage={favoritePage}
                setCurrentPage={setFavoritePage}
                isConnected={isConnected}
              />
            </CardContent>
          </Card>

          {/* 추천 종목 */}
          <Card>
            <CardHeader>
              <CardTitle>추천 종목</CardTitle>
            </CardHeader>
            <CardContent>
              <StockTable
                stocks={getRecommendedPageStocks()}
                isRecommended={true}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={(stock) =>
                  favoriteStocks.some((s) => s.ticker === stock.ticker)
                }
                currentPage={recommendedPage}
                setCurrentPage={setRecommendedPage}
                isConnected={isConnected}
              />
            </CardContent>
          </Card>
        </div>

        {/* 보유 종목 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle>보유 종목</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>종목명</TableHead>
                    <TableHead>보유수량</TableHead>
                    <TableHead>평균매수가</TableHead>
                    <TableHead>현재가</TableHead>
                    <TableHead>평가손익</TableHead>
                    <TableHead>수익률</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdings.map((holding) => (
                    <TableRow key={holding.stockCode}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                            <img
                              src={`/stock-images/${holding.stockCode}.png`}
                              alt={holding.stockName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder-logo.svg";
                              }}
                            />
                          </div>
                          <Link href={`/stocks/${holding.stockCode}`}>
                            <span className="font-medium hover:text-primary">
                              {holding.stockName}
                            </span>
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        {holding.quantity.toLocaleString()}주
                      </TableCell>
                      <TableCell>
                        {holding.averagePurchasePrice.toLocaleString()}원
                      </TableCell>
                      <TableCell>
                        {holding.currentPrice.toLocaleString()}원
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            holding.evaluationProfitLoss >= 0
                              ? "text-red-500"
                              : "text-blue-500"
                          }
                        >
                          {holding.evaluationProfitLoss.toLocaleString()}원
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {holding.profitLossRate >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-red-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-blue-500" />
                          )}
                          <span
                            className={
                              holding.profitLossRate >= 0
                                ? "text-red-500"
                                : "text-blue-500"
                            }
                          >
                            {holding.profitLossRate >= 0 ? "+" : ""}
                            {holding.profitLossRate.toFixed(2)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {holdings.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-gray-500"
                      >
                        보유 중인 종목이 없습니다
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 추가 정보 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 내 계좌 */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>내 계좌</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg text-primary-dark font-semibold">
                원하는 조건의 주식을 골라보세요
              </div>
              <div className="flex flex-wrap gap-2">
                {["시가총액", "거래량", "PER", "인기순위", "연관순위"].map(
                  (tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* 지금 뜨는 카테고리 & 커뮤니티 */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 지금 뜨는 카테고리 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-baseline gap-4">
                  <span>지금 뜨는 카테고리</span>
                  <span className="text-sm font-normal text-gray-500">
                    오늘 08:50 기준
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-around items-end">
                <div className="text-center">
                  <div className="text-lg font-bold">2위</div>
                  <img
                    src="/placeholder.svg?height=80&width=80"
                    alt="Mask"
                    className="w-20 h-20 mx-auto"
                  />
                  <div className="font-semibold">마스크</div>
                  <div className="text-sm text-red-500">-2.5%</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">1위</div>
                  <img
                    src="/placeholder.svg?height=100&width=100"
                    alt="Plant"
                    className="w-24 h-24 mx-auto"
                  />
                  <div className="font-semibold">캐릭터</div>
                  <div className="text-sm text-green-500">+3.7%</div>
                </div>
              </CardContent>
            </Card>

            {/* 인기 급상승 커뮤니티 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-baseline gap-4">
                  <span>인기 급상승 커뮤니티</span>
                  <span className="text-sm font-normal text-gray-500">
                    오늘 17:28 기준
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {communityPosts.map((post) => (
                  <div key={post.id}>
                    <p className="font-semibold truncate">{post.title}</p>
                    <p className="text-sm text-gray-500">
                      {post.author} · {post.time}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StockTable({
  stocks,
  isRecommended,
  onToggleFavorite,
  isFavorite,
  currentPage,
  setCurrentPage,
  isConnected,
}: StockTableProps) {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const router = useRouter();
  const itemsPerPage = 4;
  const totalPages = Math.ceil(stocks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStocks = stocks.slice(startIndex, endIndex);

  const handleHeartClick = (stock: Stock) => {
    setSelectedStock(stock);
    if (isFavorite?.(stock)) {
      setIsRemoveDialogOpen(true);
    } else {
      setIsAddDialogOpen(true);
    }
  };

  const handleConfirmRemove = () => {
    if (selectedStock && onToggleFavorite) {
      onToggleFavorite(selectedStock);
    }
    setIsRemoveDialogOpen(false);
    setSelectedStock(null);
  };

  const handleConfirmAdd = () => {
    if (selectedStock && onToggleFavorite) {
      onToggleFavorite(selectedStock);
    }
    setIsAddDialogOpen(false);
    setSelectedStock(null);
  };

  return (
    <div className="flex flex-col">
      <div className="h-[264px]">
        <Table>
          <TableHeader>
            <TableRow className="h-11">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>종목명</TableHead>
              <TableHead className="text-right">현재가</TableHead>
              <TableHead className="text-right">등락률</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentStocks.map((stock) => (
              <TableRow key={stock.ticker} className="h-[55px]">
                <TableCell className="p-0">
                  <Button
                    variant="ghost"
                    className="h-[55px] w-full"
                    onClick={() => onToggleFavorite && onToggleFavorite(stock)}
                  >
                    <Heart
                      className={cn(
                        "h-5 w-5",
                        isFavorite?.(stock) ? "fill-red-500 text-red-500" : ""
                      )}
                    />
                  </Button>
                </TableCell>
                <TableCell
                  className="h-[55px] cursor-pointer"
                  onClick={() => router.push(`/stocks/${stock.ticker}`)}
                >
                  <div className="flex items-center gap-2">
                    <Image
                      src={`/stock-images/${stock.ticker}.png`}
                      alt={stock.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    {stock.name}
                  </div>
                </TableCell>
                <TableCell
                  className="text-right h-[55px] cursor-pointer"
                  onClick={() => router.push(`/stocks/${stock.ticker}`)}
                >
                  {!isConnected || !stock.currentPrice
                    ? "-"
                    : stock.currentPrice.toLocaleString()}
                </TableCell>
                <TableCell
                  className="text-right h-[55px] cursor-pointer"
                  onClick={() => router.push(`/stocks/${stock.ticker}`)}
                >
                  {"-"}
                </TableCell>
              </TableRow>
            ))}
            {/* 빈 행 유지 */}
            {Array.from({ length: itemsPerPage - currentStocks.length }).map(
              (_, index) => (
                <TableRow key={`empty-${index}`} className="h-[55px]">
                  {Array.from({ length: 4 }).map((_, cellIndex) => (
                    <TableCell
                      key={`empty-cell-${cellIndex}`}
                      className="h-[55px]"
                    />
                  ))}
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </div>
      {/* 페이지네이션 */}
      <div className="flex justify-center items-center mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="mx-4">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
