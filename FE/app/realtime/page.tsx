'use client';

import { useState } from 'react';
import { useStockWebSocket } from '@/hooks/useStockWebSocket';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RealtimePage() {
  const [stockCode, setStockCode] = useState('');
  const { stockData, isConnected, error, subscribeToStock, unsubscribeFromStock } = useStockWebSocket();

  const handleSubscribe = () => {
    if (!stockCode) return;
    subscribeToStock(stockCode);
  };

  const handleUnsubscribe = () => {
    if (!stockCode) return;
    unsubscribeFromStock(stockCode);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">실시간 주식 데이터</h1>
      
      {/* 연결 상태 표시 */}
      <div className="mb-4">
        <span className={`inline-block px-2 py-1 rounded text-sm ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? '연결됨' : '연결 끊김'}
        </span>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 종목 코드 입력 및 제어 */}
      <div className="flex gap-2 mb-6">
        <Input
          type="text"
          value={stockCode}
          onChange={(e) => setStockCode(e.target.value)}
          placeholder="종목 코드 입력 (예: 005930)"
          className="max-w-xs"
        />
        <Button onClick={handleSubscribe} variant="default">구독</Button>
        <Button onClick={handleUnsubscribe} variant="outline">구독 해제</Button>
      </div>

      {/* 주식 데이터 표시 */}
      {stockData && (
        <Card>
          <CardHeader>
            <CardTitle>{stockData.stockCode} 실시간 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">현재가</p>
                <p className="text-xl font-semibold">
                  {stockData.price.toLocaleString()}원
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">거래량</p>
                <p className="text-xl font-semibold">
                  {stockData.volume.toLocaleString()}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">최종 업데이트</p>
                <p className="text-base">
                  {new Date(stockData.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 