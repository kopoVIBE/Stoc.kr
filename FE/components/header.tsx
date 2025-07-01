"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "./ui/button";
import { getMyInfo } from "@/api/user";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // 초기값을 localStorage에서 동기적으로 설정 (깜빡임 방지)
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem("token");
    }
    return false;
  });
  
  // 토큰이 있을 때만 로딩 상태로 시작 (더 자연스러운 로딩)
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem("token"); // 토큰이 있으면 로딩, 없으면 바로 완료
    }
    return false;
  });

  // 로그인 상태 확인 및 사용자 정보 가져오기
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setIsLoggedIn(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      // 토큰이 있는 경우에만 로딩 시작
      setIsLoading(true);
      
      try {
        const userData = await getMyInfo();
        setUser(userData);
        setIsLoggedIn(true);
      } catch (error) {
        // 토큰이 유효하지 않은 경우
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [pathname]); // pathname이 변경될 때마다 체크

  if (pathname === "/login") {
    return null; // 로그인 페이지에서는 헤더를 숨깁니다.
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/stocks", label: "전체 종목" },
    { href: "/news", label: "뉴스" },
    { href: "/community", label: "커뮤니티" },
    { href: "/my-page", label: "내 정보" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUser(null);
    router.push("/login");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/stockr_green.svg"
              alt="Stoc.kr logo"
              width={40}
              height={40}
            />
            <span className="text-xl font-bold text-primary">Stoc.kr</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-base font-medium text-gray-500 hover:text-gray-900",
                  pathname === link.href && "text-gray-900"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              // 로딩 중일 때는 스켈레톤 UI 표시 (깜빡임 방지)
              <div className="w-20 h-9 bg-gray-100 rounded animate-pulse"></div>
            ) : isLoggedIn ? (
              <>
                <span className="text-base font-medium">{user?.name}님</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  로그아웃
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={handleLogin}>
                로그인
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
