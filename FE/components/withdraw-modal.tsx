"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>보내기</DialogTitle>
          <DialogDescription>
            계좌에서 출금할 금액을 입력하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">출금 금액</Label>
            <Input id="amount" type="number" placeholder="금액 입력" />
          </div>
          <p className="text-sm text-gray-500">연결된 계좌로 입금됩니다.</p>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" onClick={onClose}>
            출금하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
