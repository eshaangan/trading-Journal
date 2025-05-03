# Trading Journal Application

A comprehensive full-stack trading journal application built with Python (FastAPI) and JavaScript, designed to help traders track and analyze their trading performance.

![Trading Journal Dashboard](screenshots/dashboard.png)

## Features

### Dashboard
- Real-time performance metrics
- Key statistics including Win Rate, Profit Factor, and Maximum Drawdown
- Interactive charts showing P&L trends
- Daily performance calendar view

### Trade Management
- Easy trade entry with symbol, entry/exit prices, and position size
- Support for both long and short positions
- Trade duration tracking
- Notes and tags for trade categorization

### Analytics
- Comprehensive performance metrics
- Symbol-wise performance analysis
- Trading patterns by day of week
- Win rate analysis by trade duration
- Cumulative P&L tracking
- Trade distribution analysis

### User Experience
- Responsive design for desktop and mobile
- Dark/Light theme support
- Interactive tooltips for metrics
- Real-time calculations and updates

## Technology Stack

### Backend
- Python 3.11+
- FastAPI
- SQLite Database
- Pandas for data analysis
- NumPy for calculations

### Frontend
- Vanilla JavaScript
- HTML5
- CSS3
- Chart.js for data visualization

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/trading-journal.git
   cd trading-journal
   ```

2. Set up the backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up the database:
   ```bash
   python init_db.py
   ```

4. Start the backend server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

5. Start the frontend (in a new terminal):
   ```bash
   cd frontend
   python -m http.server 8081
   ```

6. Open your browser and navigate to:
   ```
   http://localhost:8081
   ```

## API Documentation

The backend API is documented using OpenAPI (Swagger) and can be accessed at:
```
http://localhost:8000/docs
```

## Project Structure

```
trading-journal/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   └── utils/
│   │       └── analytics.py
│   ├── requirements.txt
│   └── init_db.py
└── frontend/
    ├── index.html
    ├── css/
    │   └── styles.css
    └── js/
        ├── app.js
        ├── analytics.js
        └── utils.js
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Screenshots

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Analytics
![Analytics](screenshots/analytics.png)

### Trade Entry
![Trade Entry](screenshots/trade-entry.png)

Note: Replace `screenshots/*.png` with actual screenshots of your application. 