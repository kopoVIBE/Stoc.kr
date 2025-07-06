"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createPost, getUserFavoriteStocks, PostCreateRequest, FavoriteStock } from "@/api/community"
import { getMyInfo } from "@/api/user"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface WritePostModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function WritePostModal({ isOpen, onClose, onSuccess }: WritePostModalProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [selectedStock, setSelectedStock] = useState<FavoriteStock | null>(null)
  const [favoriteStocks, setFavoriteStocks] = useState<FavoriteStock[]>([])
  const [loading, setLoading] = useState(false)
  const [userNickname, setUserNickname] = useState<string | null>(null)
  const [checkingUser, setCheckingUser] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      fetchInitialData()
    }
  }, [isOpen])

  const fetchInitialData = async () => {
    setCheckingUser(true)
    try {
      const [userInfo, stocks] = await Promise.all([
        getMyInfo(),
        getUserFavoriteStocks().catch(() => [])
      ])
      
      setUserNickname(userInfo?.nickname || null)
      setFavoriteStocks(stocks)
    } catch (error) {
      console.error("데이터 조회 실패:", error)
      toast.error("사용자 정보를 불러오지 못했습니다.")
    } finally {
      setCheckingUser(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      toast.error("제목과 내용을 모두 입력해주세요.")
      return
    }

    if (!selectedStock) {
      toast.error("관련 종목을 선택해주세요.")
      return
    }

    setLoading(true)
    try {
      const postData: PostCreateRequest = {
        title: title.trim(),
        content: content.trim(),
        stockCode: selectedStock?.code,
        stockName: selectedStock?.name,
      }

      await createPost(postData)
      toast.success("게시글이 작성되었습니다.")
      handleClose()
      onSuccess()
    } catch (error: any) {
      console.error("게시글 작성 실패:", error)
      
      // 닉네임 미설정 에러 처리
      if (error.response?.data?.message?.includes("닉네임을 먼저 설정")) {
        toast.error("커뮤니티 이용을 위해 닉네임을 먼저 설정해주세요.", {
          action: {
            label: "설정하러 가기",
            onClick: () => {
              handleClose()
              router.push("/my-page")
            }
          }
        })
        return
      }
      
      // 관심 종목 없음 에러 처리
      if (error.response?.data?.message?.includes("관심 종목을 먼저 추가")) {
        toast.error("커뮤니티 글 작성을 위해 관심 종목을 먼저 추가해주세요.", {
          action: {
            label: "종목 추가하러 가기",
            onClick: () => {
              handleClose()
              router.push("/stocks")
            }
          }
        })
        return
      }
      
      toast.error(error.response?.data?.message || "게시글 작성에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTitle("")
    setContent("")
    setSelectedStock(null)
    onClose()
  }

  const handleStockSelect = (stockCode: string) => {
    const stock = favoriteStocks.find(s => s.code === stockCode)
    setSelectedStock(stock || null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>새 글 작성</DialogTitle>
        </DialogHeader>
        
        {checkingUser ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#248f5b] mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">사용자 정보 확인 중...</p>
          </div>
        ) : !userNickname ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 mb-3">
              커뮤니티 이용을 위해 닉네임을 먼저 설정해주세요.
            </p>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleClose}
              >
                취소
              </Button>
              <Button 
                type="button" 
                size="sm"
                className="bg-[#248f5b] hover:bg-[#248f5b]/90"
                onClick={() => {
                  handleClose()
                  router.push("/my-page")
                }}
              >
                닉네임 설정하러 가기
              </Button>
            </div>
          </div>
        ) : favoriteStocks.length === 0 ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-3">
              커뮤니티 글 작성을 위해 관심 종목을 먼저 추가해주세요.
            </p>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleClose}
              >
                취소
              </Button>
              <Button 
                type="button" 
                size="sm"
                className="bg-[#248f5b] hover:bg-[#248f5b]/90"
                onClick={() => {
                  handleClose()
                  router.push("/stocks")
                }}
              >
                관심종목 추가하러 가기
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

                      {/* 종목 선택 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">관련 종목 *</label>
              <Select onValueChange={handleStockSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="종목을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {favoriteStocks.map((stock) => (
                    <SelectItem key={stock.code} value={stock.code}>
                      {stock.name} ({stock.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStock && (
                <Badge variant="outline" className="border-[#248f5b] text-[#248f5b]">
                  {selectedStock.name}
                </Badge>
              )}
              <p className="text-xs text-gray-500">
                관심 종목 중에서 이 글과 관련된 종목을 선택해주세요.
              </p>
            </div>

          {/* 제목 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">제목 *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              maxLength={200}
            />
            <p className="text-xs text-gray-500">{title.length}/200</p>
          </div>

          {/* 내용 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">내용 *</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={8}
              className="resize-none"
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim() || !content.trim() || !selectedStock}
              className="bg-[#248f5b] hover:bg-[#248f5b]/90"
            >
              {loading ? "작성 중..." : "작성하기"}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
} 