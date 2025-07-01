"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>계좌 생성</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="bankName">은행명</Label>
            <Input
              id="bankName"
              value={bankName}
              readOnly
              className="bg-gray-50 cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountNumber">계좌 번호</Label>
            <Input
              id="accountNumber"
              value={accountNumber}
              readOnly
              className="bg-gray-50 cursor-not-allowed"
            />
          </div>
          <Button type="submit" className="w-full h-12 text-lg">
            계좌 생성하기
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
