interface PriceTabContentProps {
  ticker: string;
}

export function PriceTabContent({ ticker }: PriceTabContentProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3 className="font-semibold mb-2">매도 호가</h3>
        <div className="space-y-1 text-right">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={`ask-${i}`} className="text-red-500">
                - (-%)
              </div>
            ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">매수 호가</h3>
        <div className="space-y-1">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={`bid-${i}`} className="text-blue-500">
                - (-%)
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
