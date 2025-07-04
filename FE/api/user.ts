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
    
    if (!res.data.success) {
        throw new Error(res.data.message);
    }
    
    return res.data;
};

export const login = async (data: LoginData) => {
    const res = await axiosInstance.post('/api/users/login', data);
    
    if (!res.data.success) {
        throw new Error(res.data.message);
    }
    
    return res.data.token.replace(/^Bearer\s/, ''); // "Bearer " 제거
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

export const updateUserName = async (name: string) => {
  const res = await axiosInstance.put('/api/users/me/name', { name });
  
  if (!res.data.success) {
    throw new Error(res.data.message);
  }
  
  return res.data;
};

export const updateUserPhone = async (phone: string) => {
  const res = await axiosInstance.put('/api/users/me/phone', { phone });
  
  if (!res.data.success) {
    throw new Error(res.data.message);
  }
  
  return res.data;
};

export const updateUserPassword = async (currentPassword: string, newPassword: string) => {
  const res = await axiosInstance.put('/api/users/me/password', { 
    currentPassword, 
    newPassword 
  });
  
  if (!res.data.success) {
    throw new Error(res.data.message);
  }
  
  return res.data;
};

export const checkNicknameDuplicate = async (nickname: string): Promise<{ isDuplicate: boolean; message: string }> => {
  const res = await axiosInstance.get('/api/users/check-nickname', {
    params: { nickname }
  });
  
  if (!res.data.success) {
    throw new Error(res.data.message || '닉네임 확인에 실패했습니다.');
  }
  
  return {
    isDuplicate: res.data.isDuplicate,
    message: res.data.message
  };
};

export const updateUserNickname = async (nickname: string) => {
  const res = await axiosInstance.put('/api/users/me/nickname', { nickname });
  
  if (!res.data.success) {
    throw new Error(res.data.message);
  }
  
  return res.data;
};
