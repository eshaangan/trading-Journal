from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.utils import db, analytics
from sqlalchemy.orm import Session
from datetime import date

router = APIRouter(
    prefix="/api/analytics",
    tags=["analytics"]
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

@router.get("/metrics")
def get_metrics(
    account: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db_session: Session = Depends(get_db_session)
):
    """Get trading metrics for the given account and date range"""
    # Get trades
    trades = db.get_trades(
        db_session,
        account=account,
        start_date=start_date,
        end_date=end_date
    )
    
    # Calculate metrics
    metrics = analytics.calculate_metrics(trades)
    
    return metrics

@router.get("/performance/symbol")
def get_performance_by_symbol(
    account: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db_session: Session = Depends(get_db_session)
):
    """Get performance metrics by symbol"""
    # Get trades
    trades = db.get_trades(
        db_session,
        account=account,
        start_date=start_date,
        end_date=end_date
    )
    
    # Calculate performance by symbol
    performance = analytics.calculate_performance_by_symbol(trades)
    
    return performance

@router.get("/performance/day")
def get_performance_by_day(
    account: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db_session: Session = Depends(get_db_session)
):
    """Get performance metrics by day of week"""
    # Get trades
    trades = db.get_trades(
        db_session,
        account=account,
        start_date=start_date,
        end_date=end_date
    )
    
    # Calculate performance by day
    performance = analytics.calculate_performance_by_day(trades)
    
    return performance

@router.get("/cumulative-pl")
def get_cumulative_pl(
    account: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db_session: Session = Depends(get_db_session)
):
    """Get cumulative P&L data for charting"""
    # Get trades
    trades = db.get_trades(
        db_session,
        account=account,
        start_date=start_date,
        end_date=end_date
    )
    
    # Get cumulative P&L data
    data = analytics.get_cumulative_pl_data(trades)
    
    return data

@router.get("/calendar")
def get_calendar_data(
    account: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db_session: Session = Depends(get_db_session)
):
    """Get daily and weekly P&L data for the calendar"""
    # Get trades
    trades = db.get_trades(
        db_session,
        account=account,
        start_date=start_date,
        end_date=end_date
    )
    
    # Get calendar data
    data = analytics.get_calendar_data(trades)
    
    return data 