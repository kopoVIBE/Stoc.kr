"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, MessageSquare, ThumbsUp } from "lucide-react"

const mockPosts = [
  {
    id: 1,
    title: "삼성전자, 다음 주 실적 발표 기대되네요",
    author: "투자왕개미",
    date: "2시간 전",
    stock: "삼성전자",
    likes: 12,
    comments: 5,
  },
  {
    id: 2,
    title: "SK하이닉스 지금이라도 들어가야 할까요?",
    author: "고점매수전문",
    date: "5시간 전",
    stock: "SK하이닉스",
    likes: 5,
    comments: 8,
  },
  {
    id: 3,
    title: "카카오 주주분들 힘내세요... 존버는 승리합니다",
    author: "한강수온체크",
    date: "1일 전",
    stock: "카카오",
    likes: 34,
    comments: 15,
  },
  {
    id: 4,
    title: "삼성전자 배당금 들어왔네요. 치킨값 벌었습니다.",
    author: "배당금냠냠",
    date: "2일 전",
    stock: "삼성전자",
    likes: 22,
    comments: 7,
  },
]

const popularTags = ["삼성전자", "SK하이닉스", "카카오", "현대차", "LG에너지솔루션"]

export default function CommunityPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const filteredPosts = mockPosts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTag = activeTag ? post.stock === activeTag : true
    return matchesSearch && matchesTag
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold">커뮤니티</h1>
        <Button className="bg-[#248f5b] hover:bg-[#248f5b]/90">글쓰기</Button>
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
          {popularTags.map((tag) => (
            <Badge
              key={tag}
              variant={activeTag === tag ? "default" : "secondary"}
              onClick={() => setActiveTag(tag)}
              className={`cursor-pointer ${activeTag === tag ? "bg-[#248f5b] text-white" : ""}`}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredPosts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <Badge variant="outline" className="w-fit border-[#248f5b] text-[#248f5b]">
                {post.stock}
              </Badge>
              <CardTitle className="pt-2 text-lg">{post.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                {post.author} · {post.date}
              </p>
            </CardContent>
            <CardFooter className="flex gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <ThumbsUp className="w-4 h-4" />
                {post.likes}
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {post.comments}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
