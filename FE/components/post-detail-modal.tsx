"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThumbsUp, MessageSquare, Send, Edit2, Trash2, Save, X } from "lucide-react"
import { 
  PostResponse, 
  CommentResponse, 
  createComment, 
  getCommentsByPost, 
  updateComment, 
  deleteComment, 
  togglePostLike,
  updatePost,
  deletePost,
  getUserFavoriteStocks,
  CommentCreateRequest,
  PostCreateRequest,
  FavoriteStock
} from "@/api/community"
import { getMyInfo } from "@/api/user"
import { formatTimeAgo } from "@/lib/utils"
import { toast } from "sonner"

interface PostDetailModalProps {
  post: PostResponse | null
  isOpen: boolean
  onClose: () => void
  onPostUpdate: (updatedPost: PostResponse) => void
  onPostDelete?: () => void
}

export default function PostDetailModal({ post, isOpen, onClose, onPostUpdate, onPostDelete }: PostDetailModalProps) {
  const [comments, setComments] = useState<CommentResponse[]>([])
  const [newComment, setNewComment] = useState("")
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingCommentText, setEditingCommentText] = useState("")
  const [loading, setLoading] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [userNickname, setUserNickname] = useState<string | null>(null)
  
  // 게시글 수정 관련 상태
  const [isEditingPost, setIsEditingPost] = useState(false)
  const [editingTitle, setEditingTitle] = useState("")
  const [editingContent, setEditingContent] = useState("")
  const [editingStockCode, setEditingStockCode] = useState("")
  const [favoriteStocks, setFavoriteStocks] = useState<FavoriteStock[]>([])

  useEffect(() => {
    if (isOpen && post) {
      fetchComments()
      fetchUserInfo()
    }
  }, [isOpen, post])

  const fetchUserInfo = async () => {
    try {
      const [userInfo, stocks] = await Promise.all([
        getMyInfo(),
        getUserFavoriteStocks().catch(() => [])
      ])
      setUserNickname(userInfo?.nickname || null)
      setFavoriteStocks(stocks)
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error)
    }
  }

  const fetchComments = async () => {
    if (!post) return
    try {
      const data = await getCommentsByPost(post.id)
      setComments(data)
    } catch (error) {
      console.error("댓글 조회 실패:", error)
    }
  }

  const handleCreateComment = async () => {
    if (!post || !newComment.trim()) return
    
    if (!userNickname) {
      toast.error("댓글 작성을 위해 닉네임을 먼저 설정해주세요.")
      return
    }

    setLoading(true)
    try {
      const commentData: CommentCreateRequest = {
        content: newComment.trim()
      }
      
      await createComment(post.id, commentData)
      setNewComment("")
      fetchComments()
      
      // 메인 페이지의 댓글 개수도 업데이트
      const updatedPost = {
        ...post,
        commentCount: post.commentCount + 1
      }
      onPostUpdate(updatedPost)
      
      toast.success("댓글이 작성되었습니다.")
    } catch (error: any) {
      console.error("댓글 작성 실패:", error)
      toast.error(error.response?.data?.message || "댓글 작성에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateComment = async (commentId: number) => {
    if (!editingCommentText.trim()) return

    setLoading(true)
    try {
      const commentData: CommentCreateRequest = {
        content: editingCommentText.trim()
      }
      
      await updateComment(commentId, commentData)
      setEditingCommentId(null)
      setEditingCommentText("")
      fetchComments()
      toast.success("댓글이 수정되었습니다.")
    } catch (error: any) {
      console.error("댓글 수정 실패:", error)
      toast.error(error.response?.data?.message || "댓글 수정에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return
    if (!post) return

    setLoading(true)
    try {
      await deleteComment(commentId)
      fetchComments()
      
      // 메인 페이지의 댓글 개수도 업데이트
      const updatedPost = {
        ...post,
        commentCount: post.commentCount - 1
      }
      onPostUpdate(updatedPost)
      
      toast.success("댓글이 삭제되었습니다.")
    } catch (error: any) {
      console.error("댓글 삭제 실패:", error)
      toast.error(error.response?.data?.message || "댓글 삭제에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handlePostLike = async () => {
    if (!post) return
    
    console.log("좋아요 처리 시작 - postId:", post.id, "현재 상태:", post.isLikedByUser)
    
    setLikeLoading(true)
    try {
      const serverResponse = await togglePostLike(post.id)
      console.log("서버 응답:", serverResponse)
      
      // 서버 응답으로만 상태 업데이트
      onPostUpdate(serverResponse)
    } catch (error) {
      console.error("좋아요 처리 실패:", error)
      toast.error("좋아요 처리에 실패했습니다.")
    } finally {
      setLikeLoading(false)
    }
  }

  const handleStartEditPost = () => {
    if (!post) return
    setEditingTitle(post.title)
    setEditingContent(post.content)
    setEditingStockCode(post.stockCode)
    setIsEditingPost(true)
  }

  const handleSavePost = async () => {
    if (!post || !editingTitle.trim() || !editingContent.trim() || !editingStockCode) return
    
    setLoading(true)
    try {
      const selectedStock = favoriteStocks.find(s => s.code === editingStockCode)
      const updateData: PostCreateRequest = {
        title: editingTitle.trim(),
        content: editingContent.trim(),
        stockCode: editingStockCode,
        stockName: selectedStock?.name || ""
      }
      
      const updatedPost = await updatePost(post.id, updateData)
      onPostUpdate(updatedPost)
      setIsEditingPost(false)
      toast.success("게시글이 수정되었습니다.")
    } catch (error: any) {
      console.error("게시글 수정 실패:", error)
      toast.error(error.response?.data?.message || "게시글 수정에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEditPost = () => {
    setIsEditingPost(false)
    setEditingTitle("")
    setEditingContent("")
    setEditingStockCode("")
  }

  const handleDeletePost = async () => {
    if (!post) return
    
    if (!confirm("정말 삭제하시겠습니까?")) return
    
    setLoading(true)
    try {
      await deletePost(post.id)
      toast.success("게시글이 삭제되었습니다.")
      onPostDelete?.()
      handleClose()
    } catch (error: any) {
      console.error("게시글 삭제 실패:", error)
      toast.error(error.response?.data?.message || "게시글 삭제에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setComments([])
    setNewComment("")
    setEditingCommentId(null)
    setEditingCommentText("")
    setIsEditingPost(false)
    setEditingTitle("")
    setEditingContent("")
    setEditingStockCode("")
    onClose()
  }

  const startEditing = (comment: CommentResponse) => {
    setEditingCommentId(comment.id)
    setEditingCommentText(comment.content)
  }

  const cancelEditing = () => {
    setEditingCommentId(null)
    setEditingCommentText("")
  }

  if (!post) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">게시글 상세</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 게시글 내용 */}
          <div className="space-y-4">
            {isEditingPost ? (
              /* 수정 모드 */
              <div className="space-y-4">
                {/* 종목 선택 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">관련 종목</label>
                  <Select value={editingStockCode} onValueChange={setEditingStockCode}>
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
                </div>
                
                {/* 제목 입력 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">제목</label>
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    placeholder="제목을 입력하세요"
                    maxLength={200}
                  />
                </div>
                
                {/* 내용 입력 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">내용</label>
                  <Textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    placeholder="내용을 입력하세요"
                    rows={8}
                    className="resize-none"
                  />
                </div>
                
                {/* 수정 버튼 */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSavePost}
                    disabled={loading || !editingTitle.trim() || !editingContent.trim() || !editingStockCode}
                    className="bg-[#248f5b] hover:bg-[#248f5b]/90"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "저장 중..." : "저장"}
                  </Button>
                  <Button
                    onClick={handleCancelEditPost}
                    variant="outline"
                    disabled={loading}
                  >
                    <X className="w-4 h-4 mr-2" />
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              /* 조회 모드 */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {post.stockName && (
                      <Badge variant="outline" className="border-[#248f5b] text-[#248f5b]">
                        {post.stockName}
                      </Badge>
                    )}
                  </div>
                  {userNickname === post.authorNickname && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStartEditPost}
                        disabled={loading}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeletePost}
                        disabled={loading}
                        className="text-red-500 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        삭제
                      </Button>
                    </div>
                  )}
                </div>
                
                <h2 className="text-2xl font-bold">{post.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{post.authorNickname}</span>
                  <span>·</span>
                  <span>{formatTimeAgo(post.createdAt)}</span>
                </div>
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
                
                {/* 좋아요 및 댓글 버튼 */}
                <div className="flex gap-4 pt-4">
                  <button 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      post.isLikedByUser 
                        ? 'bg-red-500 text-white hover:bg-gray-100 hover:text-gray-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
                    }`}
                    onClick={handlePostLike}
                    disabled={likeLoading}
                  >
                    <ThumbsUp className={`w-5 h-5 ${post.isLikedByUser ? 'fill-current' : ''}`} />
                    <span>{post.likes}</span>
                  </button>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600">
                    <MessageSquare className="w-5 h-5" />
                    <span>{post.commentCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* 댓글 작성 */}
          <div className="space-y-4">
            <h3 className="font-semibold">댓글 작성</h3>
            {userNickname ? (
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  className="flex-1"
                  rows={3}
                />
                <Button
                  onClick={handleCreateComment}
                  disabled={loading || !newComment.trim()}
                  className="bg-[#248f5b] hover:bg-[#248f5b]/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">댓글을 작성하려면 닉네임을 먼저 설정해주세요.</p>
            )}
          </div>

          {/* 댓글 목록 */}
          <div className="space-y-4">
            <h3 className="font-semibold">댓글 {post.commentCount}개</h3>
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">아직 댓글이 없습니다.</p>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium">{comment.authorNickname}</span>
                        <span>·</span>
                        <span>{formatTimeAgo(comment.createdAt)}</span>
                      </div>
                      {userNickname === comment.authorNickname && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(comment)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {editingCommentId === comment.id ? (
                      <div className="flex gap-2">
                        <Textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className="flex-1"
                          rows={2}
                        />
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateComment(comment.id)}
                            disabled={loading || !editingCommentText.trim()}
                            className="bg-[#248f5b] hover:bg-[#248f5b]/90"
                          >
                            저장
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                          >
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm">{comment.content}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 