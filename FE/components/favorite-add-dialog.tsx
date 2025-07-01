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

interface FavoriteAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  stockName: string;
}

export function FavoriteAddDialog({
  isOpen,
  onClose,
  onConfirm,
  stockName,
}: FavoriteAddDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>관심 종목 추가</AlertDialogTitle>
          <AlertDialogDescription>
            {stockName}을(를) 관심 종목에 추가하시겠습니까?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>추가</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
