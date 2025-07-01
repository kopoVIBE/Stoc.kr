"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, Time } from "lightweight-charts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { stockApi, StockPrice } from "@/api/stock";

interface CandlestickData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

type IntervalType = "daily" | "weekly" | "monthly";

interface CandlestickChartProps {
  ticker?: string;
  data?: CandlestickData[];
}

export function CandlestickChart({
  ticker = "005930",
  data = [],
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [interval, setInterval] = useState<IntervalType>("daily");
  const [chartData, setChartData] = useState<CandlestickData[]>(data);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!ticker) return;
      setIsLoading(true);
      try {
        console.log("Fetching data for ticker:", ticker, "interval:", interval);
        const response = await stockApi.getStockPrices(ticker, interval);
        console.log("API Response:", response);

        if (response?.prices?.length > 0) {
          const formattedData = response.prices.map((price: StockPrice) => ({
            time: price.time.split("T")[0],
            open: price.open,
            high: price.high,
            low: price.low,
            close: price.close,
          }));
          console.log("Formatted chart data:", formattedData);
          setChartData(formattedData);
        } else {
          console.log("No price data available");
          setChartData([]);
        }
      } catch (error) {
        console.error("Failed to fetch stock prices:", error);
        setChartData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [ticker, interval]);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    console.log("Creating chart with data:", chartData);

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "white" },
        textColor: "black",
      },
      grid: {
        vertLines: { color: "#f0f3fa" },
        horzLines: { color: "#f0f3fa" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    if (chartData.length > 0) {
      candlestickSeries.setData(chartData);
    }

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [chartData]);

  return (
    <div>
      <div className="mb-4">
        <Tabs
          value={interval}
          className="w-full"
          onValueChange={(value: string) => setInterval(value as IntervalType)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">일별</TabsTrigger>
            <TabsTrigger value="weekly">주별</TabsTrigger>
            <TabsTrigger value="monthly">월별</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {isLoading ? (
        <div className="h-[400px] flex items-center justify-center">
          <p>Loading...</p>
        </div>
      ) : (
        <div ref={chartContainerRef} className="h-[400px]" />
      )}
    </div>
  );
}
