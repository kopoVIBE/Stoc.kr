"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, MessageSquare, ThumbsUp, Edit3, Plus } from "lucide-react"
import WritePostModal from "@/components/write-post-modal"
import PostDetailModal from "@/components/post-detail-modal"
import { getAllPosts, getPostsByStock, searchPosts, togglePostLike, getUserFavoriteStocks, getPostsByUserInterests, PostResponse, FavoriteStock } from "@/api/community"
import { getMyInfo } from "@/api/user"
import { formatTimeAgo } from "@/lib/utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function CommunityPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [posts, setPosts] = useState<PostResponse[]>([])
  const [favoriteStocks, setFavoriteStocks] = useState<FavoriteStock[]>([])
  const [loading, setLoading] = useState(true)
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<PostResponse | null>(null)
  const [isPostDetailModalOpen, setIsPostDetailModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      handleSearch()
    } else if (activeTag) {
      handleTagFilter(activeTag)
    } else {
      fetchPosts()
    }
  }, [searchTerm, activeTag])

  const fetchInitialData = async () => {
    try {
      const stocksData = await getUserFavoriteStocks().catch(() => [])
      setFavoriteStocks(stocksData)
      
      // 관심 종목이 있을 때만 게시글 조회
      if (stocksData.length > 0) {
        const postsData = await getPostsByUserInterests(0, 20)
        setPosts(postsData.content)
      } else {
        setPosts([])
      }
    } catch (error) {
      console.error("데이터 조회 실패:", error)
      toast.error("데이터를 불러오는데 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const fetchPosts = async () => {
    try {
      // 관심 종목이 있을 때만 게시글 조회
      if (favoriteStocks.length > 0) {
        const data = await getPostsByUserInterests(0, 20)
        setPosts(data.content)
      } else {
        setPosts([])
      }
    } catch (error) {
      console.error("게시글 조회 실패:", error)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchPosts()
      return
    }
    
    try {
      const data = await searchPosts(searchTerm, 0, 20)
      setPosts(data.content)
    } catch (error) {
      console.error("검색 실패:", error)
      toast.error("검색에 실패했습니다.")
    }
  }

  const handleTagFilter = async (stockCode: string) => {
    try {
      const data = await getPostsByStock(stockCode, 0, 20)
      setPosts(data.content)
    } catch (error) {
      console.error("종목별 게시글 조회 실패:", error)
      toast.error("게시글을 불러오는데 실패했습니다.")
    }
  }

  const handlePostLike = async (postId: number) => {
    // 즉시 UI 업데이트 (낙관적 업데이트)
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const updatedPost = {
          ...post,
          isLikedByUser: !post.isLikedByUser,
          likes: post.isLikedByUser ? post.likes - 1 : post.likes + 1
        }
        
        // 만약 현재 선택된 게시글이라면 selectedPost도 함께 업데이트
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(updatedPost)
        }
        
        return updatedPost
      }
      return post
    }))

    try {
      await togglePostLike(postId)
    } catch (error) {
      // 에러 시 원래 상태로 되돌리기
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          const revertedPost = {
            ...post,
            isLikedByUser: !post.isLikedByUser,
            likes: post.isLikedByUser ? post.likes - 1 : post.likes + 1
          }
          
          // selectedPost도 함께 되돌리기
          if (selectedPost && selectedPost.id === postId) {
            setSelectedPost(revertedPost)
          }
          
          return revertedPost
        }
        return post
      }))
      toast.error("좋아요 처리에 실패했습니다.")
    }
  }

  const handleWriteSuccess = () => {
    fetchPosts() // 글 작성 후 목록 새로고침
  }

  const handleWriteClick = async () => {
    // 닉네임 체크와 관계없이 모달을 열어서 모달 내에서 처리
    setIsWriteModalOpen(true)
  }

  const handlePostClick = (post: PostResponse) => {
    // 항상 최신 상태의 게시글을 찾아서 설정
    const latestPost = posts.find(p => p.id === post.id) || post
    setSelectedPost(latestPost)
    setIsPostDetailModalOpen(true)
  }

  const handlePostUpdate = (updatedPost: PostResponse) => {
    setPosts(prev => prev.map(post => 
      post.id === updatedPost.id ? updatedPost : post
    ))
    setSelectedPost(updatedPost)
  }

  const handlePostDelete = () => {
    // 삭제된 게시글을 목록에서 제거
    if (selectedPost) {
      setPosts(prev => prev.filter(post => post.id !== selectedPost.id))
      setSelectedPost(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-6 w-16" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-32" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-16" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold">커뮤니티</h1>
          <div className="flex gap-2">
            {favoriteStocks.length === 0 && (
              <Button 
                variant="outline"
                onClick={() => router.push("/stocks")}
                className="text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                관심종목 추가
              </Button>
            )}
            <Button 
              className="bg-[#248f5b] hover:bg-[#248f5b]/90"
              onClick={handleWriteClick}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              글쓰기
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="관심있는 내용을 검색해보세요."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={!activeTag ? "default" : "secondary"}
              onClick={() => setActiveTag(null)}
              className={`cursor-pointer ${!activeTag ? "bg-[#248f5b] text-white" : ""}`}
            >
              전체
            </Badge>
            {favoriteStocks.map((stock) => (
              <Badge
                key={stock.code}
                variant={activeTag === stock.code ? "default" : "secondary"}
                onClick={() => setActiveTag(stock.code)}
                className={`cursor-pointer ${activeTag === stock.code ? "bg-[#248f5b] text-white" : ""}`}
              >
                {stock.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {favoriteStocks.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="w-20 h-20 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
                <Plus className="w-10 h-10 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                커뮤니티 이용을 위해 관심 종목을 추가해주세요
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                관심 있는 종목을 추가하시면 해당 종목과 관련된 다른 투자자들의 글을 보고 소통할 수 있습니다.
              </p>
              <Button 
                onClick={() => router.push("/stocks")}
                className="bg-[#248f5b] hover:bg-[#248f5b]/90"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                관심 종목 추가하러 가기
              </Button>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>관심 종목과 관련된 글이 아직 없습니다.</p>
              <p className="text-sm mt-2">첫 번째 글을 작성해보세요!</p>
            </div>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  {post.stockName && (
                    <Badge variant="outline" className="w-fit border-[#248f5b] text-[#248f5b]">
                      {post.stockName}
                    </Badge>
                  )}
                  <CardTitle 
                    className="pt-2 text-lg hover:text-[#248f5b] cursor-pointer"
                    onClick={() => handlePostClick(post)}
                  >
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    {post.authorNickname} · {formatTimeAgo(post.createdAt)}
                  </p>
                  <p 
                    className="text-sm text-gray-700 mt-2 line-clamp-2 cursor-pointer hover:text-gray-900"
                    onClick={() => handlePostClick(post)}
                  >
                    {post.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    📝 제목 또는 내용을 클릭하면 댓글을 확인하고 작성할 수 있습니다.
                  </p>
                </CardContent>
                <CardFooter className="flex gap-4 text-sm text-gray-500">
                  <button 
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      post.isLikedByUser 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
                    }`}
                    onClick={() => handlePostLike(post.id)}
                  >
                    <ThumbsUp className={`w-4 h-4 ${post.isLikedByUser ? 'fill-current' : ''}`} />
                    <span>{post.likes}</span>
                  </button>
                  <button 
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-500 transition-all"
                    onClick={() => handlePostClick(post)}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.commentCount}</span>
                  </button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>

      <WritePostModal 
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        onSuccess={handleWriteSuccess}
      />

      <PostDetailModal
        post={selectedPost}
        isOpen={isPostDetailModalOpen}
        onClose={() => setIsPostDetailModalOpen(false)}
        onPostUpdate={handlePostUpdate}
        onPostDelete={handlePostDelete}
      />
    </>
  )
}
