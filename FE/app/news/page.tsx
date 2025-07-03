"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import NewsDetailModal from "@/components/news-detail-modal"
import { getMyInfo } from "@/api/user"
import { getAllNews, NewsResponse } from "@/api/news"
import { formatTimeAgo } from "@/lib/utils"

const userNews = [
  {
    title: "코스피, 유상증자 계획 발표에 프리마켓서 10%↓",
    stock: "코스피스",
    change: "-16.4%",
    isUp: false,
    time: "21시간 전",
    source: "이데일리",
    imageUrl: "/placeholder.svg?height=80&width=80",
  },
  {
    title: "S&P500, 최고치 넘어서자 경고음… '가치주·해외주식 주목'",
    stock: "모더나",
    change: "+0.3%",
    isUp: true,
    time: "18시간 전",
    source: "이데일리",
    imageUrl: "/placeholder.svg?height=80&width=80",
  },
]

export default function NewsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedNews, setSelectedNews] = useState<NewsResponse | null>(null)
  const [user, setUser] = useState<any>(null)
  const [allNews, setAllNews] = useState<NewsResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        const newsData = await getAllNews()
        setAllNews(newsData)
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

  const mainNews = allNews[0] // 첫 번째 뉴스를 메인 뉴스로
  const subNews = allNews.slice(1, 4) // 2-4번째 뉴스를 서브 뉴스로

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
          {mainNews && (
            <Card className="overflow-hidden cursor-pointer" onClick={() => handleNewsClick(mainNews)}>
              <div className="relative">
                <Image
                  src={mainNews.thumbnailUrl || "/placeholder.svg?height=400&width=800"}
                  alt={mainNews.title}
                  width={800}
                  height={400}
                  className="w-full h-auto object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h2 className="text-xl font-bold text-white">{mainNews.title}</h2>
                  <p className="text-gray-300 mt-1 text-xs">
                    {formatTimeAgo(mainNews.publishedAt)} · {mainNews.source}
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
            {userNews.map((news, index) => (
              <Card key={index} className="cursor-pointer" onClick={() => setIsModalOpen(true)}>
                <CardContent className="p-3 flex gap-3 items-center">
                  <Image
                    src={news.imageUrl || "/placeholder.svg"}
                    alt={news.title}
                    width={80}
                    height={80}
                    className="rounded-md object-cover"
                  />
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-xs">{news.stock}</span>
                      <Badge
                        variant={news.isUp ? "destructive" : "default"}
                        className={`text-xs ${news.isUp ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {news.change}
                      </Badge>
                    </div>
                    <h3 className="font-semibold leading-tight">{news.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {news.time} · {news.source}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
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
