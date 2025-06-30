// FE/api/user.ts
import axiosInstance from './axiosInstance';

interface SignupData {
    email: string;
    password: string;
    name: string;
    phone: string;
    birthDate: string;
    genderCode: string;
    gender: string;
    investmentStyle: string;
}

interface LoginData {
    email: string;
    password: string;
}

export const signup = async (data: SignupData) => {
    const res = await axiosInstance.post('/api/users/signup', data);
    return res.data;
};

export const login = async (data: LoginData) => {
    const res = await axiosInstance.post('/api/users/login', data);
    return res.data.replace(/^Bearer\s/, ''); // ✅ "Bearer " 제거
};

export const getMyInfo = async () => {
  const res = await axiosInstance.get('/api/users/me');
  return res.data;
};

export const updateInvestmentStyle = async (investmentStyle: string) => {
  const res = await axiosInstance.put('/api/users/me/investment-style', {
    investmentStyle
  });
  return res.data;
};


