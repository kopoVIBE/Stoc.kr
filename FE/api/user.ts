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
    return res.data; // "Bearer ..." 문자열
};
