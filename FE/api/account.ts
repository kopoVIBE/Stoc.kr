// FE/api/account.ts
import axiosInstance from "./axiosInstance";

interface AccountRequest {
  bankName: string;
  accountNumber: string;
}

interface TradeRequest {
  stockId: string;
  orderType: "BUY" | "SELL";
  quantity: number;
  price: number;
}

export interface StockHolding {
  stockCode: string;
  stockName: string;
  quantity: number;
  averagePurchasePrice: number;
  currentPrice: number;
  totalPurchaseAmount: number;
  evaluationAmount: number;
  evaluationProfitLoss: number;
  profitLossRate: number;
}

interface HoldingsResponse {
  success: boolean;
  data: StockHolding[];
  message?: string;
}

export const createAccount = async (data: AccountRequest) => {
  const res = await axiosInstance.post("/api/accounts", data);
  return res.data;
};

export const getAccount = async () => {
  try {
    const res = await axiosInstance.get("/api/accounts");

    // null이면 계좌 없음 처리
    if (!res.data) {
      console.warn("📭 계좌 없음 (null 반환)");
      return null;
    }

    return res.data;
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 404 || status === 403) {
      console.warn("📭 계좌 없음 또는 권한 없음");
      return null;
    }
    console.error("❌ 계좌 조회 실패:", error);
    throw error;
  }
};

export const createOrder = async (data: TradeRequest) => {
  const res = await axiosInstance.post("/api/trading/orders", data);
  return res.data;
};

export const getStockHolding = async (stockCode: string) => {
  try {
    const res = await axiosInstance.get(`/api/accounts/holdings/${stockCode}`);
    return res.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const getPendingOrders = async () => {
  const res = await axiosInstance.get("/api/trade/pending");
  return res.data;
};

export const getHoldings = async (): Promise<StockHolding[]> => {
  try {
    const res = await axiosInstance.get<HoldingsResponse>("/api/v1/holdings");
    console.log("API 응답:", res.data);
    return res.data.data || [];
  } catch (error) {
    console.error("보유 종목 조회 실패:", error);
    throw error;
  }
};
