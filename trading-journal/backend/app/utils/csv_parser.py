import pandas as pd
from datetime import datetime
from typing import List, Dict, Any, Optional
import io
import re

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
        # Read CSV and normalize column names
        df = pd.read_csv(io.BytesIO(file_content))
        df.columns = [col.strip() for col in df.columns]
        
        # Detect the P&L column (look for "Realized P&L (value)" first, then any P&L column)
        pl_col = None
        if "Realized P&L (value)" in df.columns:
            pl_col = "Realized P&L (value)"
        else:
            pl_col = next((col for col in df.columns if re.search(r'p\s*&\s*l', col, re.IGNORECASE)), None)
        
        # Required columns for this CSV format
        required_columns = ['Time', 'Balance Before', 'Balance After', 'Action']
        if pl_col:
            required_columns.append(pl_col)
            
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
                # Use the position type mentioned in the action text
                if "long position" in action_val.lower():
                    trade_type = 'Long'
                elif "short position" in action_val.lower():
                    trade_type = 'Short'
                else:
                    trade_type = 'Short'  # Default to Short based on sample data
            
            # Extract symbol from action (e.g. "Close short position for symbol CME_MINI:NQ!1")
            symbol_match = re.search(r'symbol\s+([^\s]+)', action_val)
            if symbol_match:
                symbol = symbol_match.group(1).strip().upper()
            else:
                symbol = parts[1].strip().upper()

            # Parse P&L directly from the P&L column if available
            pl = None
            if pl_col and pd.notna(row[pl_col]):
                try:
                    # For this specific data format, ensure negative values are preserved
                    raw_pl = row[pl_col]
                    # The CSV contains negative values with a negative sign already
                    # Convert to float and preserve the negative sign
                    pl = float(raw_pl)
                except:
                    # If conversion fails, try to strip currency symbols and commas
                    try:
                        pl_str = str(row[pl_col]).replace(',', '').strip()
                        pl_str = re.sub(r'[^\d.-]', '', pl_str)  # Remove all except digits, dot, and minus
                        pl = float(pl_str)
                    except:
                        # Fallback to calculating from balances if all parsing fails
                        pl = exit_price - entry_price
            
            if pl is None:
                # Calculate P&L from price differences if no P&L column or parsing failed
                if trade_type == 'Long':
                    pl = exit_price - entry_price
                else: 
                    pl = entry_price - exit_price

            # Compute P&L percentage 
            pl_percent = (pl / entry_price * 100) if entry_price else 0.0

            # Extract size if available in the action text
            size_match = re.search(r'for\s+(\d+(?:\.\d+)?)\s+units', action_val)
            size = float(size_match.group(1)) if size_match else 1.0

            # Extract price if available
            price_match = re.search(r'at price\s+(\d+(?:\.\d+)?)', action_val)
            price = float(price_match.group(1)) if price_match else None

            trades.append({
                'date': date_str,
                'symbol': symbol,
                'type': trade_type,
                'size': size,
                'entry': entry_price,
                'exit': exit_price,
                'pl': pl,  # This should now correctly handle negative values
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