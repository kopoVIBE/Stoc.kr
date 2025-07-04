from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from decimal import Decimal
from typing import Optional
from kis_trade_service import KISTradeService

app = FastAPI()
trade_service = KISTradeService()

class OrderRequest(BaseModel):
    orderId: str
    accountId: str
    stockCode: str
    orderType: str  # 'BUY' or 'SELL'
    quantity: int
    price: Decimal

@app.post("/api/trade/order")
async def create_order(request: OrderRequest):
    result = trade_service.create_order(request.dict())
    
    if result['status'] == 'success':
        return {
            "status": "success",
            "data": {
                "kisOrderId": result['kisOrderId'],
                "message": result['message']
            }
        }
    else:
        raise HTTPException(status_code=400, detail=result['message'])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 