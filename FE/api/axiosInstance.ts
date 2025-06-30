// FE/api/axiosInstance.ts
import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080', // 백엔드 주소
    headers: {
        'Content-Type': 'application/json',
    },
});

// 토큰이 있다면 Authorization 헤더에 자동 추가
// axiosInstance.interceptors.request.use((config) => {
//     const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
//     if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
// });

axiosInstance.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("✅ JWT Token attached:", token);
  } else {
    console.warn("⚠️ No token found in localStorage");
  }
  return config;
});


export default axiosInstance;
