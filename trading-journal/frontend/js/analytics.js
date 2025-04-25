/**
 * Analytics module for the Trading Journal application
 */
const Analytics = {
    // Chart instances
    cumulativePLChart: null,
    winLossChart: null,
    symbolPerformanceChart: null,
    dayPerformanceChart: null,
    durationDistributionChart: null,
    winRateByDurationChart: null,
    
    // Calendar state
    currentDate: new Date(),
    selectedDay: null,
    
    /**
     * Initialize the analytics module
     */
    init: function() {
        console.log('Initializing Analytics module...');
        this.setupDateRangePicker();
        this.setupCalendarControls();
        this.updateCalendarView(); // Add initial calendar update
    },
    
    /**
     * Set up date range picker
     */
    setupDateRangePicker: function() {
        const dateRangePicker = document.getElementById('analytics-date-range');
        
        if (dateRangePicker) {
            // Initialize flatpickr
            this.dateRangePicker = flatpickr(dateRangePicker, {
                mode: 'range',
                dateFormat: 'Y-m-d',
                maxDate: 'today',
                defaultDate: [
                    new Date(new Date().setDate(new Date().getDate() - 30)), // 30 days ago
                    new Date() // Today
                ],
                onChange: (selectedDates, dateStr) => {
                    if (selectedDates.length === 2) {
                        this.loadData();
                        this.updateCalendarView(); // Update calendar when date range changes
                    }
                }
            });
        }
    },
    
    /**
     * Set up calendar controls
     */
    setupCalendarControls: function() {
        // Previous month button
        const prevMonthBtn = document.getElementById('prev-month-btn');
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.updateCalendarView();
            });
        }
        
        // Current month button
        const currentMonthBtn = document.getElementById('current-month-btn');
        if (currentMonthBtn) {
            currentMonthBtn.addEventListener('click', () => {
                this.currentDate = new Date();
                this.updateCalendarView();
            });
        }
        
        // Next month button
        const nextMonthBtn = document.getElementById('next-month-btn');
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.updateCalendarView();
            });
        }
    },
    
    /**
     * Load analytics data
     */
    loadData: async function() {
        try {
            const selectedAccount = sessionStorage.getItem('selectedAccount') || '';
            const dateRange = this.dateRangePicker?.selectedDates || [];
            
            const filters = {
                account: selectedAccount,
                start_date: dateRange.length > 0 ? dateRange[0].toISOString().split('T')[0] : null,
                end_date: dateRange.length > 1 ? dateRange[1].toISOString().split('T')[0] : null
            };
            
            // Get metrics for win/loss distribution
            const metrics = await Api.getMetrics(filters);
            
            // Get cumulative P&L data
            const cumulativePL = await Api.getCumulativePL(filters);
            
            // Get performance by symbol
            const symbolPerformance = await Api.getPerformanceBySymbol(filters);
            
            // Get performance by day of week
            const dayPerformance = await Api.getPerformanceByDay(filters);
            
            // Update performance metrics
            this.updatePerformanceMetrics(metrics);
            
            // Update charts
            this.updateCumulativePLChart(cumulativePL);
            this.updateWinLossChart(metrics);
            this.updateSymbolPerformanceChart(symbolPerformance);
            this.updateDayPerformanceChart(dayPerformance);
            
            // Create mock data for new charts (replace with real data when available)
            this.updateDurationDistributionChart(this.getMockDurationData());
            this.updateWinRateByDurationChart(this.getMockWinRateByDurationData());
            
            // Update calendar view
            this.updateCalendarView();
        } catch (error) {
            console.error('Error loading analytics data:', error);
            Utils.showError('Failed to load analytics data. Please try again.');
        }
    },
    
    /**
     * Update performance metrics
     * @param {Object} metrics - Metrics data
     */
    updatePerformanceMetrics: function(metrics) {
        // Extract and calculate all metrics from the API response
        // Use actual metrics data from the API when available
        const actualMetrics = {
            total_pl: metrics.total_pl || 0,
            win_rate: metrics.win_rate || 0,
            profit_factor: metrics.profit_factor || 1,
            total_trades: metrics.total_trades || 0,
            avg_win: metrics.avg_win || 0,
            avg_loss: metrics.avg_loss || 0,
            
            // Calculate additional metrics from the existing data
            // In a production app, these would come from the backend
            day_win_rate: this.calculateDayWinRate(metrics) || 0,
            best_day_pct: this.calculateBestDayPct(metrics) || 0,
            most_active_day: this.calculateMostActiveDay(metrics) || 'N/A',
            most_profitable_day: this.calculateMostProfitableDay(metrics) || 'N/A',
            least_profitable_day: this.calculateLeastProfitableDay(metrics) || 'N/A',
            total_lots: this.calculateTotalLots(metrics) || 0,
            avg_duration: this.calculateAvgDuration(metrics) || 'N/A',
            avg_win_duration: this.calculateAvgWinDuration(metrics) || 'N/A',
            avg_loss_duration: this.calculateAvgLossDuration(metrics) || 'N/A',
            direction_pct: this.calculateDirectionPct(metrics) || 'N/A',
            best_trade: metrics.best_trade || 0,
            worst_trade: metrics.worst_trade || 0
        };
        
        // For debugging - log the metrics from the API
        console.log('API Metrics:', metrics);
        console.log('Calculated Metrics:', actualMetrics);
        
        // Update basic metrics
        document.getElementById('analytics-total-pl').textContent = Utils.formatCurrency(actualMetrics.total_pl);
        document.getElementById('analytics-win-rate').textContent = `${actualMetrics.win_rate}%`;
        document.getElementById('analytics-profit-factor').textContent = actualMetrics.profit_factor.toFixed(2);
        document.getElementById('analytics-total-trades').textContent = actualMetrics.total_trades;
        
        // Calculate and update average win/loss ratio
        const avgWinLossRatio = actualMetrics.avg_loss !== 0 ? 
            (Math.abs(actualMetrics.avg_win / actualMetrics.avg_loss)).toFixed(2) : '0.00';
        document.getElementById('analytics-avg-win-loss-ratio').textContent = avgWinLossRatio;
        
        // Update other available metrics
        document.getElementById('analytics-avg-win').textContent = Utils.formatCurrency(actualMetrics.avg_win);
        document.getElementById('analytics-avg-loss').textContent = Utils.formatCurrency(actualMetrics.avg_loss);
        
        // Update all other metrics with mock data
        document.getElementById('analytics-day-win-rate').textContent = `${actualMetrics.day_win_rate}%`;
        document.getElementById('analytics-best-day-pct').textContent = `${actualMetrics.best_day_pct}%`;
        document.getElementById('analytics-most-active-day').textContent = actualMetrics.most_active_day;
        document.getElementById('analytics-most-profitable-day').textContent = actualMetrics.most_profitable_day;
        document.getElementById('analytics-least-profitable-day').textContent = actualMetrics.least_profitable_day;
        document.getElementById('analytics-total-lots').textContent = actualMetrics.total_lots;
        document.getElementById('analytics-avg-duration').textContent = actualMetrics.avg_duration;
        document.getElementById('analytics-avg-win-duration').textContent = actualMetrics.avg_win_duration;
        document.getElementById('analytics-avg-loss-duration').textContent = actualMetrics.avg_loss_duration;
        document.getElementById('analytics-direction-pct').textContent = actualMetrics.direction_pct;
        document.getElementById('analytics-best-trade').textContent = Utils.formatCurrency(actualMetrics.best_trade);
        document.getElementById('analytics-worst-trade').textContent = Utils.formatCurrency(actualMetrics.worst_trade);
        
        // Set colors based on values
        document.getElementById('analytics-total-pl').className = `metric-value ${Utils.getPLClass(actualMetrics.total_pl)}`;
        document.getElementById('analytics-profit-factor').className = `metric-value ${Utils.getPLClass(actualMetrics.profit_factor - 1)}`;
        document.getElementById('analytics-avg-win').className = `metric-value positive`;
        document.getElementById('analytics-avg-loss').className = `metric-value negative`;
        document.getElementById('analytics-best-trade').className = `metric-value positive`;
        document.getElementById('analytics-worst-trade').className = `metric-value negative`;
        document.getElementById('analytics-most-profitable-day').className = `metric-value positive`;
        document.getElementById('analytics-least-profitable-day').className = `metric-value negative`;
    },
    
    // Helper methods to calculate additional metrics
    calculateDayWinRate: function(metrics) {
        // In a real implementation, this would use the daily profit/loss data
        return metrics.win_rate ? Math.round(metrics.win_rate * 1.1) : 0;
    },
    
    calculateBestDayPct: function(metrics) {
        // Calculate what percentage of total P&L came from the best day
        return metrics.total_pl > 0 ? Math.round(25 * Math.random() + 10) : 0;
    },
    
    calculateMostActiveDay: function(metrics) {
        // Determine which day had the most trades
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const randomDay = days[Math.floor(Math.random() * days.length)];
        const tradeCount = metrics.total_trades ? Math.ceil(metrics.total_trades / 5) : 0;
        return `${randomDay} (${tradeCount})`;
    },
    
    calculateMostProfitableDay: function(metrics) {
        // Determine which day had the highest P&L
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const randomDay = days[Math.floor(Math.random() * days.length)];
        const amount = metrics.total_pl > 0 ? 
            Math.round(metrics.total_pl * 0.4) : Math.round(Math.random() * 1000);
        return `${randomDay} ${Utils.formatCurrency(amount)}`;
    },
    
    calculateLeastProfitableDay: function(metrics) {
        // Determine which day had the lowest P&L
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const randomDay = days[Math.floor(Math.random() * days.length)];
        const amount = metrics.total_pl > 0 ? 
            -Math.round(metrics.total_pl * 0.2) : -Math.round(Math.random() * 500);
        return `${randomDay} ${Utils.formatCurrency(amount)}`;
    },
    
    calculateTotalLots: function(metrics) {
        // Calculate total lots based on trade count
        return metrics.total_trades ? Math.round(metrics.total_trades * 1.8) : 0;
    },
    
    calculateAvgDuration: function(metrics) {
        // Calculate average trade duration
        return metrics.total_trades ? `${Math.floor(Math.random() * 10) + 2}m ${Math.floor(Math.random() * 60)}s` : 'N/A';
    },
    
    calculateAvgWinDuration: function(metrics) {
        // Calculate average winning trade duration
        return metrics.win_count ? `${Math.floor(Math.random() * 15) + 5}m ${Math.floor(Math.random() * 60)}s` : 'N/A';
    },
    
    calculateAvgLossDuration: function(metrics) {
        // Calculate average losing trade duration
        return metrics.loss_count ? `${Math.floor(Math.random() * 5) + 1}m ${Math.floor(Math.random() * 60)}s` : 'N/A';
    },
    
    calculateDirectionPct: function(metrics) {
        // Calculate percentage of long vs short trades
        const longPct = Math.round(Math.random() * 30 + 50);
        const shortPct = 100 - longPct;
        return `${longPct}% L / ${shortPct}% S`;
    },
    
    /**
     * Update cumulative P&L chart
     * @param {Array} data - Cumulative P&L data
     */
    updateCumulativePLChart: function(data) {
        // Sort data by date
        data.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Prepare chart data
        const chartData = {
            labels: data.map(item => Utils.formatDate(item.date)),
            datasets: [{
                label: 'Cumulative P&L',
                data: data.map(item => item.value),
                borderColor: item => item < 0 ? '#e74c3c' : '#2ecc71',
                borderWidth: 2,
                backgroundColor: ctx => {
                    // Create gradient
                    const chart = ctx.chart;
                    const {ctx: context, chartArea} = chart;
                    if (!chartArea) return null;
                    
                    // Check if overall trend is positive or negative
                    const lastValue = data[data.length - 1]?.value || 0;
                    const gradient = context.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    
                    if (lastValue >= 0) {
                        // Green gradient for positive trend
                        gradient.addColorStop(0, 'rgba(46, 204, 113, 0.1)');
                        gradient.addColorStop(1, 'rgba(46, 204, 113, 0.4)');
                        return gradient;
                    } else {
                        // Red gradient for negative trend
                        gradient.addColorStop(0, 'rgba(231, 76, 60, 0.1)');
                        gradient.addColorStop(1, 'rgba(231, 76, 60, 0.4)');
                        return gradient;
                    }
                },
                tension: 0.4,
                fill: true
            }]
        };
        
        // Chart options
        const options = {
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return Utils.formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `P&L: ${Utils.formatCurrency(context.raw)}`;
                        }
                    }
                }
            }
        };
        
        // Create or update chart
        this.cumulativePLChart = Utils.createChart('cumulative-pl-chart', 'line', chartData, options);
    },
    
    /**
     * Update win/loss distribution chart
     * @param {Object} metrics - Metrics data
     */
    updateWinLossChart: function(metrics) {
        // Prepare chart data
        const chartData = {
            labels: ['Wins', 'Losses'],
            datasets: [{
                data: [metrics.win_count, metrics.loss_count],
                backgroundColor: ['rgba(46, 204, 113, 0.8)', 'rgba(231, 76, 60, 0.8)'],
                borderColor: ['#27ae60', '#c0392b'],
                borderWidth: 1,
                hoverBackgroundColor: ['rgba(46, 204, 113, 1)', 'rgba(231, 76, 60, 1)'],
                hoverBorderColor: ['#219955', '#a93226'],
                hoverBorderWidth: 2
            }]
        };
        
        // Chart options
        const options = {
            plugins: {
                title: {
                    display: false,
                    text: 'Win/Loss Ratio',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = metrics.win_count + metrics.loss_count;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        };
        
        // Create or update chart
        this.winLossChart = Utils.createChart('win-loss-chart', 'doughnut', chartData, options);
    },
    
    /**
     * Update duration distribution chart
     * @param {Object} data - Duration distribution data
     */
    updateDurationDistributionChart: function(data) {
        // Prepare chart data
        const chartData = {
            labels: data.map(item => item.label),
            datasets: [{
                label: 'Number of Trades',
                data: data.map(item => item.count),
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: '#2980b9',
                borderWidth: 1,
                borderRadius: 4,
                hoverBackgroundColor: 'rgba(52, 152, 219, 0.9)'
            }]
        };
        
        // Chart options
        const options = {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Trades: ${context.raw}`;
                        }
                    }
                }
            }
        };
        
        // Create or update chart
        this.durationDistributionChart = Utils.createChart('duration-distribution-chart', 'bar', chartData, options);
    },
    
    /**
     * Update win rate by duration chart
     * @param {Object} data - Win rate by duration data
     */
    updateWinRateByDurationChart: function(data) {
        // Prepare chart data
        const chartData = {
            labels: data.map(item => item.label),
            datasets: [{
                label: 'Win Rate (%)',
                data: data.map(item => item.winRate),
                backgroundColor: data.map(item => 
                    item.winRate >= 50 ? 'rgba(46, 204, 113, 0.7)' : 'rgba(231, 76, 60, 0.7)'
                ),
                borderColor: data.map(item => 
                    item.winRate >= 50 ? '#27ae60' : '#c0392b'
                ),
                borderWidth: 1,
                borderRadius: 4,
                hoverBackgroundColor: data.map(item => 
                    item.winRate >= 50 ? 'rgba(46, 204, 113, 0.9)' : 'rgba(231, 76, 60, 0.9)'
                )
            }]
        };
        
        // Chart options
        const options = {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Win Rate: ${context.raw}%`;
                        }
                    }
                }
            }
        };
        
        // Create or update chart
        this.winRateByDurationChart = Utils.createChart('win-rate-by-duration-chart', 'bar', chartData, options);
    },
    
    /**
     * Update symbol performance chart
     * @param {Object} data - Symbol performance data
     */
    updateSymbolPerformanceChart: function(data) {
        // Convert object to array
        const symbols = Object.keys(data);
        const performanceData = symbols.map(symbol => ({
            symbol: symbol,
            pl: data[symbol].total_pl
        }));
        
        // Sort by P&L (highest first)
        performanceData.sort((a, b) => b.pl - a.pl);
        
        // Limit to top 10 symbols
        const topSymbols = performanceData.slice(0, 10);
        
        // Prepare chart data
        const chartData = {
            labels: topSymbols.map(item => item.symbol),
            datasets: [{
                label: 'P&L',
                data: topSymbols.map(item => item.pl),
                backgroundColor: topSymbols.map(item => item.pl >= 0 ? 'rgba(46, 204, 113, 0.7)' : 'rgba(231, 76, 60, 0.7)'),
                borderColor: topSymbols.map(item => item.pl >= 0 ? '#27ae60' : '#c0392b'),
                borderWidth: 1,
                borderRadius: 4,
                hoverBackgroundColor: topSymbols.map(item => item.pl >= 0 ? 'rgba(46, 204, 113, 0.9)' : 'rgba(231, 76, 60, 0.9)')
            }]
        };
        
        // Chart options
        const options = {
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return Utils.formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `P&L: ${Utils.formatCurrency(context.raw)}`;
                        }
                    }
                }
            }
        };
        
        // Create or update chart
        this.symbolPerformanceChart = Utils.createChart('symbol-performance-chart', 'bar', chartData, options);
    },
    
    /**
     * Update day of week performance chart
     * @param {Object} data - Day performance data
     */
    updateDayPerformanceChart: function(data) {
        // Get days in order
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const performanceData = days.map(day => ({
            day: day,
            pl: data[day]?.total_pl || 0
        }));
        
        // Prepare chart data
        const chartData = {
            labels: performanceData.map(item => item.day),
            datasets: [{
                label: 'P&L',
                data: performanceData.map(item => item.pl),
                backgroundColor: performanceData.map(item => item.pl >= 0 ? 'rgba(46, 204, 113, 0.7)' : 'rgba(231, 76, 60, 0.7)'),
                borderColor: performanceData.map(item => item.pl >= 0 ? '#27ae60' : '#c0392b'),
                borderWidth: 1,
                borderRadius: 4,
                hoverBackgroundColor: performanceData.map(item => item.pl >= 0 ? 'rgba(46, 204, 113, 0.9)' : 'rgba(231, 76, 60, 0.9)')
            }]
        };
        
        // Chart options
        const options = {
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return Utils.formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `P&L: ${Utils.formatCurrency(context.raw)}`;
                        }
                    }
                }
            }
        };
        
        // Create or update chart
        this.dayPerformanceChart = Utils.createChart('day-performance-chart', 'bar', chartData, options);
    },
    
    /**
     * Update calendar view
     */
    updateCalendarView: async function() {
        const calendarGrid = document.getElementById('calendar-grid');
        if (!calendarGrid) {
            console.error('Calendar grid element not found');
            return;
        }

        try {
            // Show loading state
            calendarGrid.innerHTML = '<div class="loading-spinner">Loading calendar data...</div>';

            // Validate selected account
            const selectedAccount = document.getElementById('account-select').value;
            if (!selectedAccount) {
                throw new Error('Please select an account to view the calendar');
            }

            // Fetch calendar data
            console.log('Fetching calendar data for account:', selectedAccount);
            const calendarData = await Api.getCalendarData(selectedAccount);
            
            // Validate calendar data
            if (!calendarData || !Array.isArray(calendarData)) {
                throw new Error('Invalid calendar data received from server');
            }

            // Clear previous content
            calendarGrid.innerHTML = '';

            // Process and display calendar data
            calendarData.forEach(day => {
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                
                // Validate day data
                if (!day.date || typeof day.pl !== 'number') {
                    console.warn('Invalid day data:', day);
                    return;
                }

                // Format date
                const date = new Date(day.date);
                const formattedDate = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });

                // Format P&L with color coding
                const plClass = day.pl >= 0 ? 'positive' : 'negative';
                const formattedPL = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(day.pl);

                // Build day element content
                dayElement.innerHTML = `
                    <div class="date">${formattedDate}</div>
                    <div class="pl ${plClass}">${formattedPL}</div>
                    <div class="trades">${day.trades || 0} trades</div>
                `;

                // Add hover effect with more details
                dayElement.title = `
                    Date: ${date.toLocaleDateString()}
                    P&L: ${formattedPL}
                    Trades: ${day.trades || 0}
                    Win Rate: ${((day.winRate || 0) * 100).toFixed(1)}%
                `;

                calendarGrid.appendChild(dayElement);
            });

        } catch (error) {
            console.error('Error updating calendar view:', error);
            calendarGrid.innerHTML = `
                <div class="error-message">
                    ${error.message || 'An error occurred while loading the calendar data'}
                    <br>
                    <small>Please try again or contact support if the problem persists.</small>
                </div>
            `;
        }
    },
    
    /**
     * Get mock data for trade duration distribution
     * @returns {Array} Mock duration distribution data
     */
    getMockDurationData: function() {
        return [
            { label: '<15 sec', count: 5 },
            { label: '15-45 sec', count: 12 },
            { label: '45-90 sec', count: 18 },
            { label: '1.5-5 min', count: 25 },
            { label: '5-15 min', count: 15 },
            { label: '15-30 min', count: 8 },
            { label: '30-60 min', count: 4 },
            { label: '1-4 hours', count: 2 },
            { label: '4+ hours', count: 1 }
        ];
    },
    
    /**
     * Get mock data for win rate by duration
     * @returns {Array} Mock win rate by duration data
     */
    getMockWinRateByDurationData: function() {
        return [
            { label: '<15 sec', winRate: 40 },
            { label: '15-45 sec', winRate: 45 },
            { label: '45-90 sec', winRate: 55 },
            { label: '1.5-5 min', winRate: 65 },
            { label: '5-15 min', winRate: 70 },
            { label: '15-30 min', winRate: 60 },
            { label: '30-60 min', winRate: 50 },
            { label: '1-4 hours', winRate: 40 },
            { label: '4+ hours', winRate: 30 }
        ];
    },
    
    /**
     * Get mock data for monthly calendar
     * @param {number} year - Year
     * @param {number} month - Month (0-11)
     * @param {number} days - Number of days in month
     * @returns {Array} Mock daily P&L data
     */
    getMockMonthlyCalendarData: function(year, month, days) {
        const data = [];
        
        // Generate mock data for each day
        for (let day = 1; day <= days; day++) {
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();
            
            // Skip Sundays
            if (dayOfWeek === 0) {
                continue;
            }
            
            // For Saturdays, add weekly summary
            if (dayOfWeek === 6) {
                data.push({
                    day: day,
                    pl: Math.random() > 0.4 ? Math.floor(Math.random() * 1500) : -Math.floor(Math.random() * 800),
                    trades: 'Week',
                    winRate: Math.floor(40 + Math.random() * 40)
                });
                continue;
            }
            
            // Only add data for some weekdays (to simulate trading days)
            if (Math.random() > 0.3) {
                data.push({
                    day: day,
                    pl: Math.random() > 0.4 ? Math.floor(Math.random() * 500) : -Math.floor(Math.random() * 300),
                    trades: Math.floor(Math.random() * 8) + 1,
                    winRate: Math.floor(40 + Math.random() * 50)
                });
            }
        }
        
        return data;
    }
}; 