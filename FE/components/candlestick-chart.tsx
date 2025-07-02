"use client";

import { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { stockApi } from "@/api/stock";

interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  ticker: string;
  data?: CandlestickData[];
}

export function CandlestickChart({ ticker, data }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState<CandlestickData[]>([]);

  useEffect(() => {
    if (data) {
      setChartData(data);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await stockApi.getStockPrices(ticker);
        if (response.success && response.data.prices) {
          const prices = response.data.prices.map((price) => ({
            time: price.date.split("T")[0],
            open: price.open,
            high: price.high,
            low: price.low,
            close: price.close,
          }));
          setChartData(prices);
        }
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
      }
    };

    fetchData();
  }, [ticker, data]);

  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return;

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

    candlestickSeries.setData(chartData);

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

  return <div ref={chartContainerRef} />;
}
