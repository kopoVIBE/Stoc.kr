"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 첫 화면을 로그인 페이지로 리다이렉트
    router.push("/login");
  }, [router]);

  // 로딩 화면 표시 (리다이렉트 중)
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-500">로딩 중...</p>
      </div>
    </div>
  );
}
