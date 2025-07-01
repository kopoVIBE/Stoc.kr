"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Building2, CreditCard, Sparkles, CheckCircle } from "lucide-react"
import { createAccount } from "@/api/account"

interface CreateAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateAccountModal({ isOpen, onClose, onSuccess }: CreateAccountModalProps) {
  const bankName = "스톡 증권" // 고정값
  
  // 계좌번호 자동 생성 (218-XXXXXXXX-XX 형식)
  const generateAccountNumber = () => {
    const middleDigits = Math.floor(Math.random() * 100000000).toString().padStart(8, '0') // 8자리 랜덤
    const lastDigits = Math.floor(Math.random() * 100).toString().padStart(2, '0') // 2자리 랜덤
    return `218-${middleDigits}-${lastDigits}`
  }

  const [accountNumber] = useState(() => generateAccountNumber())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createAccount({ bankName, accountNumber })
      onSuccess()
      onClose()
    } catch (error) {
      alert("계좌 생성에 실패했습니다.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center pb-6">
          <div className="mx-auto mb-4 flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            새 계좌 생성
          </DialogTitle>
          <p className="text-gray-600 text-sm mt-2">
            투자를 위한 전용 계좌를 생성합니다
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 은행명 */}
          <div className="space-y-3">
            <Label htmlFor="bankName" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              은행명
            </Label>
            <div className="relative">
              <Input
                id="bankName"
                value={bankName}
                readOnly
                className="h-12 pl-12 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 text-gray-700 font-medium cursor-default select-none rounded-xl transition-all duration-200"
              />
              <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-600" size={18} />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              </div>
            </div>
          </div>

          {/* 계좌번호 */}
          <div className="space-y-3">
            <Label htmlFor="accountNumber" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              계좌번호
            </Label>
            <div className="relative">
              <Input
                id="accountNumber"
                value={accountNumber}
                readOnly
                className="h-12 pl-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-gray-700 font-medium cursor-default select-none rounded-xl transition-all duration-200"
              />
              <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600" size={18} />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              </div>
            </div>
        
          </div>

          {/* 제출 버튼 */}
          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              계좌 생성하기
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
