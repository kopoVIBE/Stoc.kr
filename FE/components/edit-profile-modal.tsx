"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, User, Phone, Lock } from "lucide-react"
import { updateUserName, updateUserPhone, updateUserPassword } from "@/api/user"

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userInfo: any
}

export default function EditProfileModal({ isOpen, onClose, onSuccess, userInfo }: EditProfileModalProps) {
  const [activeTab, setActiveTab] = useState("name")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // 이름 수정 폼
  const [nameForm, setNameForm] = useState({ name: "" })
  const [nameErrors, setNameErrors] = useState<{ [key: string]: string }>({})

  // 전화번호 수정 폼
  const [phoneForm, setPhoneForm] = useState({ phone: "" })
  const [phoneErrors, setPhoneErrors] = useState<{ [key: string]: string }>({})
  const [phoneValid, setPhoneValid] = useState(false)

  // 비밀번호 수정 폼
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({})
  const [passwordValid, setPasswordValid] = useState({ new: false, confirm: false })

  // 모달이 열릴 때 기존 정보로 초기화
  useEffect(() => {
    if (isOpen && userInfo) {
      setNameForm({ name: userInfo.name || "" })
      setPhoneForm({ phone: userInfo.phone || "" })
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setNameErrors({})
      setPhoneErrors({})
      setPasswordErrors({})
      setPhoneValid(true) // 기존 번호는 유효하다고 가정
      setPasswordValid({ new: false, confirm: false })
    }
  }, [isOpen, userInfo])

  // 전화번호 유효성 검사
  useEffect(() => {
    const phone = phoneForm.phone
    const errs: { [key: string]: string } = {}

    if (phone && !phone.match(/^010-\d{4}-\d{4}$/)) {
      errs.phone = "전화번호 형식이 일치하지 않습니다."
      setPhoneValid(false)
    } else if (phone) {
      setPhoneValid(true)
    }

    setPhoneErrors(errs)
  }, [phoneForm.phone])

  // 비밀번호 유효성 검사
  useEffect(() => {
    const { newPassword, confirmPassword } = passwordForm
    const errs: { [key: string]: string } = {}
    const valids = { new: false, confirm: false }

    // 새 비밀번호 형식 검사
    if (newPassword) {
      if (!newPassword.match(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,20}$/)) {
        errs.newPassword = "비밀번호는 8~20자, 영문/숫자/특수문자를 포함해야 합니다."
        valids.new = false
      } else {
        valids.new = true
      }
    }

    // 비밀번호 확인
    if (confirmPassword) {
      if (newPassword !== confirmPassword) {
        errs.confirmPassword = "비밀번호가 일치하지 않습니다."
        valids.confirm = false
      } else if (valids.new) {
        valids.confirm = true
      }
    }

    setPasswordErrors(errs)
    setPasswordValid(valids)
  }, [passwordForm.newPassword, passwordForm.confirmPassword])

  // 전화번호 자동 하이픈 추가
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const phoneNumber = value.replace(/[^\d]/g, '')
    let formattedPhone = ''
    
    if (phoneNumber.length <= 3) {
      formattedPhone = phoneNumber
    } else if (phoneNumber.length <= 7) {
      formattedPhone = `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`
    } else if (phoneNumber.length <= 11) {
      formattedPhone = `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7)}`
    } else {
      return // 11자리 초과시 무시
    }
    
    setPhoneForm({ phone: formattedPhone })
  }

  // 이름 수정 제출
  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameForm.name.trim()) {
      setNameErrors({ name: "이름을 입력해주세요." })
      return
    }

    try {
      await updateUserName(nameForm.name.trim())
      alert("이름이 수정되었습니다.")
      onSuccess()
      onClose()
    } catch (error: any) {
      alert(error.message || "이름 수정에 실패했습니다.")
    }
  }

  // 전화번호 수정 제출
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneValid || Object.keys(phoneErrors).length > 0) {
      return
    }

    try {
      await updateUserPhone(phoneForm.phone)
      alert("전화번호가 수정되었습니다.")
      onSuccess()
      onClose()
    } catch (error: any) {
      alert(error.message || "전화번호 수정에 실패했습니다.")
    }
  }

  // 비밀번호 수정 제출
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordForm.currentPassword || !passwordValid.new || !passwordValid.confirm) {
      if (!passwordForm.currentPassword) {
        setPasswordErrors(prev => ({ ...prev, currentPassword: "현재 비밀번호를 입력해주세요." }))
      }
      return
    }

    try {
      await updateUserPassword(passwordForm.currentPassword, passwordForm.newPassword)
      alert("비밀번호가 수정되었습니다.")
      onSuccess()
      onClose()
    } catch (error: any) {
      alert(error.message || "비밀번호 수정에 실패했습니다.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>내 정보 수정</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="name">이름</TabsTrigger>
            <TabsTrigger value="phone">전화번호</TabsTrigger>
            <TabsTrigger value="password">비밀번호</TabsTrigger>
          </TabsList>

          {/* 이름 수정 탭 */}
          <TabsContent value="name" className="space-y-4">
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <div className="relative">
                  <Input
                    id="name"
                    value={nameForm.name}
                    onChange={(e) => setNameForm({ name: e.target.value })}
                    placeholder="이름을 입력하세요"
                    className="pl-10"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
                {nameErrors.name && <p className="text-xs text-red-500">{nameErrors.name}</p>}
              </div>
              <Button type="submit" className="w-full">
                이름 수정
              </Button>
            </form>
          </TabsContent>

          {/* 전화번호 수정 탭 */}
          <TabsContent value="phone" className="space-y-4">
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">전화번호</Label>
                <div className="relative">
                  <Input
                    id="phone"
                    value={phoneForm.phone}
                    onChange={handlePhoneChange}
                    placeholder="010-0000-0000"
                    maxLength={13}
                    className="pl-10"
                  />
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
                {phoneForm.phone && (phoneValid ? 
                  <p className="text-xs text-green-500">형식이 일치합니다.</p> : 
                  <p className="text-xs text-red-500">{phoneErrors.phone}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={!phoneValid}>
                전화번호 수정
              </Button>
            </form>
          </TabsContent>

          {/* 비밀번호 수정 탭 */}
          <TabsContent value="password" className="space-y-4">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* 현재 비밀번호 */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">현재 비밀번호</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="현재 비밀번호를 입력하세요"
                    className="pl-10 pr-10"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <div 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer" 
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
                {passwordErrors.currentPassword && <p className="text-xs text-red-500">{passwordErrors.currentPassword}</p>}
              </div>

              {/* 새 비밀번호 */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">새 비밀번호</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="새 비밀번호를 입력하세요"
                    className="pl-10 pr-10"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <div 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer" 
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
                {!passwordForm.newPassword && <p className="text-xs text-gray-500">8~20자, 영문+숫자+특수문자를 포함해야 합니다.</p>}
                {passwordForm.newPassword && (passwordValid.new ? 
                  <p className="text-xs text-green-500">형식이 일치합니다.</p> : 
                  <p className="text-xs text-red-500">{passwordErrors.newPassword}</p>
                )}
              </div>

              {/* 새 비밀번호 확인 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="새 비밀번호를 다시 입력하세요"
                    className="pl-10 pr-10"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <div 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
                {passwordForm.confirmPassword && (passwordValid.confirm ? 
                  <p className="text-xs text-green-500">비밀번호가 일치합니다.</p> : 
                  <p className="text-xs text-red-500">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={!passwordForm.currentPassword || !passwordValid.new || !passwordValid.confirm}
              >
                비밀번호 수정
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}