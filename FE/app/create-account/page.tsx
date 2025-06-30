// "use client"

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { createAccount } from "@/api/account"

// interface CreateAccountModalProps {
//   isOpen: boolean
//   onClose: () => void
//   onSuccess: () => void
// }

// export default function CreateAccountModal({ isOpen, onClose, onSuccess }: CreateAccountModalProps) {
//   const [bankName, setBankName] = useState("")
//   const [accountNumber, setAccountNumber] = useState("")

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!bankName || !accountNumber) return

//     try {
//       await createAccount({ bankName, accountNumber })
//       onSuccess()
//       onClose()
//     } catch (error) {
//       alert("계좌 생성에 실패했습니다.")
//     }
//   }

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>계좌 생성</DialogTitle>
//         </DialogHeader>
//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div className="space-y-2">
//             <Label htmlFor="bank">은행 선택</Label>
//             <Select onValueChange={setBankName}>
//               <SelectTrigger>
//                 <SelectValue placeholder="은행을 선택하세요" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="하나은행">하나은행</SelectItem>
//                 <SelectItem value="신한은행">신한은행</SelectItem>
//                 <SelectItem value="우리은행">우리은행</SelectItem>
//                 <SelectItem value="KB국민은행">KB국민은행</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//           <div className="space-y-2">
//             <Label htmlFor="accountNumber">계좌 번호</Label>
//             <Input
//               id="accountNumber"
//               value={accountNumber}
//               onChange={(e) => setAccountNumber(e.target.value)}
//               placeholder="숫자만 입력"
//               required
//             />
//           </div>
//           <Button type="submit" className="w-full h-12 text-lg">
//             계좌 생성하기
//           </Button>
//         </form>
//       </DialogContent>
//     </Dialog>
//   )
// }
