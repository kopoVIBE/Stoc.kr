import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FavoriteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  stockName: string;
  action: "add" | "remove";
}

export function FavoriteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  stockName,
  action,
}: FavoriteConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action === "add" ? "관심 종목 추가" : "관심 종목 해제"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {stockName}을(를){" "}
            {action === "add" ? "관심 종목에 추가" : "관심 종목에서 해제"}
            하시겠습니까?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>확인</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
