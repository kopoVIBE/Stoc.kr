import axiosInstance from "./axiosInstance";

export interface Stock {
  ticker: string;
  name: string;
  currentPrice: number;
  volume: number;
  lastUpdated: string;
  priceDiff: number;
  fluctuationRate: number;
  marketCap: number;
  closePrice: number;
  eps: number;
  per: number;
  forwardEps: number;
  forwardPer: number;
  bps: number;
  pbr: number;
  dividendPerShare: number;
  dividendYield: number;
  marketType: string;
  industryType: string;
  epsStd: number;
  perStd: number;
  forwardEpsStd: number;
  forwardPerStd: number;
  bpsStd: number;
  pbrStd: number;
  dividendPerShareStd: number;
  dividendYieldStd: number;
  marketCapStd: number;
  beta: number;
  return1yPercent: number;
  returnVolatility: number;
}

export const stockApi = {
  getStocks: async (): Promise<Stock[]> => {
    const response = await axiosInstance.get("/api/stocks");
    return response.data;
  },
};
