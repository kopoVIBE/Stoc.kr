"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

export default function CreateAccountPage() {
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Add account creation logic here
    alert("계좌가 생성되었습니다!")
    // Redirect to my-page with a query param to indicate success
    router.push("/my-page?account_linked=true")
  }

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">계좌 생성</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" placeholder="홍길동" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">휴대폰 번호</Label>
              <Input id="phone" type="tel" placeholder="010-1234-5678" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank">연결할 은행</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="은행을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kb">KB국민은행</SelectItem>
                  <SelectItem value="shinhan">신한은행</SelectItem>
                  <SelectItem value="woori">우리은행</SelectItem>
                  <SelectItem value="hana">하나은행</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">계좌번호</Label>
              <Input id="accountNumber" placeholder="'-' 없이 숫자만 입력" required />
            </div>
            <Button type="submit" className="w-full h-12 text-lg">
              계좌 생성하기
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
