"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Eye, 
  EyeOff, 
  User, 
  Phone, 
  Lock, 
  Edit3, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Smartphone,
  UserCheck,
  Key
} from "lucide-react"
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
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-white to-gray-50 border-0 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 -m-6 mb-6 rounded-t-lg border-b border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-800">내 정보 수정</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">개인정보를 안전하게 업데이트하세요</p>
            </div>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger 
              value="name" 
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white flex items-center gap-2 rounded-lg transition-all duration-200"
            >
              <UserCheck className="w-4 h-4" />
              이름
            </TabsTrigger>
            <TabsTrigger 
              value="phone"
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white flex items-center gap-2 rounded-lg transition-all duration-200"
            >
              <Smartphone className="w-4 h-4" />
              전화번호
            </TabsTrigger>
            <TabsTrigger 
              value="password"
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white flex items-center gap-2 rounded-lg transition-all duration-200"
            >
              <Shield className="w-4 h-4" />
              비밀번호
            </TabsTrigger>
          </TabsList>

          {/* 이름 수정 탭 */}
          <TabsContent value="name" className="space-y-6 mt-6">
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-800">이름 변경</h3>
              </div>
              <p className="text-sm text-gray-600">회원님의 이름을 변경하실 수 있습니다.</p>
            </div>

            <form onSubmit={handleNameSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  새로운 이름
                </Label>
                <div className="relative">
                  <Input
                    id="name"
                    value={nameForm.name}
                    onChange={(e) => setNameForm({ name: e.target.value })}
                    placeholder="이름을 입력하세요"
                    className="pl-12 h-12 border-2 border-gray-200 focus:border-emerald-500 rounded-xl transition-all duration-200"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <User className="text-gray-400" size={18} />
                  </div>
                </div>
                {nameErrors.name ? (
                  <div className="flex items-center gap-2 text-xs text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    {nameErrors.name}
                  </div>
                ) : nameForm.name.trim() && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <CheckCircle className="w-4 h-4" />
                    유효한 이름입니다
                  </div>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 transform transition-all duration-200 hover:scale-[1.02] shadow-lg rounded-xl text-base font-semibold"
              >
                <UserCheck className="w-5 h-5 mr-2" />
                이름 수정
              </Button>
            </form>
          </TabsContent>

          {/* 전화번호 수정 탭 */}
          <TabsContent value="phone" className="space-y-6 mt-6">
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-800">전화번호 변경</h3>
              </div>
              <p className="text-sm text-gray-600">010-XXXX-XXXX 형식으로 입력해주세요.</p>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  새로운 전화번호
                </Label>
                <div className="relative">
                  <Input
                    id="phone"
                    value={phoneForm.phone}
                    onChange={handlePhoneChange}
                    placeholder="010-0000-0000"
                    maxLength={13}
                    className="pl-12 h-12 border-2 border-gray-200 focus:border-emerald-500 rounded-xl transition-all duration-200"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Phone className="text-gray-400" size={18} />
                  </div>
                </div>
                {phoneForm.phone && (phoneValid ? 
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <CheckCircle className="w-4 h-4" />
                    형식이 일치합니다
                  </div> : 
                  <div className="flex items-center gap-2 text-xs text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    {phoneErrors.phone}
                  </div>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 transform transition-all duration-200 hover:scale-[1.02] shadow-lg rounded-xl text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={!phoneValid}
              >
                <Smartphone className="w-5 h-5 mr-2" />
                전화번호 수정
              </Button>
            </form>
          </TabsContent>

          {/* 비밀번호 수정 탭 */}
          <TabsContent value="password" className="space-y-6 mt-6">
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-800">비밀번호 변경</h3>
              </div>
              <p className="text-sm text-gray-600">보안을 위해 현재 비밀번호를 먼저 확인합니다.</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              {/* 현재 비밀번호 */}
              <div className="space-y-3">
                <Label htmlFor="currentPassword" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  현재 비밀번호
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="현재 비밀번호를 입력하세요"
                    className="pl-12 pr-12 h-12 border-2 border-gray-200 focus:border-emerald-500 rounded-xl transition-all duration-200"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Lock className="text-gray-400" size={18} />
                  </div>
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <div className="flex items-center gap-2 text-xs text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    {passwordErrors.currentPassword}
                  </div>
                )}
              </div>

              {/* 새 비밀번호 */}
              <div className="space-y-3">
                <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  새 비밀번호
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="새 비밀번호를 입력하세요"
                    className="pl-12 pr-12 h-12 border-2 border-gray-200 focus:border-emerald-500 rounded-xl transition-all duration-200"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Lock className="text-gray-400" size={18} />
                  </div>
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {!passwordForm.newPassword ? (
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    8~20자, 영문+숫자+특수문자를 포함해야 합니다
                  </p>
                ) : passwordValid.new ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <CheckCircle className="w-4 h-4" />
                    안전한 비밀번호입니다
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    {passwordErrors.newPassword}
                  </div>
                )}
              </div>

              {/* 새 비밀번호 확인 */}
              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  새 비밀번호 확인
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="새 비밀번호를 다시 입력하세요"
                    className="pl-12 pr-12 h-12 border-2 border-gray-200 focus:border-emerald-500 rounded-xl transition-all duration-200"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Lock className="text-gray-400" size={18} />
                  </div>
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordForm.confirmPassword && (passwordValid.confirm ? 
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <CheckCircle className="w-4 h-4" />
                    비밀번호가 일치합니다
                  </div> : 
                  <div className="flex items-center gap-2 text-xs text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    {passwordErrors.confirmPassword}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 transform transition-all duration-200 hover:scale-[1.02] shadow-lg rounded-xl text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!passwordForm.currentPassword || !passwordValid.new || !passwordValid.confirm}
              >
                <Shield className="w-5 h-5 mr-2" />
                비밀번호 수정
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}