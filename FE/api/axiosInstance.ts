// src/lib/axiosInstance.ts

import axios from 'axios';

// 토큰을 저장한 storage에서 가져오는 함수
function getAccessToken(): string | null {
    return localStorage.getItem('accessToken'); // 또는 sessionStorage
}

// Axios 인스턴스 생성
const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080', // 환경 변수 사용 가능
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터: 요청마다 Authorization 헤더 추가
axiosInstance.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터: 예를 들어 401 에러 시 토큰 만료 처리 등
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // 예: 토큰 만료 처리
        if (error.response && error.response.status === 401) {
            console.warn('Unauthorized - 토큰 만료 또는 인증 실패');
            // 예: 리프레시 토큰 요청 또는 로그아웃 처리 등
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
