import pandas as pd
from datetime import datetime
from typing import List, Dict, Any, Optional
import io

def parse_csv(file_content: bytes, account_name: str) -> List[Dict[str, Any]]:
    """
    Parse CSV data from uploaded file content and validate it.
    
    Args:
        file_content: The uploaded CSV file content
        account_name: The name of the account this data belongs to
        
    Returns:
        List of validated trade dictionaries
    """
    try:
        # Read CSV using pandas
        df = pd.read_csv(io.BytesIO(file_content))
        df.columns = [col.strip() for col in df.columns]

        # Required columns for this CSV format
        required_columns = ['Time', 'Balance Before', 'Balance After', 'Action']
        missing = [col for col in required_columns if col not in df.columns]
        if missing:
            raise ValueError(f"Missing required columns: {', '.join(missing)}")

        trades = []
        for _, row in df.iterrows():
            # Parse timestamp into date
            try:
                ts = pd.to_datetime(row['Time'])
                date_str = ts.date().isoformat()
            except Exception as e:
                raise ValueError(f"Invalid time format in row: {row['Time']}")

            # Parse entry and exit prices
            try:
                entry_price = float(row['Balance Before'])
                exit_price = float(row['Balance After'])
            except Exception as e:
                raise ValueError(f"Invalid balance values: {row['Balance Before']}, {row['Balance After']}")

            # Extract action and symbol
            action_val = str(row['Action']).strip()
            parts = action_val.split()
            if len(parts) < 2:
                raise ValueError(f"Invalid action format in row: {action_val}")
            action_word = parts[0].strip().title()
            # Map long/buy and short/sell to trade type
            if action_word in ['Long', 'Buy']:
                trade_type = 'Long'
            elif action_word in ['Short', 'Sell']:
                trade_type = 'Short'
            else:
                # Fallback: derive from price movement if action is unrecognized
                if exit_price >= entry_price:
                    trade_type = 'Long'
                else:
                    trade_type = 'Short'
            symbol = parts[1].strip().upper()

            # Compute P&L and percentage
            if trade_type == 'Long':
                pl = exit_price - entry_price
            else:
                pl = entry_price - exit_price
            pl_percent = (pl / entry_price * 100) if entry_price else 0.0

            # Default size to 1
            size = 1.0

            trades.append({
                'date': date_str,
                'symbol': symbol,
                'type': trade_type,
                'size': size,
                'entry': entry_price,
                'exit': exit_price,
                'pl': pl,
                'pl_percent': pl_percent,
                'notes': '',
                'account': account_name,
                'session': ''
            })
        
        return trades
    
    except Exception as e:
        raise ValueError(f"Error parsing CSV: {str(e)}")

def get_duplicate_trades(trades: List[Dict[str, Any]], existing_trades: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Find duplicate trades based on date, symbol, and type.
    
    Args:
        trades: New trades being imported
        existing_trades: Existing trades in the database
        
    Returns:
        List of duplicate trades
    """
    duplicates = []
    for new_trade in trades:
        for existing_trade in existing_trades:
            if (
                new_trade['date'] == existing_trade['date'] and
                new_trade['symbol'] == existing_trade['symbol'] and
                new_trade['type'] == existing_trade['type']
            ):
                duplicates.append(new_trade)
                break
    
    return duplicates 