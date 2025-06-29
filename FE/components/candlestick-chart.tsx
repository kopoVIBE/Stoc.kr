"use client"

import { useRef } from "react"
import { Chart as ChartJS, CategoryScale, LinearScale, Tooltip, Legend, TimeSeriesScale } from "chart.js"
import { Chart } from "react-chartjs-2"
import { CandlestickController, CandlestickElement } from "chartjs-chart-financial"
import "chartjs-adapter-date-fns"
import zoomPlugin from "chartjs-plugin-zoom"

// Register necessary components
ChartJS.register(
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement,
  TimeSeriesScale,
  zoomPlugin,
)

// Mock data - replace with real API data
const financialData = [
  { x: new Date("2025-02-01").valueOf(), o: 55.11, h: 56.55, l: 54.88, c: 55.8 },
  { x: new Date("2025-02-02").valueOf(), o: 55.77, h: 56.22, l: 54.77, c: 55.99 },
  { x: new Date("2025-02-03").valueOf(), o: 55.98, h: 56.03, l: 54.98, c: 55.33 },
  { x: new Date("2025-02-04").valueOf(), o: 55.42, h: 55.55, l: 54.42, c: 55.52 },
  { x: new Date("2025-02-05").valueOf(), o: 55.53, h: 56.53, l: 55.53, c: 56.21 },
  { x: new Date("2025-03-15").valueOf(), o: 56.21, h: 58.21, l: 56.01, c: 57.9 },
  { x: new Date("2025-04-17").valueOf(), o: 57.9, h: 58.5, l: 54.3, c: 55.0 },
  { x: new Date("2025-05-10").valueOf(), o: 55.0, h: 61.0, l: 54.8, c: 60.8 },
  { x: new Date("2025-06-01").valueOf(), o: 60.8, h: 61.2, l: 59.3, c: 59.8 },
]

export function CandlestickChart() {
  const chartRef = useRef<ChartJS>(null)

  const data = {
    datasets: [
      {
        label: "삼성전자",
        data: financialData,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const raw = context.raw as { c: number }
            return `종가: ${raw.c.toLocaleString()}원`
          },
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "x" as const,
        },
        zoom: {
          wheel: {
            enabled: true,
            modifierKey: "shift" as const,
          },
          pinch: {
            enabled: true,
          },
          mode: "x" as const,
        },
      },
    },
    scales: {
      x: {
        type: "timeseries" as const,
        time: {
          unit: "month" as const,
        },
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: "#e5e7eb",
          borderDash: [3, 3],
        },
        ticks: {
          callback: (value) => typeof value === "number" && value.toLocaleString(),
        },
      },
    },
    elements: {
      candlestick: {
        color: {
          up: "#f04452", // 상승: 빨간색
          down: "#3182f6", // 하락: 파란색
          unchanged: "#999",
        },
      },
    },
  }

  return (
    <div style={{ height: "400px" }}>
      <Chart type="candlestick" ref={chartRef} data={data} options={options} />
    </div>
  )
}
