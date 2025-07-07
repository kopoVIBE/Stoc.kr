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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // 컴포넌트가 마운트되었을 때만 실행
  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    setIsLoading(!!token);
  }, []);

  // 로그인 상태 확인 및 사용자 정보 가져오기
  useEffect(() => {
    if (!isMounted) return;

    const checkAuthStatus = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsLoggedIn(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const userData = await getMyInfo();
        setUser(userData);
        setIsLoggedIn(true);
      } catch (error) {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [pathname, isMounted]);

  if (pathname === "/login") {
    return null;
  }

  const navLinks = [
    { href: "/dashboard", label: "Home" },
    { href: "/stocks", label: "전체 종목" },
    { href: "/news", label: "뉴스" },
    { href: "/community", label: "커뮤니티" },
    { href: "/my-page", label: "내 정보" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    // 쿠키에서도 토큰 제거
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setIsLoggedIn(false);
    setUser(null);
    router.push("/login");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  // 초기 마운트 전에는 로딩 UI를 보여줌
  if (!isMounted) {
    return (
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="w-20 h-9 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    // 로그인이 필요한 페이지들 체크
    const protectedPages = ["/dashboard", "/news", "/community", "/my-page"];
    
    if (protectedPages.includes(href) && !isLoggedIn) {
      e.preventDefault();
      router.push("/login");
    }
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
                onClick={(e) => handleNavClick(link.href, e)}
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
