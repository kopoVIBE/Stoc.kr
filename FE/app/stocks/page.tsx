"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Heart } from "lucide-react"
import Link from "next/link"

const allStocks = [
  {
    id: 1,
    name: "CLM",
    price: "10,833원",
    change: "+0.3%",
    value: "1.1억원",
    isUp: true,
    logo: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 2,
    name: "TSYY",
    price: "14,024원",
    change: "+0.4%",
    value: "6,212만원",
    isUp: true,
    logo: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 3,
    name: "NVYY",
    price: "36,180원",
    change: "+0.5%",
    value: "5,396만원",
    isUp: true,
    logo: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 4,
    name: "JEPI",
    price: "76,921원",
    change: "+0.4%",
    value: "3,292만원",
    isUp: true,
    logo: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 5,
    name: "IWMY",
    price: "32,650원",
    change: "+0.4%",
    value: "3,290만원",
    isUp: true,
    logo: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 6,
    name: "써클인터넷 그룹",
    price: "244,951원",
    change: "-15.5%",
    value: "3,153만원",
    isUp: false,
    logo: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 7,
    name: "GMEU",
    price: "20,621원",
    change: "-1.6%",
    value: "2,991만원",
    isUp: false,
    logo: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 8,
    name: "튜터 페리니",
    price: "63,603원",
    change: "+2.0%",
    value: "2,875만원",
    isUp: true,
    logo: "/placeholder.svg?height=32&width=32",
  },
]

export default function StocksPage() {
  const [activeTab, setActiveTab] = useState("거래대금")

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-4">
        <h1 className="text-3xl font-bold">실시간 차트</h1>
        <span className="text-base text-gray-500">오늘 08:50 기준</span>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {["거래대금", "거래량", "급상승", "급하락", "인기"].map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">종목</TableHead>
                  <TableHead></TableHead>
                  <TableHead className="text-right">현재가</TableHead>
                  <TableHead className="text-right">등락률</TableHead>
                  <TableHead className="text-right">{activeTab} 많은 순</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allStocks.map((stock, index) => (
                  <TableRow key={stock.id}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Heart className="w-5 h-5 text-gray-300 fill-current hover:text-red-500 cursor-pointer" />
                        <span className="font-bold">{index + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/stocks/${stock.id}`} className="hover:underline">
                        <div className="flex items-center gap-3">
                          <img
                            src={stock.logo || "/placeholder.svg"}
                            alt={stock.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="font-semibold">{stock.name}</span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{stock.price}</TableCell>
                    <TableCell className={`text-right ${stock.isUp ? "text-red-500" : "text-blue-500"}`}>
                      {stock.change}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{stock.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
