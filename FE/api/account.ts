// FE/api/account.ts
import axiosInstance from "./axiosInstance";

interface AccountRequest {
  bankName: string;
  accountNumber: string;
}

export interface TradeRequest {
  stockId: string;
  orderType: "BUY" | "SELL";
  quantity: number;
  price: number;
}

// 실제 API 요청 전에 stockId를 ticker로 변환하는 함수
const convertToApiRequest = (request: TradeRequest) => {
  const { stockId, ...rest } = request;
  return {
    ticker: stockId,  // stockId를 ticker로 변환
    ...rest
  };
};

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
  try {
    console.log("[API] 주문 생성 요청 데이터:", data);

    const res = await axiosInstance.post("/api/trading/orders", data);
    
    console.log("[API] 주문 생성 성공 응답:", res.data);

    return res.data;
  } catch (error: any) {
    console.error("[API] 주문 생성 실패");
    
    // 서버에서 반환한 에러 메시지 처리
    if (error.response?.data?.message) {
      console.error("서버 에러 메시지:", error.response.data.message);
      throw new Error(error.response.data.message);
    }
    
    // 네트워크 에러 처리
    if (!error.response) {
      console.error("네트워크 에러:", error.message);
      throw new Error("서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.");
    }
    
    // HTTP 상태 코드별 에러 메시지
    const status = error.response.status;
    switch (status) {
      case 400:
        throw new Error("잘못된 주문 요청입니다. 주문 내용을 확인해주세요.");
      case 401:
        throw new Error("로그인이 필요합니다.");
      case 403:
        throw new Error("주문 권한이 없습니다.");
      case 404:
        throw new Error("주문할 수 없는 종목이거나 실시간 시세를 조회할 수 없습니다.");
      case 409:
        throw new Error("주문이 충돌했습니다. 잠시 후 다시 시도해주세요.");
      case 500:
        throw new Error("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      default:
        throw new Error("주문 처리 중 오류가 발생했습니다.");
    }
  }
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
    const res = await axiosInstance.get<HoldingsResponse>("/api/accounts/holdings");
    console.log("API 응답:", res.data);
    return res.data.data || [];
  } catch (error) {
    console.error("보유 종목 조회 실패:", error);
    throw error;
  }
};

export interface TopPerformer {
  nickname: string;
  profitRate: number;
}

export const getTopPerformers = async (): Promise<TopPerformer[]> => {
  const response = await axiosInstance.get('/api/accounts/top-performers');
  return response.data.data;
};
