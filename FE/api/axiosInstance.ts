// FE/api/axiosInstance.ts
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://54.180.117.219:8080", // 백엔드 서버 진짜마지막
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
  console.log("Request URL:", config.url);
  console.log("Request Method:", config.method);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("✅ Headers:", config.headers);
  } else {
    console.warn("⚠️ No token found in localStorage");
  }
  return config;
});
// 토큰 만료 처리를 위한 response interceptor 추가
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("Response Status:", response.status);
    console.log("Response Headers:", response.headers);
    return response;
  },
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // 토큰이 만료되거나 유효하지 않은 경우
      localStorage.removeItem("token");
      alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
      window.location.href = "/login";
    }
    console.error(
      "Request Error:",
      error.response?.status,
      error.response?.data
    );
    return Promise.reject(error);
  }
);

export default axiosInstance;
