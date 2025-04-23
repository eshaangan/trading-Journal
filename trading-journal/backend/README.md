# Trading Journal Backend

A FastAPI-based backend for the Trading Journal application.

## Features

- REST API for trade management
- CSV import functionality
- Multi-account support
- Trading analytics and statistics
- SQLite database (configurable for other databases)

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file (optional, for custom configuration):
   ```
   PORT=8000
   DATABASE_URL=sqlite:///./trading_journal.db
   ```

## Running the Application

To run the development server:

```bash
python run.py
```

The API will be available at http://localhost:8000

## API Documentation

Once the server is running, you can access the auto-generated API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Trades

- `GET /api/trades` - Get all trades (with optional filtering)
- `GET /api/trades/{id}` - Get a specific trade
- `POST /api/trades` - Create a new trade
- `PUT /api/trades/{id}` - Update a trade
- `DELETE /api/trades/{id}` - Delete a trade
- `POST /api/trades/import` - Import trades from CSV

### Accounts

- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Create a new account
- `PUT /api/accounts/{id}` - Update an account
- `DELETE /api/accounts/{id}` - Delete an account and all its trades

### Analytics

- `GET /api/analytics/metrics` - Get trading metrics
- `GET /api/analytics/performance/symbol` - Get performance by symbol
- `GET /api/analytics/performance/day` - Get performance by day of week
- `GET /api/analytics/cumulative-pl` - Get cumulative P&L data for charting 