"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import NewsDetailModal from "@/components/news-detail-modal"
import { getMyInfo } from "@/api/user"
import { getMainNews, getPersonalizedNews, NewsResponse } from "@/api/news"
import { formatTimeAgo } from "@/lib/utils"

export default function NewsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedNews, setSelectedNews] = useState<NewsResponse | null>(null)
  const [user, setUser] = useState<any>(null)
  const [mainNews, setMainNews] = useState<NewsResponse[]>([])
  const [personalizedNews, setPersonalizedNews] = useState<NewsResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

 // ✅ 중복 제거 유틸 함수
 const deduplicateByTitle = (newsList: NewsResponse[]): NewsResponse[] => {
      const map = new Map<string, NewsResponse>();
      for (const news of newsList) {
        if (!map.has(news.title)) {
          map.set(news.title, news);
        }
      }
      return Array.from(map.values());
    };
     
   
  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const userData = await getMyInfo();
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    };

    const fetchNews = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // 주요 뉴스는 항상 조회
        const mainNewsData = await getMainNews();
        setMainNews(deduplicateByTitle(mainNewsData));
        
        // 맞춤 뉴스는 로그인된 사용자에게만 제공
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const personalizedNewsData = await getPersonalizedNews();
            setPersonalizedNews(deduplicateByTitle(personalizedNewsData));
          } catch (error) {
            console.error("맞춤 뉴스 조회 실패:", error);
            setPersonalizedNews([]);
          }
        }
      } catch (error) {
        console.error("뉴스 조회 실패:", error)
        setError("뉴스를 불러오는데 실패했습니다.")
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
    fetchNews()
  }, [])

  const handleNewsClick = (news: NewsResponse) => {
    setSelectedNews(news)
    setIsModalOpen(true)
  }

  const mainNewsItem = mainNews[0] // 첫 번째 뉴스를 메인 뉴스로
  const subNews = mainNews.slice(1, 4) // 2-4번째 뉴스를 서브 뉴스로

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column Loading */}
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-8 w-48" />
          {/* Main News Loading */}
          <Card className="overflow-hidden">
            <Skeleton className="w-full h-64" />
            <div className="p-4">
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </Card>
          {/* Sub News Loading */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full h-32" />
                <div className="p-3">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column Loading */}
        <div className="lg:col-span-1 space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i}>
                <div className="p-3 flex gap-3 items-center">
                  <Skeleton className="w-20 h-20 rounded-md" />
                  <div className="flex-grow">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-2xl font-bold">주요 뉴스</h1>
          
          {/* Main News */}
          {mainNewsItem && (
            <Card className="overflow-hidden cursor-pointer" onClick={() => handleNewsClick(mainNewsItem)}>
              <div className="relative">
                <Image
                  src={mainNewsItem.thumbnailUrl || "/placeholder.svg?height=400&width=800"}
                  alt={mainNewsItem.title}
                  width={800}
                  height={400}
                  className="w-full h-auto object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h2 className="text-xl font-bold text-white">{mainNewsItem.title}</h2>
                  <p className="text-gray-300 mt-1 text-xs">
                    {formatTimeAgo(mainNewsItem.publishedAt)} · {mainNewsItem.source}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Sub News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subNews.map((news, index) => (
              <Card key={news.id} className="overflow-hidden cursor-pointer" onClick={() => handleNewsClick(news)}>
                <Image
                  src={news.thumbnailUrl || "/placeholder.svg?height=150&width=200"}
                  alt={news.title}
                  width={200}
                  height={150}
                  className="w-full h-32 object-cover"
                />
                <CardContent className="p-3">
                  <h3 className="font-semibold leading-tight">{news.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimeAgo(news.publishedAt)} · {news.source}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-4">
          <h1 className="text-2xl font-bold">{user?.name || "회원"}님을 위한 맞춤 뉴스</h1>
          <div className="space-y-3">
            {personalizedNews.length > 0 ? (
              personalizedNews.map((news) => (
                <Card key={news.id} className="cursor-pointer" onClick={() => handleNewsClick(news)}>
                  <CardContent className="p-3 flex gap-3 items-center">
                    <Image
                      src={news.thumbnailUrl || "/placeholder.svg"}
                      alt={news.title}
                      width={80}
                      height={80}
                      className="rounded-md object-cover"
                    />
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-xs">{news.source}</span>
                        <Badge
                          variant="outline"
                          className="text-xs bg-blue-100 text-blue-700 border-blue-300"
                        >
                          {news.stockName}
                        </Badge>
                      </div>
                      <h3 className="font-semibold leading-tight">{news.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(news.publishedAt)} · {news.source}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>맞춤 뉴스가 없습니다.</p>
                <p className="text-sm mt-2">즐겨찾기 종목을 추가해보세요!</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <NewsDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        news={selectedNews}
      />
    </>
  )
}
