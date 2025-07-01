"use client";

import { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { stockApi, StockPrice } from "@/api/stock";

interface CandlestickData {
  time: string;
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
        const response = await stockApi.getStockPrices(ticker, interval);

        if (response?.data?.prices?.length > 0) {
          const formattedData = response.data.prices.map(
            (price: StockPrice) => ({
              time: price.date.split("T")[0],
              open: price.open,
              high: price.high,
              low: price.low,
              close: price.close,
            })
          );
          setChartData(formattedData);
        } else {
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

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "white" },
        textColor: "black",
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    const candlestickSeries = chart.addCandlestickSeries();

    if (chartData.length > 0) {
      candlestickSeries.setData(chartData);
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
