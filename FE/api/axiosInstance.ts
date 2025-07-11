// FE/api/axiosInstance.ts
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL, // 백엔드 주소
  headers: {
    "Content-Type": "application/json",
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
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// 토큰 만료 처리를 위한 response interceptor 추가
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("token");
      alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
      window.location.href = "/login";
    }
    console.error("API Error:", error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);
console.log("AXIOS BASE URL:", process.env.NEXT_PUBLIC_BACKEND_URL);
export default axiosInstance;
