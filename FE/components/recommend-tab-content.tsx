interface RecommendTabContentProps {
  stockName: string;
}

export function RecommendTabContent({ stockName }: RecommendTabContentProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {stockName}와(과) 유사한 종목을 추천해드립니다.
      </p>
      <div className="grid grid-cols-1 gap-4">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                <div>
                  <h4 className="font-semibold">추천 종목 {i + 1}</h4>
                  <p className="text-sm text-gray-500">-</p>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
