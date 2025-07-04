"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ThumbsUp, MessageSquare, Send, Edit2, Trash2 } from "lucide-react"
import { 
  PostResponse, 
  CommentResponse, 
  createComment, 
  getCommentsByPost, 
  updateComment, 
  deleteComment, 
  togglePostLike,
  CommentCreateRequest
} from "@/api/community"
import { getMyInfo } from "@/api/user"
import { formatTimeAgo } from "@/lib/utils"
import { toast } from "sonner"

interface PostDetailModalProps {
  post: PostResponse | null
  isOpen: boolean
  onClose: () => void
  onPostUpdate: (updatedPost: PostResponse) => void
}

export default function PostDetailModal({ post, isOpen, onClose, onPostUpdate }: PostDetailModalProps) {
  const [comments, setComments] = useState<CommentResponse[]>([])
  const [newComment, setNewComment] = useState("")
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingCommentText, setEditingCommentText] = useState("")
  const [loading, setLoading] = useState(false)
  const [userNickname, setUserNickname] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && post) {
      fetchComments()
      fetchUserInfo()
    }
  }, [isOpen, post])

  const fetchUserInfo = async () => {
    try {
      const userInfo = await getMyInfo()
      setUserNickname(userInfo?.nickname || null)
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
    
    // 즉시 UI 업데이트 (낙관적 업데이트)
    const optimisticPost = {
      ...post,
      isLikedByUser: !post.isLikedByUser,
      likes: post.isLikedByUser ? post.likes - 1 : post.likes + 1
    }
    onPostUpdate(optimisticPost)
    
    try {
      await togglePostLike(post.id)
    } catch (error) {
      console.error("좋아요 처리 실패:", error)
      toast.error("좋아요 처리에 실패했습니다.")
      
      // 에러 시 원래 상태로 되돌리기
      onPostUpdate(post)
    }
  }

  const handleClose = () => {
    setComments([])
    setNewComment("")
    setEditingCommentId(null)
    setEditingCommentText("")
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
            {post.stockName && (
              <Badge variant="outline" className="w-fit border-[#248f5b] text-[#248f5b]">
                {post.stockName}
              </Badge>
            )}
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
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
                }`}
                onClick={handlePostLike}
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