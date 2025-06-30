// FE/api/account.ts
import axiosInstance from './axiosInstance';

interface AccountRequest {
  bankName: string;
  accountNumber: string;
}

export const createAccount = async (data: AccountRequest) => {
  const res = await axiosInstance.post('/api/accounts', data);
  return res.data;
};

export const getAccount = async () => {
  try {
    const res = await axiosInstance.get('/api/accounts');

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

