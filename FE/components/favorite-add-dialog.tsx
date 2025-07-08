import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export function FavoriteAddDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [stockCode, setStockCode] = useState("");

  const handleConfirm = () => {
    // 여기에 종목 추가 로직 구현
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>관심 종목 추가</DialogTitle>
          <DialogDescription>
            추가하고 싶은 종목의 코드를 입력하세요
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              id="stockCode"
              value={stockCode}
              onChange={(e) => setStockCode(e.target.value)}
              className="col-span-4"
              placeholder="종목 코드 (예: 005930)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleConfirm}>추가</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
