export function InfoTabContent() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm text-gray-500">시가총액</h3>
          <p className="font-semibold">-</p>
        </div>
        <div>
          <h3 className="text-sm text-gray-500">상장주식수</h3>
          <p className="font-semibold">-</p>
        </div>
        <div>
          <h3 className="text-sm text-gray-500">52주 최고</h3>
          <p className="font-semibold">-</p>
        </div>
        <div>
          <h3 className="text-sm text-gray-500">52주 최저</h3>
          <p className="font-semibold">-</p>
        </div>
      </div>
    </div>
  );
}
