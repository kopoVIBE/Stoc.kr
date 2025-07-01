"use client";

import { Heart } from "lucide-react";
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
import { useState, useEffect } from "react";
import { getFavorites, removeFavorite } from "@/api/stock";
import { FavoriteConfirmDialog } from "@/components/favorite-confirm-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

const favoriteStocks = [
  {
    ticker: "005930",
    name: "삼성전자",
    closePrice: 60800,
    fluctuationRate: 0.9,
    logo: "/samsung-logo.png",
  },
  {
    ticker: "000660",
    name: "SK하이닉스",
    closePrice: 283500,
    fluctuationRate: -3.2,
    logo: "/placeholder.svg?height=32&width=32",
  },
  {
    ticker: "207940",
    name: "삼성바이오로직스",
    closePrice: 997000,
    fluctuationRate: -0.2,
    logo: "/placeholder.svg?height=32&width=32",
  },
  {
    ticker: "373220",
    name: "LG에너지솔루션",
    closePrice: 289000,
    fluctuationRate: -2.6,
    logo: "/placeholder.svg?height=32&width=32",
  },
  {
    ticker: "005380",
    name: "현대차",
    closePrice: 205000,
    fluctuationRate: -2.1,
    logo: "/placeholder.svg?height=32&width=32",
  },
];

const recommendedStocks: Stock[] = [
  {
    ticker: "JTC",
    name: "JTC",
    closePrice: 6480,
    fluctuationRate: 3.8,
    category: "면세점",
    marketCap: "3,353.2억원",
    volume: "1,050,316주",
    logo: "/placeholder.svg?height=32&width=32",
  },
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
    ticker: "003100",
    name: "서원",
    closePrice: 1304,
    fluctuationRate: 0.7,
    category: "구리",
    marketCap: "619.1억원",
    volume: "353,222주",
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
    title: "지금은 올라가지만 언제까지 갈지...",
    author: "투자하는개미",
    time: "21시간 전",
  },
  {
    id: 2,
    title: "카카오페이가 결국에는...",
    author: "지켜보는개미",
    time: "9시간 전",
  },
];

interface Stock {
  ticker: string;
  name: string;
  closePrice: number;
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
}

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [favoriteStocks, setFavoriteStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    setCurrentTime(`${hours}:${minutes}`);

    const fetchFavorites = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await getFavorites();
        setFavoriteStocks(response.data);
      } catch (error) {
        toast({
          title: "오류",
          description: "관심 종목을 불러오는데 실패했습니다.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, []);

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
      await removeFavorite(stock.ticker);
      setFavoriteStocks((prev) =>
        prev.filter((s) => s.ticker !== stock.ticker)
      );
      toast({
        description: `${stock.name}이(가) 관심 종목에서 제거되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "오류",
        description: "관심 종목 해제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 관심 종목 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-baseline gap-4">
              <span>내 관심 종목</span>
              <span className="text-sm font-normal text-gray-500">
                {currentTime ? `오늘 ${currentTime} 기준` : "로딩 중..."}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">로딩 중...</div>
            ) : favoriteStocks.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                관심 종목이 없습니다.
              </div>
            ) : (
              <StockTable
                stocks={favoriteStocks}
                isRecommended={false}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={() => true}
              />
            )}
          </CardContent>
        </Card>

        {/* 추천 종목 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-baseline gap-4">
              <span>User1님을 위한 추천 종목</span>
              <span className="text-sm font-normal text-gray-500">
                {currentTime ? `오늘 ${currentTime} 기준` : "로딩 중..."}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StockTable stocks={recommendedStocks} isRecommended={true} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 내게 맞는 주식 */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>내게 맞는 주식 골라보기</CardTitle>
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
  );
}

function StockTable({
  stocks,
  isRecommended,
  onToggleFavorite,
  isFavorite,
}: StockTableProps) {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleHeartClick = (stock: Stock) => {
    if (isFavorite?.(stock)) {
      setSelectedStock(stock);
      setIsDialogOpen(true);
    } else if (onToggleFavorite) {
      onToggleFavorite(stock);
    }
  };

  const handleConfirmRemove = () => {
    if (selectedStock && onToggleFavorite) {
      onToggleFavorite(selectedStock);
    }
    setIsDialogOpen(false);
    setSelectedStock(null);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>종목명</TableHead>
            <TableHead className="text-right">현재가</TableHead>
            <TableHead className="text-right">등락률</TableHead>
            {isRecommended && (
              <TableHead className="hidden sm:table-cell text-right">
                시가총액
              </TableHead>
            )}
            {isRecommended && (
              <TableHead className="hidden lg:table-cell text-right">
                거래량
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {stocks.map((stock, index) => (
            <TableRow key={stock.ticker}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {onToggleFavorite && (
                    <Heart
                      className={`w-5 h-5 cursor-pointer ${
                        isFavorite?.(stock)
                          ? "text-red-500 fill-current"
                          : "text-gray-300"
                      }`}
                      onClick={() => handleHeartClick(stock)}
                    />
                  )}
                  <span className="font-bold text-primary">{index + 1}</span>
                </div>
              </TableCell>
              <TableCell>
                <Link
                  href={`/stocks/${stock.ticker}`}
                  className="hover:underline"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={stock.logo || "/placeholder.svg"}
                      alt={stock.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="font-semibold">{stock.name}</span>
                  </div>
                </Link>
              </TableCell>
              <TableCell className="text-right font-semibold">
                {stock.closePrice}
              </TableCell>
              <TableCell
                className={`text-right ${
                  stock.fluctuationRate > 0 ? "text-red-500" : "text-blue-500"
                }`}
              >
                <div>
                  {stock.fluctuationRate > 0 ? "+" : ""}
                  {stock.fluctuationRate}%
                </div>
              </TableCell>
              {isRecommended && (
                <TableCell className="hidden sm:table-cell text-right">
                  {stock.marketCap}
                </TableCell>
              )}
              {isRecommended && (
                <TableCell className="hidden lg:table-cell text-right">
                  {stock.volume}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <FavoriteConfirmDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleConfirmRemove}
        stockName={selectedStock?.name || ""}
      />
    </>
  );
}
