import axiosInstance from "./axiosInstance";

export interface Stock {
  id: number;
  ticker: string;
  name: string;
  closePrice: number;
  priceChange: number;
  priceChangePercent: number;
  marketCap: number;
  volume: number;
  eps?: number;
  per?: number;
  bps?: number;
  pbr?: number;
  dividendPerShare?: number;
  dividendYield?: number;
  beta?: number;
  return1yPercent?: number;
  returnVolatility?: number;
  marketType?: string;
  industryType?: string;
  logo?: string;
  lastUpdated: string;
  priceDiff: number;
  fluctuationRate: number;
  forwardEps: number;
  forwardPer: number;
  epsStd: number;
  perStd: number;
  forwardEpsStd: number;
  forwardPerStd: number;
  bpsStd: number;
  pbrStd: number;
  dividendPerShareStd: number;
  dividendYieldStd: number;
  marketCapStd: number;
}

export interface StockPrice {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockPriceResponse {
  ticker: string;
  stockName: string;
  interval: string;
  prices: StockPrice[];
}

export const stockApi = {
  getStocks: async (): Promise<Stock[]> => {
    const response = await axiosInstance.get("/api/stocks");
    return response.data;
  },
  getStock: async (ticker: string): Promise<Stock> => {
    const response = await axiosInstance.get(`/api/stocks/${ticker}`);
    return response.data;
  },
  getStockPrices: async (
    ticker: string,
    interval: "daily" | "weekly" | "monthly" = "daily",
    startDate?: string,
    endDate?: string,
    limit?: number
  ): Promise<StockPriceResponse> => {
    const params = new URLSearchParams();
    params.append("interval", interval);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (limit) params.append("limit", limit.toString());

    const response = await axiosInstance.get(
      `/api/v1/stocks/${ticker}/prices?${params}`
    );
    console.log("API Raw Response:", response);
    return response.data;
  },
};

// 즐겨찾기 관련 API
export const getFavorites = async () => {
  const response = await axiosInstance.get("/api/v1/favorites");
  return response.data;
};

export const checkFavorite = async (ticker: string) => {
  console.log("Checking favorite for ticker:", ticker);
  const response = await axiosInstance.get(`/api/v1/favorites/${ticker}`);
  return response.data;
};

export const addFavorite = async (ticker: string) => {
  console.log("Adding favorite for ticker:", ticker);
  const response = await axiosInstance.post(`/api/v1/favorites/${ticker}`);
  return response.data;
};

export const removeFavorite = async (ticker: string) => {
  console.log("Removing favorite for ticker:", ticker);
  const response = await axiosInstance.delete(`/api/v1/favorites/${ticker}`);
  return response.data;
};
