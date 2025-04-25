import pandas as pd
import numpy as np
from typing import List, Dict, Any
from datetime import datetime

def calculate_metrics(trades: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate trading metrics from a list of trades.
    
    Args:
        trades: List of trade dictionaries
        
    Returns:
        Dictionary containing calculated metrics
    """
    if not trades:
        return {
            "total_pl": 0,
            "win_rate": 0,
            "profit_factor": 0,
            "avg_trade_pl": 0,
            "max_drawdown": 0,
            "consecutive_wins": 0,
            "consecutive_losses": 0,
            "win_count": 0,
            "loss_count": 0,
            "total_trades": 0,
            "total_lots": 0,
            "avg_duration": "N/A",
            "avg_win": 0,
            "avg_loss": 0,
            "best_trade": 0,
            "worst_trade": 0
        }
    
    # Convert trades to DataFrame for easier manipulation
    df = pd.DataFrame(trades)
    
    # Convert date strings to datetime objects
    df['date'] = pd.to_datetime(df['date'])
    
    # Sort by date
    df = df.sort_values('date')
    
    # Calculate basic metrics
    total_pl = df['pl'].sum()
    win_count = len(df[df['pl'] > 0])
    loss_count = len(df[df['pl'] < 0])
    total_trades = len(df)
    
    # Calculate average winning and losing trades
    winning_trades = df[df['pl'] > 0]['pl']
    losing_trades = df[df['pl'] < 0]['pl']
    
    avg_win = winning_trades.mean() if not winning_trades.empty else 0
    avg_loss = abs(losing_trades.mean()) if not losing_trades.empty else 0
    
    # Calculate best and worst trades
    best_trade = df['pl'].max() if not df.empty else 0
    worst_trade = df['pl'].min() if not df.empty else 0
    
    # Calculate total lots
    total_lots = df['lots'].sum() if 'lots' in df.columns else 0
    
    # Calculate average duration if available
    avg_duration = "N/A"
    if 'duration' in df.columns and not df['duration'].isna().all():
        try:
            df['duration'] = pd.to_timedelta(df['duration'])
            avg_duration_seconds = df['duration'].dt.total_seconds().mean()
            hours = int(avg_duration_seconds // 3600)
            minutes = int((avg_duration_seconds % 3600) // 60)
            avg_duration = f"{hours}h {minutes}m"
        except:
            avg_duration = "N/A"
    
    # Win rate
    win_rate = win_count / total_trades if total_trades > 0 else 0
    
    # Profit factor
    gross_profit = df[df['pl'] > 0]['pl'].sum()
    gross_loss = abs(df[df['pl'] < 0]['pl'].sum())
    profit_factor = gross_profit / gross_loss if gross_loss != 0 else float('inf')
    
    # Average trade P&L
    avg_trade_pl = total_pl / total_trades if total_trades > 0 else 0
    
    # Running P&L for drawdown calculation
    df['cumulative_pl'] = df['pl'].cumsum()
    
    # Calculate drawdown
    df['peak'] = df['cumulative_pl'].cummax()
    df['drawdown'] = df['peak'] - df['cumulative_pl']
    max_drawdown = df['drawdown'].max()
    
    # Calculate consecutive wins and losses
    df['win'] = df['pl'] > 0
    df['streak'] = (df['win'] != df['win'].shift(1)).cumsum()
    streak_stats = df.groupby(['streak', 'win']).size().reset_index(name='streak_len')
    
    max_consecutive_wins = 0
    max_consecutive_losses = 0
    
    if not streak_stats.empty:
        wins_mask = streak_stats['win'] == True
        losses_mask = streak_stats['win'] == False
        
        if any(wins_mask):
            max_consecutive_wins = streak_stats[wins_mask]['streak_len'].max()
        if any(losses_mask):
            max_consecutive_losses = streak_stats[losses_mask]['streak_len'].max()
    
    return {
        "total_pl": round(total_pl, 2),
        "win_rate": round(win_rate * 100, 2),
        "profit_factor": round(profit_factor, 2),
        "avg_trade_pl": round(avg_trade_pl, 2),
        "max_drawdown": round(max_drawdown, 2),
        "consecutive_wins": int(max_consecutive_wins),
        "consecutive_losses": int(max_consecutive_losses),
        "win_count": win_count,
        "loss_count": loss_count,
        "total_trades": total_trades,
        "total_lots": round(total_lots, 2),
        "avg_duration": avg_duration,
        "avg_win": round(avg_win, 2),
        "avg_loss": round(avg_loss, 2),
        "best_trade": round(best_trade, 2),
        "worst_trade": round(worst_trade, 2)
    }

def calculate_performance_by_symbol(trades: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate performance metrics grouped by symbol.
    
    Args:
        trades: List of trade dictionaries
        
    Returns:
        Dictionary mapping symbols to their performance metrics
    """
    df = pd.DataFrame(trades)
    
    if df.empty:
        return {}
    
    result = {}
    for symbol, group in df.groupby('symbol'):
        symbol_metrics = {
            "total_pl": group['pl'].sum(),
            "count": len(group),
            "win_rate": (group['pl'] > 0).mean() * 100,
            "avg_pl": group['pl'].mean(),
            "biggest_win": group['pl'].max(),
            "biggest_loss": group['pl'].min()
        }
        result[symbol] = {k: round(v, 2) if isinstance(v, float) else v for k, v in symbol_metrics.items()}
    
    return result

def calculate_performance_by_day(trades: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate performance metrics grouped by day of week.
    
    Args:
        trades: List of trade dictionaries
        
    Returns:
        Dictionary mapping days to their performance metrics
    """
    df = pd.DataFrame(trades)
    
    if df.empty:
        return {}
    
    # Convert date strings to datetime objects
    df['date'] = pd.to_datetime(df['date'])
    
    # Extract day of week
    df['day_of_week'] = df['date'].dt.day_name()
    
    result = {}
    days_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    
    for day in days_order:
        day_data = df[df['day_of_week'] == day]
        if len(day_data) > 0:
            day_metrics = {
                "total_pl": day_data['pl'].sum(),
                "count": len(day_data),
                "win_rate": (day_data['pl'] > 0).mean() * 100,
                "avg_pl": day_data['pl'].mean()
            }
            result[day] = {k: round(v, 2) if isinstance(v, float) else v for k, v in day_metrics.items()}
        else:
            result[day] = {
                "total_pl": 0,
                "count": 0,
                "win_rate": 0,
                "avg_pl": 0
            }
    
    return result

def get_cumulative_pl_data(trades: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Get cumulative P&L data for charting.
    
    Args:
        trades: List of trade dictionaries
        
    Returns:
        List of date and cumulative P&L pairs
    """
    if not trades:
        return []
    
    df = pd.DataFrame(trades)
    
    # Convert date strings to datetime objects
    df['date'] = pd.to_datetime(df['date'])
    
    # Sort by date
    df = df.sort_values('date')
    
    # Calculate cumulative P&L
    df['cumulative_pl'] = df['pl'].cumsum()
    
    # Format for frontend
    result = []
    for _, row in df.iterrows():
        result.append({
            "date": row['date'].strftime('%Y-%m-%d'),
            "value": round(row['cumulative_pl'], 2)
        })
    
    return result 