from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text, Enum, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import enum
import os
from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()

# Use SQLite as default database
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./trading_journal.db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    pool_pre_ping=True
)
# Enable WAL mode to improve concurrency and prevent database locking
with engine.connect() as conn:
    conn.execute(text("PRAGMA journal_mode=WAL"))

Base = declarative_base()

class TradeTypeEnum(enum.Enum):
    LONG = "Long"
    SHORT = "Short"

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Trade(Base):
    __tablename__ = "trades"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    symbol = Column(String, index=True)
    type = Column(String, index=True)  # Using String for simplicity
    size = Column(Float)
    entry = Column(Float)
    exit = Column(Float)
    pl = Column(Float)
    pl_percent = Column(Float)
    notes = Column(Text, nullable=True)
    account = Column(String, index=True)
    session = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 