import axiosInstance from "./axiosInstance";

export interface Stock {
  ticker: string;
  name: string;
  closePrice: number;
  priceDiff?: number;
  fluctuationRate?: number;
  marketCap: number;
  volume?: number;
  per?: number;
  pbr?: number;
  eps?: number;
  bps?: number;
  industryType?: string;
  marketType?: string;
  sharesOutstanding?: number;
  high52Week?: number;
  low52Week?: number;
}

export interface StockPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockPriceResponse {
  success: boolean;
  data: {
    ticker: string;
    interval: string;
    prices: StockPrice[];
    meta: {
      totalCount: number;
      startDate: string;
      endDate: string;
    };
  };
  message: string | null;
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
