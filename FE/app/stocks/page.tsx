"use client";

import React from "react";
import { useEffect, useState } from "react";
import { Stock, stockApi } from "@/api/stock";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function StocksPage() {
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortType, setSortType] = useState("volume");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sortedStocks, setSortedStocks] = useState<Stock[]>([]);

  const itemsPerPage = 8;

  // 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setIsLoading(true);
        const response = await stockApi.getStocks();
        setStocks(response);
      } catch (error) {
        console.error("Failed to fetch stocks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStocks();
  }, []);

  // 정렬 방식에 따른 데이터 정렬
  useEffect(() => {
    const sortStocks = () => {
      const filtered = stocks.filter(
        (stock) =>
          stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stock.ticker.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const sorted = [...filtered];
      switch (sortType) {
        case "volume":
          sorted.sort((a, b) => (b.volume || 0) - (a.volume || 0));
          break;
        case "amount":
          sorted.sort(
            (a, b) =>
              (b.volume || 0) * (b.closePrice || 0) -
              (a.volume || 0) * (a.closePrice || 0)
          );
          break;
        case "up":
          sorted.sort(
            (a, b) => (b.fluctuationRate || 0) - (a.fluctuationRate || 0)
          );
          break;
        case "down":
          sorted.sort(
            (a, b) => (a.fluctuationRate || 0) - (b.fluctuationRate || 0)
          );
          break;
        case "popular":
          sorted.sort((a, b) => (b.volume || 0) - (a.volume || 0));
          break;
      }
      setSortedStocks(sorted);
      setCurrentPage(1);
    };
    sortStocks();
  }, [sortType, stocks, searchTerm]);

  // 정렬된 주식 목록에 대한 페이지네이션
  const totalPages = Math.ceil(sortedStocks.length / itemsPerPage);
  const currentPageStocks = sortedStocks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 페이지네이션
  const getPageNumbers = () => {
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);

    if (end > totalPages) {
      start = Math.max(1, totalPages - 4);
      end = totalPages;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const pageNumbers = getPageNumbers();

  const handleStockClick = (ticker: string) => {
    router.push(`/stocks/${ticker}`);
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-4">
          <h1 className="text-2xl font-bold">전체 종목</h1>
          <span className="text-sm text-gray-500">
            {currentTime.toLocaleTimeString()} 기준
          </span>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            type="text"
            placeholder="종목명 또는 종목코드로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-6">
        <Tabs
          defaultValue="volume"
          value={sortType}
          onValueChange={setSortType}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="volume">거래대금</TabsTrigger>
            <TabsTrigger value="amount">거래량</TabsTrigger>
            <TabsTrigger value="up">급상승</TabsTrigger>
            <TabsTrigger value="down">급하락</TabsTrigger>
            <TabsTrigger value="popular">인기</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>순번</TableHead>
                <TableHead>종목명</TableHead>
                <TableHead>현재가</TableHead>
                <TableHead>전일대비</TableHead>
                <TableHead>등락률</TableHead>
                <TableHead>거래량</TableHead>
                <TableHead>시가총액</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : (
                currentPageStocks.map((stock, index) => (
                  <TableRow
                    key={stock.ticker || `stock-${index}`}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleStockClick(stock.ticker)}
                  >
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell>{stock.name}</TableCell>
                    <TableCell>
                      {stock.closePrice?.toLocaleString() ?? "-"}원
                    </TableCell>
                    <TableCell
                      className={
                        stock.priceDiff && stock.priceDiff > 0
                          ? "text-red-500"
                          : stock.priceDiff && stock.priceDiff < 0
                          ? "text-blue-500"
                          : ""
                      }
                    >
                      {stock.priceDiff
                        ? (stock.priceDiff > 0 ? "+" : "") +
                          stock.priceDiff.toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell
                      className={
                        stock.fluctuationRate && stock.fluctuationRate > 0
                          ? "text-red-500"
                          : stock.fluctuationRate && stock.fluctuationRate < 0
                          ? "text-blue-500"
                          : ""
                      }
                    >
                      {stock.fluctuationRate
                        ? (stock.fluctuationRate > 0 ? "+" : "") +
                          stock.fluctuationRate.toFixed(2) +
                          "%"
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {stock.volume?.toLocaleString() ?? "-"}
                    </TableCell>
                    <TableCell>
                      {(stock.marketCap / 100000000)?.toLocaleString() ?? "-"}억
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            {"<<"}
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            {"<"}
          </button>
          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => setCurrentPage(number)}
              className={`px-3 py-1 rounded min-w-[40px] ${
                currentPage === number
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              {number}
            </button>
          ))}
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            {">"}
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            {">>"}
          </button>
        </div>
      </div>
    </div>
  );
}
