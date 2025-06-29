"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import NewsDetailModal from "@/components/news-detail-modal"

const mainNews = {
  title: "[오늘의 뉴욕증시 무버] 나이키, 실적 개선 기대감에 15%대 급등",
  time: "9시간 전",
  source: "이데일리",
  imageUrl: "/placeholder.svg?height=400&width=800",
}

const subNews = [
  { title: "이마존, '2년내 Prime 회원비 인상 예상'에 주가 +2.8%", imageUrl: "/placeholder.svg?height=150&width=200" },
  { title: "나이키 +15.1%, VF 코퍼레이션 +1.9%", imageUrl: "/placeholder.svg?height=150&width=200" },
  { title: "스타트업, 월가가 스시 사업에 열광하는 동안...", imageUrl: "/placeholder.svg?height=150&width=200" },
]

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

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-2xl font-bold">주요 뉴스</h1>
          {/* Main News */}
          <Card className="overflow-hidden cursor-pointer" onClick={() => setIsModalOpen(true)}>
            <div className="relative">
              <Image
                src={mainNews.imageUrl || "/placeholder.svg"}
                alt={mainNews.title}
                width={800}
                height={400}
                className="w-full h-auto object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <h2 className="text-xl font-bold text-white">{mainNews.title}</h2>
                <p className="text-gray-300 mt-1 text-xs">
                  {mainNews.time} · {mainNews.source}
                </p>
              </div>
            </div>
          </Card>
          {/* Sub News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subNews.map((news, index) => (
              <Card key={index} className="overflow-hidden cursor-pointer" onClick={() => setIsModalOpen(true)}>
                <Image
                  src={news.imageUrl || "/placeholder.svg"}
                  alt={news.title}
                  width={200}
                  height={150}
                  className="w-full h-32 object-cover"
                />
                <CardContent className="p-3">
                  <h3 className="font-semibold leading-tight">{news.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-4">
          <h1 className="text-2xl font-bold">User1님을 위한 맞춤 뉴스</h1>
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
      <NewsDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
