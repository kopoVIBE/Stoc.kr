"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/header";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/create-account";

  return (
    <div className="flex flex-col min-h-screen">
      {!isAuthPage && <Header />}
      <main
        className={`flex-grow ${
          !isAuthPage ? "container mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""
        }`}
      >
        {children}
      </main>
    </div>
  );
}
