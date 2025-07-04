"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ISeriesApi,
  CandlestickData as LightweightCandlestickData,
} from "lightweight-charts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { stockApi } from "@/api/stock";

interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface StockPrice {
  ticker: string;
  stockCode: string;
  price: number;
  volume: number;
  timestamp: number;
}

interface CandlestickChartProps {
  ticker: string;
  data?: CandlestickData[];
  realtimeData?: StockPrice | null;
}

export function CandlestickChart({
  ticker,
  data,
  realtimeData,
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick">>();
  const lastDataRef = useRef<CandlestickData>();
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await stockApi.getStockPrices(
          ticker,
          period === "day" ? "daily" : period === "week" ? "weekly" : "monthly"
        );

        if (response.success && response.data.prices) {
          const prices = response.data.prices.map((price: any) => ({
            time: price.date.split("T")[0],
            open: price.open,
            high: price.high,
            low: price.low,
            close: price.close,
          }));
          setChartData(prices);
        } else {
          setChartData([]);
        }
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
        setChartData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [ticker, period]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: "#ffffff" },
        textColor: "#333",
      },
      grid: {
        vertLines: { color: "#f0f0f0" },
        horzLines: { color: "#f0f0f0" },
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#ef4444",
      downColor: "#3b82f6",
      borderVisible: false,
      wickUpColor: "#ef4444",
      wickDownColor: "#3b82f6",
    });

    candlestickSeriesRef.current = candlestickSeries;

    if (chartData.length === 0) {
      candlestickSeries.setData([
        {
          time: new Date().toISOString().split("T")[0],
          open: 0,
          high: 0,
          low: 0,
          close: 0,
        },
      ]);
    } else {
      candlestickSeries.setData(chartData);
      lastDataRef.current = chartData[chartData.length - 1];
    }

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [chartData]);

  useEffect(() => {
    if (
      !realtimeData ||
      !realtimeData.timestamp ||
      !candlestickSeriesRef.current ||
      !lastDataRef.current ||
      period !== "day"
    )
      return;

    const currentDate = new Date(realtimeData.timestamp);
    const currentDateStr = currentDate.toISOString().split("T")[0];

    const lastDateStr = lastDataRef.current.time;

    if (currentDateStr === lastDateStr) {
      const updatedCandle = {
        ...lastDataRef.current,
        high: Math.max(lastDataRef.current.high, realtimeData.price),
        low: Math.min(lastDataRef.current.low, realtimeData.price),
        close: realtimeData.price,
      };

      candlestickSeriesRef.current.update(updatedCandle);
      lastDataRef.current = updatedCandle;
    } else {
      const newCandle = {
        time: currentDateStr,
        open: realtimeData.price,
        high: realtimeData.price,
        low: realtimeData.price,
        close: realtimeData.price,
      };

      candlestickSeriesRef.current.update(newCandle);
      lastDataRef.current = newCandle;
    }
  }, [realtimeData, period]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Tabs
          value={period}
          onValueChange={(value) =>
            setPeriod(value as "day" | "week" | "month")
          }
        >
          <TabsList>
            <TabsTrigger value="day">일</TabsTrigger>
            <TabsTrigger value="week">주</TabsTrigger>
            <TabsTrigger value="month">월</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="h-[400px] flex items-center justify-center">
          <div>로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs
        value={period}
        onValueChange={(value) => setPeriod(value as "day" | "week" | "month")}
      >
        <TabsList>
          <TabsTrigger value="day">일</TabsTrigger>
          <TabsTrigger value="week">주</TabsTrigger>
          <TabsTrigger value="month">월</TabsTrigger>
        </TabsList>
      </Tabs>
      <div ref={chartContainerRef} />
    </div>
  );
}
