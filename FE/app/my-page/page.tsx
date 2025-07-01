"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Info, 
  ChevronRight, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  UserCheck, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard,
  Banknote,
  Settings
} from "lucide-react"
import InvestmentSurvey from "@/components/investment-survey"
import { useSearchParams } from "next/navigation"
import DepositModal from "@/components/deposit-modal"
import WithdrawModal from "@/components/withdraw-modal"
import CreateAccountModal from "@/components/create-account-modal"
import EditProfileModal from "@/components/edit-profile-modal"
import { getAccount } from "@/api/account"
import { getMyInfo } from "@/api/user" 

export default function MyPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAccountLinked, setIsAccountLinked] = useState(false)
  const [accountInfo, setAccountInfo] = useState<any>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [isSurveyOpen, setIsSurveyOpen] = useState(false)
  const [isDepositOpen, setIsDepositOpen] = useState(false)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const searchParams = useSearchParams()

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [accountData, userData] = await Promise.all([
        getAccount(),
        getMyInfo()
      ])

      if (accountData) {
        setAccountInfo(accountData)
        setIsAccountLinked(true)
      } else {
        setIsAccountLinked(false)
      }

      setUserInfo(userData)
    } catch {
      setIsAccountLinked(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500">불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!isAccountLinked) {
    return (
      <>
        <div className="flex flex-col items-center justify-center text-center h-full pt-16">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-500">아직 연결된 계좌가 없어요.</p>
          <h1 className="text-3xl font-bold mt-2 mb-8 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            지금 계좌를 생성할까요?
          </h1>
          <Image src="/noAccount-image.png" alt="Create Account Illustration" width={250} height={250} />
          <Button 
            className="mt-8 h-12 px-8 text-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 transform transition-all duration-200 hover:scale-105 shadow-lg"
            onClick={() => setIsCreateAccountOpen(true)}
          >
            계좌 만들기
          </Button>
        </div>
        <CreateAccountModal
          isOpen={isCreateAccountOpen}
          onClose={() => setIsCreateAccountOpen(false)}
          onSuccess={() => {
            setIsCreateAccountOpen(false)
            setIsLoading(true)
            fetchData()
          }}
        />
      </>
    )
  }

  const userInfoItems = [
    { label: "이름", value: userInfo?.name, icon: User },
    { label: "휴대폰 번호", value: userInfo?.phone, icon: Phone },
    { label: "이메일", value: userInfo?.email, icon: Mail },
    { label: "생년월일", value: userInfo?.birthDate, icon: Calendar },
    { label: "성별", value: userInfo?.gender, icon: UserCheck }
  ]

  return (
    <>
      <div className="space-y-8">
        {/* 헤더 섹션 */}
        <div className="flex justify-between items-center bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">내 정보</h1>
              <p className="text-sm text-gray-600">회원 정보와 계좌를 관리하세요</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200"
            onClick={() => setIsEditProfileOpen(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            정보 수정
          </Button>
        </div>

        {/* 사용자 정보 카드 */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              개인정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userInfoItems.map((item) => (
                <div key={item.label} className="flex items-center p-3 bg-white rounded-lg border border-gray-100 hover:border-emerald-200 transition-colors">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                    <item.icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <p className="font-semibold text-gray-800">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 투자자 성향 */}
            <div className="flex items-center p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200 mt-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center mr-4">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">투자자 성향</p>
                <Button
                  variant="link"
                  className="p-0 h-auto font-semibold text-emerald-700 hover:text-emerald-800 text-base"
                  onClick={() => setIsSurveyOpen(true)}
                >
                  {userInfo?.investmentStyle || "미설정"} 
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 계좌 정보 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 계좌 잔고 카드 */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-500 to-green-600 text-white overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-5 h-5" />
                  <p className="text-emerald-100 text-sm">{accountInfo?.bankName} {accountInfo?.accountNumber}</p>
                  <Info size={14} className="text-emerald-200" />
                </div>
                <div className="mb-4">
                  <p className="text-3xl font-bold mb-1">{accountInfo?.balance?.toLocaleString()}원</p>
                  <p className="text-emerald-100 text-sm flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    지난주보다 0원 (0%)
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="secondary" 
                    className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm flex-1"
                    onClick={() => setIsDepositOpen(true)}
                  >
                    <ArrowDownLeft className="w-4 h-4 mr-2" />
                    채우기
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm flex-1"
                    onClick={() => setIsWithdrawOpen(true)}
                  >
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    보내기
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 주문 가능 금액 카드 */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                주문 가능 금액
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                <p className="text-3xl font-bold text-gray-800 mb-2">
                  {accountInfo?.balance?.toLocaleString()}원
                </p>
                <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  {accountInfo?.balance?.toLocaleString()}원 출금가능
                  <Info size={14} className="text-gray-400" />
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-4 bg-white rounded-lg border border-gray-100">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-500">오늘 수익률</p>
                  <p className="font-semibold text-gray-800">+0%</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-gray-100">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Wallet className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-xs text-gray-500">총 투자금</p>
                  <p className="font-semibold text-gray-800">0원</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <InvestmentSurvey 
        isOpen={isSurveyOpen} 
        onClose={() => setIsSurveyOpen(false)}
        onSuccess={() => {
          fetchData();
        }}
      />
      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
      <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} />
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onSuccess={() => {
          setIsEditProfileOpen(false)
          fetchData()
        }}
        userInfo={userInfo}
      />
    </>
  )
}
