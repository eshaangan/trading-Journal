from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.trade import Account, AccountCreate
from app.utils import db
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/api/accounts",
    tags=["accounts"]
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

@router.get("/", response_model=List[Account])
def get_accounts(db_session: Session = Depends(get_db_session)):
    """Get all accounts"""
    accounts = db.get_accounts(db_session)
    return accounts

@router.post("/", response_model=Account)
def create_account(account: AccountCreate, db_session: Session = Depends(get_db_session)):
    """Create a new account"""
    # Check if account with the same name already exists
    existing = db.get_account_by_name(db_session, account.name)
    if existing:
        raise HTTPException(status_code=400, detail=f"Account with name '{account.name}' already exists")
    
    created = db.create_account(db_session, account.dict())
    return created

@router.put("/{account_id}", response_model=Account)
def update_account(account_id: int, account: AccountCreate, db_session: Session = Depends(get_db_session)):
    """Update an account"""
    # Check if account exists
    existing_accounts = db.get_accounts(db_session)
    existing_account = next((a for a in existing_accounts if a["id"] == account_id), None)
    if not existing_account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Check if the new name conflicts with an existing account
    if existing_account["name"] != account.name:
        name_conflict = db.get_account_by_name(db_session, account.name)
        if name_conflict:
            raise HTTPException(status_code=400, detail=f"Account with name '{account.name}' already exists")
    
    success = db.update_account(db_session, account_id, account.dict())
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update account")
    
    return {**account.dict(), "id": account_id}

@router.delete("/{account_id}", response_model=dict)
def delete_account(account_id: int, db_session: Session = Depends(get_db_session)):
    """Delete an account and all its trades"""
    # Check if account exists
    existing_accounts = db.get_accounts(db_session)
    existing_account = next((a for a in existing_accounts if a["id"] == account_id), None)
    if not existing_account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    success = db.delete_account(db_session, account_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete account")
    
    return {"success": True, "message": f"Account {existing_account['name']} and all its trades deleted successfully"} 