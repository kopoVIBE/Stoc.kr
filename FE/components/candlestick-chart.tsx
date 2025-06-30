"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, Time } from "lightweight-charts";

interface CandlestickData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  data?: CandlestickData[];
}

export function CandlestickChart({ data = [] }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 차트 생성 및 기본 설정
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: "#ffffff" as ColorType },
        textColor: "#333",
      },
      grid: {
        vertLines: { color: "#f0f3fa" },
        horzLines: { color: "#f0f3fa" },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: "#f0f3fa",
      },
      timeScale: {
        borderColor: "#f0f3fa",
        timeVisible: true,
      },
    });

    // 캔들스틱 시리즈 생성
    const candlestickSeries = chart.addCandlestickSeries();
    candlestickSeries.applyOptions({
      upColor: "#f04452", // 상승: 빨간색
      downColor: "#3182f6", // 하락: 파란색
      borderVisible: false,
      wickUpColor: "#f04452", // 상승 꼬리: 빨간색
      wickDownColor: "#3182f6", // 하락 꼬리: 파란색
    });

    // 데이터 설정
    const chartData =
      data.length > 0
        ? data
        : [
            {
              time: "2025-02-01" as Time,
              open: 55.11,
              high: 56.55,
              low: 54.88,
              close: 55.8,
            },
            {
              time: "2025-02-02" as Time,
              open: 55.77,
              high: 56.22,
              low: 54.77,
              close: 55.99,
            },
            {
              time: "2025-02-03" as Time,
              open: 55.98,
              high: 56.03,
              low: 54.98,
              close: 55.33,
            },
            {
              time: "2025-02-04" as Time,
              open: 55.42,
              high: 55.55,
              low: 54.42,
              close: 55.52,
            },
            {
              time: "2025-02-05" as Time,
              open: 55.53,
              high: 56.53,
              low: 55.53,
              close: 56.21,
            },
            {
              time: "2025-03-15" as Time,
              open: 56.21,
              high: 58.21,
              low: 56.01,
              close: 57.9,
            },
            {
              time: "2025-04-17" as Time,
              open: 57.9,
              high: 58.5,
              low: 54.3,
              close: 55.0,
            },
            {
              time: "2025-05-10" as Time,
              open: 55.0,
              high: 61.0,
              low: 54.8,
              close: 60.8,
            },
            {
              time: "2025-06-01" as Time,
              open: 60.8,
              high: 61.2,
              low: 59.3,
              close: 59.8,
            },
          ];

    candlestickSeries.setData(chartData);

    // 차트 크기 조정
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // 줌 및 스크롤 설정
    chart.timeScale().fitContent();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data]);

  return (
    <div
      ref={chartContainerRef}
      style={{
        width: "100%",
        height: "400px",
      }}
    />
  );
}
