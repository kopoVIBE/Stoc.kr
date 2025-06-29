"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info, ChevronRight } from "lucide-react"
import InvestmentSurvey from "@/components/investment-survey"
import { useRouter, useSearchParams } from "next/navigation"
import DepositModal from "@/components/deposit-modal"
import WithdrawModal from "@/components/withdraw-modal"

export default function MyPage() {
  const [isAccountLinked, setIsAccountLinked] = useState(false)
  const [isSurveyOpen, setIsSurveyOpen] = useState(false)
  const [isDepositOpen, setIsDepositOpen] = useState(false)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("account_linked") === "true") {
      setIsAccountLinked(true)
    }
  }, [searchParams])

  if (!isAccountLinked) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full pt-16">
        <p className="text-gray-500">아직 연결된 계좌가 없어요.</p>
        <h1 className="text-3xl font-bold mt-2 mb-8">지금 계좌를 생성할까요?</h1>
        <Image src="/noAccount-image.png" alt="Create Account Illustration" width={250} height={250} />
        <Button className="mt-8 h-12 px-8 text-lg" onClick={() => router.push("/create-account")}>
          계좌 만들기
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold">내 정보</h1>
          <Button variant="link" className="text-gray-500">
            정보 수정
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-3">
              {[
                { label: "이름", value: "홍길동" },
                { label: "휴대폰 번호", value: "010-1234-5678" },
                { label: "이메일 주소", value: "abc123@naver.com" },
                { label: "집 주소", value: "서울특별시 OO동" },
              ].map((item) => (
                <div key={item.label} className="flex">
                  <span className="w-28 text-gray-500">{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
              <div className="flex items-center">
                <span className="w-28 text-gray-500">투자자 성향</span>
                <Button
                  variant="link"
                  className="p-0 h-auto font-semibold text-primary"
                  onClick={() => setIsSurveyOpen(true)}
                >
                  적극투자형 <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gray-50">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 flex items-center gap-1">
                    스톡증권 111-111111-111 <Info size={14} />
                  </p>
                  <p className="text-3xl font-bold mt-1">0원</p>
                  <p className="text-sm text-gray-500">지난주보다 0원 (0%)</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setIsDepositOpen(true)}>
                    채우기
                  </Button>
                  <Button variant="secondary" onClick={() => setIsWithdrawOpen(true)}>
                    보내기
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>주문 가능 금액</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0원</p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                0원 출금가능 <Info size={14} />
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <InvestmentSurvey isOpen={isSurveyOpen} onClose={() => setIsSurveyOpen(false)} />
      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
      <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} />
    </>
  )
}
