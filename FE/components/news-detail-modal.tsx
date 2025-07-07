import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { NewsResponse } from "@/api/news";
import { formatTimeAgo } from "@/lib/utils";

interface NewsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  news: NewsResponse | null;
}

export default function NewsDetailModal({
                                          isOpen,
                                          onClose,
                                          news,
                                        }: NewsDetailModalProps) {
  if (!isOpen || !news) return null;

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 border-b">
            <DialogTitle className="text-xl">
              {news.title}
            </DialogTitle>
            <DialogDescription>
              {news.publishedAt.replace('T', ' ')} · {news.source}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 flex-grow overflow-y-auto">
            <div className="flex flex-wrap gap-4 mb-6">
              {/* 종목명 태그 (종목 뉴스인 경우) */}
              {news.stockName && (
                  <Badge
                      variant="outline"
                      className="text-green-600 border-green-200 bg-green-50 font-medium"
                  >
                    {news.stockName}
                  </Badge>
              )}

              {/* 감정 분석 결과 뱃지 */}
              {news.sentiment && (
                  <Badge
                      variant="outline"
                      className={
                        news.sentiment === "positive"
                            ? "text-yellow-600 border-yellow-200 bg-yellow-50"
                            : news.sentiment === "neutral"
                                ? "text-gray-600 border-gray-200 bg-gray-50"
                                : "text-red-600 border-red-200 bg-red-50"
                      }
                  >
                    {news.sentiment === "positive" && "☀️ 맑음"}
                    {news.sentiment === "neutral" && "🌥️ 안개"}
                    {news.sentiment === "negative" && "🌧️ 폭우"}
                  </Badge>
              )}

              {/* 카테고리 태그들 */}
              {news.category.map((cat, index) => (
                  <Badge
                      key={index}
                      variant="outline"
                      className="text-blue-600 border-blue-200 bg-blue-50"
                  >
                    {cat}
                  </Badge>
              ))}
            </div>
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: news.content }} />
            </div>
            {news.url && (
                <div className="mt-6 pt-4 border-t">
                  <a
                      href={news.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    원문 보기
                  </a>
                </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
  );
}
