from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import trades, accounts, analytics
from app.utils import db

# Initialize FastAPI app
app = FastAPI(
    title="Trading Journal API",
    description="API for Trading Journal application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
db.init_db()

# Include routers
app.include_router(trades.router)
app.include_router(accounts.router)
app.include_router(analytics.router)

@app.get("/")
async def root():
    return {"message": "Trading Journal API is running"} 