from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from app.models.database import engine, Base
from typing import List, Dict, Any, Optional
import pandas as pd

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Initialize the database
def init_db():
    """Initialize the database by creating all tables"""
    Base.metadata.create_all(bind=engine)

# Get DB session
def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Trade CRUD operations
def create_trade(db, trade_data):
    """Create a new trade record"""
    query = """
    INSERT INTO trades 
    (date, symbol, type, size, entry, exit, pl, pl_percent, notes, account, session)
    VALUES (:date, :symbol, :type, :size, :entry, :exit, :pl, :pl_percent, :notes, :account, :session)
    RETURNING id
    """
    result = db.execute(text(query), trade_data)
    # Fetch the returned id before committing to avoid SQLite locked errors
    id_value = result.fetchone()[0]
    # Close the result to release the cursor
    result.close()
    db.commit()
    return {"id": id_value, **trade_data}

def get_trades(db, account=None, symbol=None, trade_type=None, start_date=None, end_date=None):
    """Get trades with optional filtering"""
    query = """
    SELECT id, date, symbol, type, size, entry, exit, pl, pl_percent, notes, account, session,
           created_at, updated_at
    FROM trades
    WHERE 1=1
    """
    params = {}
    
    if account:
        query += " AND account = :account"
        params["account"] = account
        
    if symbol:
        query += " AND symbol = :symbol"
        params["symbol"] = symbol
        
    if trade_type:
        query += " AND type = :type"
        params["type"] = trade_type
        
    if start_date:
        query += " AND date >= :start_date"
        params["start_date"] = start_date
        
    if end_date:
        query += " AND date <= :end_date"
        params["end_date"] = end_date
        
    query += " ORDER BY date DESC"
    
    result = db.execute(text(query), params)
    # Convert result rows to list of dicts
    return result.mappings().all()

def get_trade_by_id(db, trade_id):
    """Get a single trade by ID"""
    query = """
    SELECT id, date, symbol, type, size, entry, exit, pl, pl_percent, notes, account, session,
           created_at, updated_at
    FROM trades
    WHERE id = :id
    """
    row = db.execute(text(query), {"id": trade_id}).fetchone()
    if row:
        # Convert Row object to dict
        return dict(row._mapping)
    return None

def update_trade(db, trade_id, trade_data):
    """Update an existing trade"""
    query = """
    UPDATE trades
    SET date = :date,
        symbol = :symbol,
        type = :type,
        size = :size,
        entry = :entry,
        exit = :exit,
        pl = :pl,
        pl_percent = :pl_percent,
        notes = :notes,
        account = :account,
        session = :session,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = :id
    RETURNING id
    """
    params = {**trade_data, "id": trade_id}
    result = db.execute(text(query), params)
    db.commit()
    return result.rowcount > 0

def delete_trade(db, trade_id):
    """Delete a trade"""
    query = "DELETE FROM trades WHERE id = :id"
    result = db.execute(text(query), {"id": trade_id})
    db.commit()
    return result.rowcount > 0

# Account CRUD operations
def create_account(db, account_data):
    """Create a new account"""
    query = """
    INSERT INTO accounts (name, description)
    VALUES (:name, :description)
    RETURNING id
    """
    result = db.execute(text(query), account_data)
    # Fetch the returned id before committing to avoid SQLite locked errors
    id_value = result.fetchone()[0]
    # Close the result to release the cursor
    result.close()
    db.commit()
    return {"id": id_value, **account_data}

def get_accounts(db):
    """Get all accounts"""
    query = "SELECT id, name, description FROM accounts ORDER BY name"
    result = db.execute(text(query))
    # Convert result rows to list of dicts
    return result.mappings().all()

def get_account_by_name(db, name):
    """Get account by name"""
    query = "SELECT id, name, description FROM accounts WHERE name = :name"
    # Execute the query and get the first mapping (RowMapping) result
    result = db.execute(text(query), {"name": name})
    account_mapping = result.mappings().first()
    # mappings().first() returns None if no results, or a RowMapping (dict-like)
    return dict(account_mapping) if account_mapping else None

def update_account(db, account_id, account_data):
    """Update an account"""
    query = """
    UPDATE accounts
    SET name = :name,
        description = :description,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = :id
    RETURNING id
    """
    params = {**account_data, "id": account_id}
    result = db.execute(text(query), params)
    db.commit()
    return result.rowcount > 0

def delete_account(db, account_id):
    """Delete an account and all its trades"""
    # First, get the account name
    account_query = "SELECT name FROM accounts WHERE id = :id"
    account = db.execute(text(account_query), {"id": account_id}).fetchone()
    
    if not account:
        return False
    
    # Delete all trades for this account
    trades_query = "DELETE FROM trades WHERE account = :account"
    db.execute(text(trades_query), {"account": account[0]})
    
    # Delete the account
    account_delete_query = "DELETE FROM accounts WHERE id = :id"
    result = db.execute(text(account_delete_query), {"id": account_id})
    
    db.commit()
    return result.rowcount > 0 