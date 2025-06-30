"use client";

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

export default function StocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [sortedStocks, setSortedStocks] = useState<Stock[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortType, setSortType] = useState("volume");
  const [currentTime, setCurrentTime] = useState(new Date());
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
        const allStocks = await stockApi.getStocks();
        console.log("Fetched all stocks:", allStocks);
        setStocks(allStocks);
        setSortedStocks(allStocks);
      } catch (error) {
        console.error("Failed to fetch stocks:", error);
      }
    };
    fetchStocks();
  }, []);

  // 정렬 방식에 따른 데이터 정렬
  useEffect(() => {
    const sortStocks = () => {
      const sorted = [...stocks];
      switch (sortType) {
        case "volume":
          sorted.sort((a, b) => b.volume - a.volume);
          break;
        case "amount":
          sorted.sort((a, b) => b.currentPrice - a.currentPrice);
          break;
        case "up":
          sorted.sort((a, b) => b.fluctuationRate - a.fluctuationRate);
          break;
        case "down":
          sorted.sort((a, b) => a.fluctuationRate - b.fluctuationRate);
          break;
        case "popular":
          sorted.sort((a, b) => b.volume - a.volume);
          break;
      }
      setSortedStocks(sorted);
      setCurrentPage(1);
    };
    sortStocks();
  }, [sortType, stocks]);

  // 현재 페이지의 종목들
  const currentPageStocks = sortedStocks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 페이지네이션
  const totalPages = Math.ceil(sortedStocks.length / itemsPerPage);
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

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-4">
        <h1 className="text-3xl font-bold">실시간 차트</h1>
        <span className="text-base text-gray-500">
          {currentTime.toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}{" "}
          기준
        </span>
      </div>

      <Tabs
        defaultValue="volume"
        className="w-full"
        onValueChange={setSortType}
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
            {currentPageStocks.map((stock, index) => (
              <TableRow key={stock.ticker || `stock-${index}`}>
                <TableCell>
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </TableCell>
                <TableCell>{stock.name}</TableCell>
                <TableCell>
                  {stock.currentPrice?.toLocaleString() ?? "-"}원
                </TableCell>
                <TableCell>
                  {stock.priceDiff?.toLocaleString() ?? "-"}
                </TableCell>
                <TableCell>
                  {stock.fluctuationRate?.toFixed(2) ?? "-"}%
                </TableCell>
                <TableCell>{stock.volume?.toLocaleString() ?? "-"}</TableCell>
                <TableCell>
                  {(stock.marketCap / 100000000)?.toLocaleString() ?? "-"}억
                </TableCell>
              </TableRow>
            ))}
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
              currentPage === number ? "bg-blue-500 text-white" : "bg-gray-200"
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
  );
}
