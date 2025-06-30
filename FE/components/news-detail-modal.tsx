import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface NewsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewsDetailModal({
  isOpen,
  onClose,
}: NewsDetailModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-xl">
            오픈AI, 제품에 구글 AI 칩 활용한다고 소식통 밝혀
          </DialogTitle>
          <DialogDescription>2025년 06월 28일 07:15 · 로이터</DialogDescription>
        </DialogHeader>
        <div className="p-6 flex-grow overflow-y-auto">
          <div className="flex flex-wrap gap-4 mb-6">
            <Badge
              variant="outline"
              className="text-red-600 border-red-200 bg-red-50"
            >
              알파벳 A +상승
            </Badge>
            <Badge
              variant="outline"
              className="text-red-600 border-red-200 bg-red-50"
            >
              엔비디아 +상승
            </Badge>
            <Badge
              variant="outline"
              className="text-red-600 border-red-200 bg-red-50"
            >
              애플 +상승
            </Badge>
            <Badge
              variant="outline"
              className="text-blue-600 border-blue-200 bg-blue-50"
            >
              마이크로소프트 -하락
            </Badge>
          </div>
          <div className="prose max-w-none">
            <p>
              로이터통신에 따르면 오픈AI는 최근 구글의 인공지능(AI) 칩을 임대해
              챗GPT 및 기타 제품을 가동하는 데 사용하고 있는 것으로 알려졌다.
            </p>
            <p>
              챗GPT 제작사인 오픈AI는 Nvidia의 그래픽처리장치(GPU)칩 시장 큰
              구매자 중 하나로, AI 칩을 모델 훈련에 사용함과 동시에 새로운
              정보를 보내주는 예측 또는 결정을 내리는 인퍼런스 컴퓨팅에도
              사용하고 있다.
            </p>
            <p>
              오픈AI는 증가하는 컴퓨팅 용량 요구를 충족하기 위해 구글 클라우드
              서비스를 추가할 계획이라고 로이터 통신이 이날 초 단독 보도해
              놀라운 협력 관계를 보여주는 사례로 주목받았다.
            </p>
            <p>
              구글로서는 이번 딜이 역사적으로 내부용으로 쓰던 자체 제작
              텐서처리장치(TPU)의 외부 사용을 확대하는 가운데 나온 것이라는
              점에서 의미가 크다. 이를 통해 구글은 텐센트 클라우드와 Apple이
              포함된 텐스토렌트, 세이프, 슈퍼인텔리전스 등 챗GPT-제조업체
              경쟁사로 나온 전 오픈AI 수장들이 출시한 스타트업 고객을 확보하는
              데 도움이 됐다.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
