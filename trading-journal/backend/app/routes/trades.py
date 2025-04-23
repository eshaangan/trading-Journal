from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from typing import List, Optional
from app.models.trade import Trade, TradeCreate, TradeType
from app.utils import db, csv_parser
from sqlalchemy.orm import Session
from datetime import date
import io

router = APIRouter(
    prefix="/api/trades",
    tags=["trades"]
)

# Get DB dependency
def get_db_session():
    db_generator = db.get_db()
    try:
        yield next(db_generator)
    finally:
        try:
            next(db_generator)
        except StopIteration:
            pass

@router.get("/", response_model=List[Trade])
def get_trades(
    db_session: Session = Depends(get_db_session),
    account: Optional[str] = None,
    symbol: Optional[str] = None,
    type: Optional[TradeType] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get all trades with optional filtering"""
    trades = db.get_trades(
        db_session, 
        account=account,
        symbol=symbol,
        trade_type=type.value if type else None,
        start_date=start_date,
        end_date=end_date
    )
    return trades

@router.get("/{trade_id}", response_model=Trade)
def get_trade(trade_id: int, db_session: Session = Depends(get_db_session)):
    """Get a single trade by ID"""
    trade = db.get_trade_by_id(db_session, trade_id)
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    return trade

@router.post("/", response_model=Trade)
def create_trade(trade: TradeCreate, db_session: Session = Depends(get_db_session)):
    """Create a new trade"""
    # Check if account exists
    account = db.get_account_by_name(db_session, trade.account)
    if not account:
        raise HTTPException(status_code=400, detail=f"Account '{trade.account}' does not exist")
    
    # Check for duplicates (same date, symbol, type)
    existing_trades = db.get_trades(
        db_session,
        account=trade.account,
        symbol=trade.symbol,
        trade_type=trade.type.value,
        start_date=trade.date,
        end_date=trade.date
    )
    
    if existing_trades:
        raise HTTPException(
            status_code=400, 
            detail=f"A trade for {trade.symbol} ({trade.type.value}) on {trade.date} already exists"
        )
    
    # Create trade
    trade_data = trade.dict()
    trade_data["type"] = trade.type.value
    
    created_trade = db.create_trade(db_session, trade_data)
    return created_trade

@router.put("/{trade_id}", response_model=Trade)
def update_trade(trade_id: int, trade: TradeCreate, db_session: Session = Depends(get_db_session)):
    """Update an existing trade"""
    existing_trade = db.get_trade_by_id(db_session, trade_id)
    if not existing_trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    # Check if account exists
    account = db.get_account_by_name(db_session, trade.account)
    if not account:
        raise HTTPException(status_code=400, detail=f"Account '{trade.account}' does not exist")
    
    # Update trade
    trade_data = trade.dict()
    trade_data["type"] = trade.type.value
    
    success = db.update_trade(db_session, trade_id, trade_data)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update trade")
    
    return {**trade_data, "id": trade_id}

@router.delete("/{trade_id}", response_model=dict)
def delete_trade(trade_id: int, db_session: Session = Depends(get_db_session)):
    """Delete a trade"""
    existing_trade = db.get_trade_by_id(db_session, trade_id)
    if not existing_trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    success = db.delete_trade(db_session, trade_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete trade")
    
    return {"success": True, "message": "Trade deleted successfully"}

@router.post("/import", response_model=dict)
async def import_trades(
    file: UploadFile = File(...),
    account: str = Form(...),
    db_session: Session = Depends(get_db_session)
):
    """Import trades from CSV file"""
    # Check if account exists
    account_obj = db.get_account_by_name(db_session, account)
    if not account_obj:
        raise HTTPException(status_code=400, detail=f"Account '{account}' does not exist")
    
    # Read file content
    content = await file.read()
    
    try:
        # Parse CSV
        trades = csv_parser.parse_csv(content, account)
        
        # Check for duplicates
        existing_trades = db.get_trades(db_session, account=account)
        duplicates = csv_parser.get_duplicate_trades(trades, existing_trades)
        
        # Import non-duplicate trades
        imported_count = 0
        for trade in trades:
            if trade not in duplicates:
                db.create_trade(db_session, trade)
                imported_count += 1
        
        return {
            "success": True,
            "message": f"Imported {imported_count} trades",
            "total": len(trades),
            "imported": imported_count,
            "duplicates": len(duplicates)
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 