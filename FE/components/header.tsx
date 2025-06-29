"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "./ui/button";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

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
    // In a real app, you'd clear auth tokens here
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
            <span className="text-base font-medium">User1님</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
