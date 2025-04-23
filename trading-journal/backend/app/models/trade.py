from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from enum import Enum

class TradeType(str, Enum):
    LONG = "Long"
    SHORT = "Short"

class Trade(BaseModel):
    id: Optional[int] = None
    date: date
    symbol: str
    type: TradeType
    size: float
    entry: float
    exit: float
    pl: float
    pl_percent: float
    notes: Optional[str] = None
    account: str
    session: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class TradeCreate(BaseModel):
    date: date
    symbol: str
    type: TradeType
    size: float
    entry: float
    exit: float
    pl: float
    pl_percent: float
    notes: Optional[str] = None
    account: str
    session: Optional[str] = None

class Account(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

class AccountCreate(BaseModel):
    name: str
    description: Optional[str] = None 