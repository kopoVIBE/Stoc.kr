import axiosInstance from "./axiosInstance";

// TODO: 백엔드와 동일한 ApiResponse 타입 정의 필요
type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export interface Stock {
  ticker: string;
  name: string;
  closePrice: number;
  currentPrice?: number;
  priceDiff: number;
  fluctuationRate: number;
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
  prevPrice?: number;
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

export interface SimilarStock {
  name: string;
  ticker: string;
  similarity: number;
  industry: string;
}

export interface LimitOrder {
  id: number;
  stock: {
    ticker: string;
    name: string;
    closePrice: number;
    priceDiff: number;
    fluctuationRate: number;
    marketType: string;
    industryType: string;
  };
  orderType: "BUY" | "SELL";
  quantity: number;
  price: number;
  status: "PENDING" | "EXECUTED" | "CANCELLED";
  createdAt: string;
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

export const getSimilarStocks = async (
  stockName: string
): Promise<SimilarStock[]> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SIMILARITY_API_URL}/recommend?stock_name=${stockName}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch similar stocks");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching similar stocks:", error);
    return [];
  }
};

/**
 * 백엔드에 특정 종목의 실시간 데이터 수집을 요청(구독)합니다.
 * @param stockCode 구독할 종목 코드
 */
export const subscribeToRealtimeStock = async (
  stockCode: string
): Promise<ApiResponse<null>> => {
  return axiosInstance.post(`/api/v1/stocks/${stockCode}/subscribe`);
};

/**
 * 백엔드에 특정 종목의 실시간 데이터 수집 중단을 요청(구독 취소)합니다.
 * @param stockCode 구독 취소할 종목 코드
 */
export const unsubscribeFromRealtimeStock = async (
  stockCode: string
): Promise<ApiResponse<null>> => {
  return axiosInstance.post(`/api/v1/stocks/${stockCode}/unsubscribe`);
};

export const getPendingOrders = async (): Promise<LimitOrder[]> => {
  try {
    const response = await axiosInstance.get("/api/trading/orders/pending");
    console.log("API 응답 데이터:", response.data);
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch pending orders:", error);
    throw error;
  }
};
