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
                className="text-blue-600 hover:text-blue-800 underline"
              >
                원문 보기
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
