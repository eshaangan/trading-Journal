# Trading Journal Web App

A full-stack web application to track and analyze your trading performance with multi-account support.

## Features

- Upload and manage trades from CSV files
- View and edit trades in a journal format
- Track performance metrics (P&L, win rate, profit factor, etc.)
- Filter trades by symbol, type, session, and outcome
- Visualize performance with charts
- Support for multiple trading accounts
- Responsive design for desktop and mobile

## Project Structure

- `/backend` - FastAPI Python backend
- `/frontend` - HTML, CSS, JavaScript frontend

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd trading-journal/backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the backend:
   ```bash
   python run.py
   ```

   This will start the API server at http://localhost:8000

### Frontend Setup

The frontend is a static web application that can be served directly from the file system or using a simple HTTP server.

For development, you can use Python's built-in HTTP server:

```bash
cd trading-journal/frontend
python -m http.server 8080
```

Then open http://localhost:8080 in your browser.

## Using the Application

1. First, go to the Settings page and create at least one account (e.g., "Funded", "Paper")
2. You can then:
   - Import trades via CSV (see the sample_trades.csv file for the expected format)
   - Add trades manually using the "Add Trade" button
   - View your statistics in the Dashboard
   - Analyze your performance in the Analytics page
   - Search and filter your trades in the Trade Journal and Past Trades pages

## CSV Import Format

The application expects CSV files with the following columns:

| Column   | Description                              |
|----------|------------------------------------------|
| Date     | Trade date (YYYY-MM-DD)                  |
| Symbol   | Trading symbol                           |
| Type     | Trade type (Long or Short)               |
| Size     | Position size (number of shares/contracts)|
| Entry    | Entry price                              |
| Exit     | Exit price                               |
| P&L      | Profit/Loss amount                       |
| P&L %    | Profit/Loss percentage                   |
| Notes    | Optional notes about the trade           |

## Development

### Backend API Documentation

Once the backend is running, you can access the API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Technologies Used

- Backend:
  - Python
  - FastAPI
  - SQLite
  - Pandas (for data processing)

- Frontend:
  - HTML5, CSS3, JavaScript
  - Chart.js (for visualizations)
  - Flatpickr (for date picking) 