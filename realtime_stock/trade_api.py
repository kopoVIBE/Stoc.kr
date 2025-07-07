from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, validator
from decimal import Decimal
from typing import Optional
import logging
from kis_trade_service import KISTradeService

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()
trade_service = KISTradeService()

class OrderRequest(BaseModel):
    orderId: str
    accountId: str
    stockCode: str
    orderType: str  # 'BUY' or 'SELL'
    quantity: int
    price: Decimal
    
    @validator('orderType')
    def validate_order_type(cls, v):
        if v not in ['BUY', 'SELL']:
            raise ValueError('orderType must be either BUY or SELL')
        return v
    
    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('quantity must be greater than 0')
        return v
    
    @validator('price')
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError('price must be greater than 0')
        return v

@app.post("/api/trade/order")
async def create_order(request: Request, order: OrderRequest):
    # 요청 바디 로깅
    body = await request.json()
    logger.info(f"Received order request: {body}")
    
    try:
        result = trade_service.create_order(order.dict())
        
        if result['status'] == 'success':
            return {
                "status": "success",
                "data": {
                    "kisOrderId": result['kisOrderId'],
                    "message": result['message']
                }
            }
        else:
            logger.error(f"Order creation failed: {result['message']}")
            raise HTTPException(status_code=400, detail=result['message'])
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 