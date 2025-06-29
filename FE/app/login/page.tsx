"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you'd handle authentication here
    router.push("/")
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Image src="/stockr_green.png" alt="Stoc.kr logo" width={60} height={60} />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-700">Stoc.kr {isLogin ? "로그인" : "회원가입"}</CardTitle>
        </CardHeader>
        <CardContent>
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
              <label htmlFor="password" className="text-sm font-medium text-gray-600">
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
                <label htmlFor="confirm-password" className="text-sm font-medium text-gray-600">
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

            <Button type="submit" className="w-full h-12 text-base bg-primary hover:bg-primary/90">
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
        </CardContent>
      </Card>
    </div>
  )
}
