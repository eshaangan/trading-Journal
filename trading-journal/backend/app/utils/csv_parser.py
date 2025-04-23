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
        
        # Required columns
        required_columns = ['Date', 'Symbol', 'Type', 'Size', 'Entry', 'Exit', 'P&L', 'P&L %']
        
        # Check if all required columns exist
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns: {', '.join(missing_columns)}")
        
        # Clean column names
        df.columns = [col.strip() for col in df.columns]
        
        # Normalize the data
        trades = []
        for _, row in df.iterrows():
            # Parse date
            try:
                date_obj = pd.to_datetime(row['Date']).date()
            except Exception as e:
                raise ValueError(f"Invalid date format in row: {row['Date']}")
            
            # Validate trade type
            trade_type = row['Type'].strip().title()
            if trade_type not in ["Long", "Short"]:
                raise ValueError(f"Invalid trade type in row: {trade_type}")
            
            # Create a trade dictionary
            trade = {
                "date": date_obj.isoformat(),
                "symbol": row['Symbol'].strip().upper(),
                "type": trade_type,
                "size": float(row['Size']),
                "entry": float(row['Entry']),
                "exit": float(row['Exit']),
                "pl": float(row['P&L']),
                "pl_percent": float(row['P&L %'].strip('%') if isinstance(row['P&L %'], str) else row['P&L %']),
                "notes": row.get('Notes', ''),
                "account": account_name,
                # Determine session based on time if available, otherwise leave empty
                "session": ""
            }
            trades.append(trade)
        
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