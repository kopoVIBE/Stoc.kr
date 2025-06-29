"use client";

import type React from "react";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd handle authentication here
    router.push("/");
  };

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden">
      <div
        className="flex items-center justify-center w-[1400px] h-[1400px] bg-gradient-to-br from-[#248D5D19] to-[#248E5D50] rounded-full absolute z-0 top-1/2 left-1/2 
              -translate-x-1/2 -translate-y-1/2"
      >
        <div className="w-[700px] h-[700px] bg-white rounded-full absolute z-5"></div>
      </div>
      <div className="w-[200px] h-[400px] bg-white absolute z-5 -bottom-1/4 right-1/4 -rotate-45"></div>
      <div className="w-full max-w-sm absolute z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <Image
              src="/stockr_green.svg"
              alt="Stoc.kr logo"
              width={60}
              height={60}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-700">
            Stoc.kr {isLogin ? "로그인" : "회원가입"}
          </h1>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-2">
              <label htmlFor="id" className="text-sm font-medium text-gray-600">
                아이디
              </label>
              <Input
                id="id"
                placeholder="아이디를 입력하세요."
                className="h-12 text-sm focus:border-primary focus:shadow-[0_0_4px_#248E5D]"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-600"
              >
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요."
                className="h-12 text-sm focus:border-primary focus:shadow-[0_0_4px_#248E5D]"
              />
            </div>
            {!isLogin && (
              <div className="space-y-2">
                <label
                  htmlFor="confirm-password"
                  className="text-sm font-medium text-gray-600"
                >
                  비밀번호 확인
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요."
                  className="h-12 text-sm focus:border-primary focus:shadow-[0_0_4px_#248E5D]"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base bg-primary hover:bg-primary/90"
            >
              {isLogin ? "로그인" : "회원가입"}
            </Button>

            <p className="text-center text-sm text-gray-600">
              {isLogin ? "아직 회원이 아니신가요?" : "이미 계정이 있으신가요?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-semibold text-primary hover:underline"
              >
                {isLogin ? "회원가입" : "로그인"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
