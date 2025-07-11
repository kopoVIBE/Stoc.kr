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
  stockApi,
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
import { getRecentActivePosts } from "@/api/community";
import { getTopPerformers, type TopPerformer } from "@/api/account";

const initialRecommendedStocks: Stock[] = [
  {
    ticker: "039130",
    name: "하나투어",
    closePrice: 54300,
    priceDiff: -543,
    fluctuationRate: -1.0,
    marketCap: "8,426.5억원",
    volume: "63,506",
  },
  {
    ticker: "402340",
    name: "SK스퀘어",
    closePrice: 176400,
    priceDiff: -10231,
    fluctuationRate: -5.8,
    marketCap: "23.4조원",
    volume: "1,043,174",
  },
];

interface CommunityPost {
  id: number;
  title: string;
  author: string;
  lastCommentTime: string;
}

interface APIStock {
  ticker: string;
  name: string;
  closePrice: number;
  currentPrice?: number;
  priceDiff: number;
  fluctuationRate: number;
  marketCap: string;
  volume?: string;
  per?: number;
  pbr?: number;
  eps?: number;
  bps?: number;
  industryType?: string;
  marketType?: string;
  sharesOutstanding?: number;
  high52Week?: number;
  low52Week?: number;
  prevPrice?: number;
}

interface Stock {
  ticker: string;
  name: string;
  closePrice: number;
  currentPrice?: number;
  priceDiff: number;
  fluctuationRate: number;
  marketCap: string | number;
  volume?: string | number;
  per?: number;
  pbr?: number;
  eps?: number;
  bps?: number;
  industryType?: string;
  marketType?: string;
  sharesOutstanding?: number;
  high52Week?: number;
  low52Week?: number;
  prevPrice?: number;
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
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [industryStocks, setIndustryStocks] = useState<Stock[]>([]);
  const [industryTypes, setIndustryTypes] = useState<string[]>([]);
  const subscribedTickersRef = useRef<string[]>([]);
  const previousTickersRef = useRef<string[]>([]);
  const itemsPerPage = 4; // 한 페이지당 표시할 종목 수
  const { toast } = useToast();
  const router = useRouter();
  const [holdings, setHoldings] = useState<StockHolding[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);

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
    if (!isConnected) return;

    const currentFavorites = getFavoritePageStocks();
    const currentRecommended = getRecommendedPageStocks();
    const newTickers = [...currentFavorites, ...currentRecommended]
      .map((stock) => stock.ticker)
      .filter((value, index, self) => self.indexOf(value) === index); // 중복 제거

    // 현재 페이지에 없는 종목만 구독 해제
    subscribedTickersRef.current.forEach((ticker) => {
      if (!newTickers.includes(ticker)) {
        unsubscribeFromStock(ticker);
        unsubscribeFromRealtimeStock(ticker);
      }
    });

    // 새로운 종목만 구독
    newTickers.forEach((ticker) => {
      if (!subscribedTickersRef.current.includes(ticker)) {
        subscribeToStock(ticker);
        subscribeToRealtimeStock(ticker);
      }
    });

    // 구독 중인 티커 목록 업데이트
    subscribedTickersRef.current = newTickers;
  }, [isConnected, favoritePage, recommendedPage]);

  // 실시간 데이터 처리
  useEffect(() => {
    if (!stockData || !favoriteStocks.length) return;

    const updateStockData = (prevStocks: Stock[]) =>
      prevStocks.map((stock) => {
        if (stock.ticker === stockData.ticker) {
          const priceDiff = stockData.price - stock.closePrice;
          const fluctuationRate = (priceDiff / stock.closePrice) * 100;

          return {
            ...stock,
            currentPrice: stockData.price,
            priceDiff: priceDiff,
            fluctuationRate: fluctuationRate,
            volume: stockData.volume,
          };
        }
        return stock;
      });

    // 관심 종목 업데이트
    setFavoriteStocks((prevStocks) => updateStockData(prevStocks));
    // 추천 종목 업데이트
    setRecommendedStocks((prevStocks) => updateStockData(prevStocks));
  }, [stockData]);

  // 컴포넌트 언마운트 시 모든 구독 해제
  useEffect(() => {
    return () => {
      subscribedTickersRef.current.forEach((ticker) => {
        unsubscribeFromStock(ticker);
        unsubscribeFromRealtimeStock(ticker);
      });
      subscribedTickersRef.current = [];
    };
  }, []);

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

  // 현재 시간을 1분마다 업데이트
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateCurrentTime(); // 초기 실행
    const interval = setInterval(updateCurrentTime, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, []);

  // 시간 차이를 계산하는 함수
  const getTimeAgo = (dateString: string) => {
    try {
      // ISO 8601 형식의 시간 문자열을 Date 객체로 변환
      const date = new Date(dateString);
      
      // 유효하지 않은 날짜인 경우 예외 처리
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return '시간 정보 없음';
      }

      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      // 음수 시간차가 나오면 서버 시간과 클라이언트 시간 차이로 인한 것이므로 '방금 전'으로 표시
      if (diffInSeconds < 0) return '방금 전';
      
      if (diffInSeconds < 60) return `${diffInSeconds}초 전`;
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`; // 7일 이내
      
      // 7일이 넘어가면 날짜로 표시
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}.${month}.${day}`;
    } catch (error) {
      console.error('Error parsing date:', error);
      return '시간 정보 없음';
    }
  };

  // 커뮤니티 게시글 조회
  useEffect(() => {
    const fetchCommunityPosts = async () => {
      try {
        const response = await getRecentActivePosts();
        // 응답 데이터 로깅
        console.log('Community posts response:', response);
        
        // 데이터 형식 확인 및 변환
        const posts = response.data
          .map((post: any) => ({
            ...post,
            lastCommentTime: post.lastCommentTime || post.createdAt // lastCommentTime이 없으면 createdAt 사용
          }))
          .sort((a: any, b: any) => {
            // 최신 시간이 위로 오도록 내림차순 정렬
            return new Date(b.lastCommentTime).getTime() - new Date(a.lastCommentTime).getTime();
          });
        
        setCommunityPosts(posts);
      } catch (error) {
        console.error('Failed to fetch community posts:', error);
        toast({
          title: "오류",
          description: "커뮤니티 게시글을 불러오는데 실패했습니다.",
          variant: "destructive",
        });
      }
    };

    fetchCommunityPosts();
    const interval = setInterval(fetchCommunityPosts, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchTopPerformers = async () => {
      try {
        const data = await getTopPerformers();
        setTopPerformers(data);
      } catch (error) {
        console.error("상위 수익률 조회 실패:", error);
      }
    };

    fetchTopPerformers();
  }, []);

  useEffect(() => {
    const fetchIndustryTypes = async () => {
      try {
        const types = await stockApi.getIndustryTypes();
        console.log('Received industry types:', types);
        // 업종 목록을 랜덤으로 섞고 6개만 선택
        const shuffled = types.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 10);
        setIndustryTypes(selected);
        if (selected.length > 0) {
          setSelectedIndustry(selected[0]);
        }
      } catch (error) {
        console.error("Failed to fetch industry types:", error);
      }
    };

    fetchIndustryTypes();
  }, []);

  useEffect(() => {
    const fetchIndustryStocks = async () => {
      if (selectedIndustry) {
        try {
          console.log('Fetching stocks for industry:', selectedIndustry);
          const stocks = await stockApi.getStocksByIndustry(selectedIndustry);
          console.log('Received stocks:', stocks);
          setIndustryStocks(stocks);
        } catch (error) {
          console.error("Failed to fetch industry stocks:", error);
        }
      }
    };

    fetchIndustryStocks();
  }, [selectedIndustry]);

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
            <CardContent className="space-y-3 pt-6">
              <div className="p-4 bg-primary/10 rounded-lg text-primary-dark font-semibold">
                원하는 업종의 주식을 구경하세요
              </div>
              <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-2 no-scrollbar">
                {industryTypes.map((industry) => (
                  <Badge
                    key={industry}
                    variant={selectedIndustry === industry ? "default" : "secondary"}
                    className="cursor-pointer flex-shrink-0"
                    onClick={() => setSelectedIndustry(industry)}
                  >
                    {industry}
                  </Badge>
                ))}
              </div>

              <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                  display: none;
                }
                .no-scrollbar {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}</style>
              {selectedIndustry && (
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {industryStocks.map((stock) => (
                    <Card key={stock.ticker} className="min-w-[200px] flex-shrink-0">
                      <CardHeader>
                        <CardTitle className="text-lg">{stock.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>현재가</span>
                            <span className={cn(
                              stock.fluctuationRate > 0 ? "text-red-500" : "text-blue-500"
                            )}>
                              {typeof stock.currentPrice === 'number' 
                                ? stock.currentPrice.toLocaleString() 
                                : stock.closePrice.toLocaleString()}원
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>등락률</span>
                            <span className={cn(
                              stock.fluctuationRate > 0 ? "text-red-500" : "text-blue-500"
                            )}>
                              {stock.fluctuationRate > 0 ? "+" : ""}{stock.fluctuationRate.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 지금 뜨는 카테고리 & 커뮤니티 */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 지금 뜨는 카테고리 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-baseline gap-4">
                  <span>수익률 TOP 2</span>
                  <span className="text-sm font-normal text-gray-500">
                    {currentTime} 기준
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-around items-end">
                {topPerformers.length >= 2 ? (
                  <>
                    <div className="text-center">
                      <div className="text-lg font-bold">2위</div>
                      <img
                        src="/second.svg"
                        alt="Second Place"
                        className="w-20 h-20 mx-auto"
                      />
                      <div className="font-semibold">{topPerformers[1].nickname}</div>
                      <div className={topPerformers[1].profitRate >= 0 ? "text-sm text-red-500" : "text-sm text-blue-500"}>
                        {topPerformers[1].profitRate >= 0 ? "+" : ""}{topPerformers[1].profitRate.toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">1위</div>
                      <img
                        src="/first.svg"
                        alt="First Place"
                        className="w-24 h-24 mx-auto"
                      />
                      <div className="font-semibold">{topPerformers[0].nickname}</div>
                      <div className={topPerformers[0].profitRate >= 0 ? "text-sm text-red-500" : "text-sm text-blue-500"}>
                        {topPerformers[0].profitRate >= 0 ? "+" : ""}{topPerformers[0].profitRate.toFixed(2)}%
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    수익률 데이터가 없습니다
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 인기 급상승 커뮤니티 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>인기 급상승 커뮤니티</CardTitle>
                <span className="text-sm text-gray-500">
                  오늘 {currentTime} 기준
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                {communityPosts.map((post) => (
                  <Link href={`/community?postId=${post.id}`} key={post.id}>
                    <div className="flex justify-between items-center p-2 hover:bg-gray-100 rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{post.title}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{post.author}</span>
                          <span>•</span>
                          <span>{getTimeAgo(post.lastCommentTime)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
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