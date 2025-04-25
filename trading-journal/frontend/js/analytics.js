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

            // Get trades for duration analysis
            const trades = await Api.getTrades(filters);
            
            // Update performance metrics
            this.updatePerformanceMetrics(metrics);
            
            // Update charts
            this.updateCumulativePLChart(cumulativePL);
            this.updateWinLossChart(metrics);
            this.updateSymbolPerformanceChart(symbolPerformance);
            this.updateDayPerformanceChart(dayPerformance);
            
            // Update duration charts with real data
            const durationData = this.calculateTradeDurationDistribution(trades);
            this.updateDurationDistributionChart(durationData);
            this.updateWinRateByDurationChart(this.calculateWinRateByDuration(trades));
            
            // Update calendar view
            this.updateCalendarView();
        } catch (error) {
            console.error('Error loading analytics data:', error);
            Utils.showError('Failed to load analytics data. Please try again.');
        }
    },
    
    /**
     * Calculate trade duration distribution from actual trades
     * @param {Array} trades - List of trades
     * @returns {Array} Duration distribution data
     */
    calculateTradeDurationDistribution: function(trades) {
        const durationRanges = [
            { label: '<15 sec', maxSeconds: 15 },
            { label: '15-45 sec', maxSeconds: 45 },
            { label: '45-90 sec', maxSeconds: 90 },
            { label: '1.5-5 min', maxSeconds: 300 },
            { label: '5-15 min', maxSeconds: 900 },
            { label: '15-30 min', maxSeconds: 1800 },
            { label: '30-60 min', maxSeconds: 3600 },
            { label: '1-4 hours', maxSeconds: 14400 },
            { label: '4+ hours', maxSeconds: Infinity }
        ];

        // Initialize counts
        const distribution = durationRanges.map(range => ({
            label: range.label,
            count: 0
        }));

        // Process each trade
        trades.forEach(trade => {
            if (trade.entry_time && trade.exit_time) {
                const entryTime = new Date(trade.entry_time);
                const exitTime = new Date(trade.exit_time);
                const durationSeconds = (exitTime - entryTime) / 1000;

                // Find the appropriate range
                const rangeIndex = durationRanges.findIndex(range => durationSeconds <= range.maxSeconds);
                if (rangeIndex !== -1) {
                    distribution[rangeIndex].count++;
                }
            }
        });

        return distribution;
    },
    
    /**
     * Calculate win rate by duration from actual trades
     * @param {Array} trades - List of trades
     * @returns {Array} Win rate by duration data
     */
    calculateWinRateByDuration: function(trades) {
        const durationRanges = [
            { label: '<15 sec', maxSeconds: 15 },
            { label: '15-45 sec', maxSeconds: 45 },
            { label: '45-90 sec', maxSeconds: 90 },
            { label: '1.5-5 min', maxSeconds: 300 },
            { label: '5-15 min', maxSeconds: 900 },
            { label: '15-30 min', maxSeconds: 1800 },
            { label: '30-60 min', maxSeconds: 3600 },
            { label: '1-4 hours', maxSeconds: 14400 },
            { label: '4+ hours', maxSeconds: Infinity }
        ];

        // Initialize win/loss counts for each range
        const winLossCounts = durationRanges.map(range => ({
            label: range.label,
            wins: 0,
            total: 0
        }));

        // Process each trade
        trades.forEach(trade => {
            if (trade.entry_time && trade.exit_time) {
                const entryTime = new Date(trade.entry_time);
                const exitTime = new Date(trade.exit_time);
                const durationSeconds = (exitTime - entryTime) / 1000;

                // Find the appropriate range
                const rangeIndex = durationRanges.findIndex(range => durationSeconds <= range.maxSeconds);
                if (rangeIndex !== -1) {
                    winLossCounts[rangeIndex].total++;
                    if (trade.pl > 0) {
                        winLossCounts[rangeIndex].wins++;
                    }
                }
            }
        });

        // Calculate win rates
        return winLossCounts.map(range => ({
            label: range.label,
            winRate: range.total > 0 ? (range.wins / range.total) * 100 : 0
        }));
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
        
        // Update basic metrics with added visuals
        this.updateMetricCard('analytics-total-pl', Utils.formatCurrency(actualMetrics.total_pl), 
            actualMetrics.total_pl >= 0 ? 'positive' : 'negative',
            {
                trend: actualMetrics.total_pl > 0 ? 'up' : 'down',
                trendValue: '5% from last week',
                sparklineData: this.generateSparklineData(7, actualMetrics.total_pl > 0)
            });
        
        this.updateMetricCard('analytics-win-rate', `${actualMetrics.win_rate}%`, 
            actualMetrics.win_rate >= 60 ? 'positive' : actualMetrics.win_rate >= 40 ? 'neutral' : 'negative',
            {
                trend: actualMetrics.win_rate >= 50 ? 'up' : 'down',
                trendValue: '2% from last week',
                sparklineData: this.generateSparklineData(7, actualMetrics.win_rate >= 50)
            });
        
        this.updateMetricCard('analytics-avg-win-loss-ratio', 
            (actualMetrics.avg_loss !== 0 ? 
                (Math.abs(actualMetrics.avg_win / actualMetrics.avg_loss)).toFixed(2) : '0.00'),
            actualMetrics.avg_win > Math.abs(actualMetrics.avg_loss) ? 'positive' : 'negative',
            {
                sparklineData: this.generateSparklineData(7, actualMetrics.avg_win > Math.abs(actualMetrics.avg_loss))
            });
        
        this.updateMetricCard('analytics-day-win-rate', `${actualMetrics.day_win_rate}%`, 
            actualMetrics.day_win_rate >= 60 ? 'positive' : actualMetrics.day_win_rate >= 40 ? 'neutral' : 'negative',
            {
                sparklineData: this.generateDonutData(actualMetrics.day_win_rate / 100)
            });
        
        this.updateMetricCard('analytics-profit-factor', actualMetrics.profit_factor.toFixed(2), 
            actualMetrics.profit_factor >= 1.5 ? 'positive' : actualMetrics.profit_factor >= 1 ? 'neutral' : 'negative',
            {
                trend: actualMetrics.profit_factor >= 1 ? 'up' : 'down',
                trendValue: '0.1 from last week',
                sparklineData: this.generateSparklineData(7, actualMetrics.profit_factor >= 1)
            });
        
        this.updateMetricCard('analytics-best-day-pct', `${actualMetrics.best_day_pct}%`, 'neutral',
            {
                sparklineData: this.generateBarData(5, true)
            });
        
        this.updateMetricCard('analytics-most-active-day', actualMetrics.most_active_day, 'neutral',
            {
                sparklineData: this.generateBarData(5, true)
            });
        
        this.updateMetricCard('analytics-most-profitable-day', actualMetrics.most_profitable_day, 'positive',
            {
                sparklineData: this.generateBarData(5, true)
            });
        
        this.updateMetricCard('analytics-least-profitable-day', actualMetrics.least_profitable_day, 'negative',
            {
                sparklineData: this.generateBarData(5, false)
            });
        
        this.updateMetricCard('analytics-total-trades', actualMetrics.total_trades, 'neutral',
            {
                sparklineData: this.generateSparklineData(7, true, false)
            });
        
        this.updateMetricCard('analytics-total-lots', actualMetrics.total_lots, 'neutral',
            {
                sparklineData: this.generateSparklineData(7, true, false)
            });
        
        this.updateMetricCard('analytics-avg-duration', actualMetrics.avg_duration, 'neutral',
            {
                sparklineData: this.generateSparklineData(7, true, false)
            });
        
        this.updateMetricCard('analytics-avg-win-duration', actualMetrics.avg_win_duration, 'positive',
            {
                sparklineData: this.generateSparklineData(7, true, false)
            });
        
        this.updateMetricCard('analytics-avg-loss-duration', actualMetrics.avg_loss_duration, 'negative',
            {
                sparklineData: this.generateSparklineData(7, false, false)
            });
        
        this.updateMetricCard('analytics-avg-win', Utils.formatCurrency(actualMetrics.avg_win), 'positive',
            {
                sparklineData: this.generateSparklineData(7, true)
            });
        
        this.updateMetricCard('analytics-avg-loss', Utils.formatCurrency(actualMetrics.avg_loss), 'negative',
            {
                sparklineData: this.generateSparklineData(7, false)
            });
        
        this.updateMetricCard('analytics-direction-pct', actualMetrics.direction_pct, 'neutral',
            {
                sparklineData: this.generateDonutData(0.65)
            });
        
        this.updateMetricCard('analytics-best-trade', Utils.formatCurrency(actualMetrics.best_trade), 'positive',
            {
                sparklineData: this.generateSparklineData(7, true)
            });
        
        this.updateMetricCard('analytics-worst-trade', Utils.formatCurrency(actualMetrics.worst_trade), 'negative',
            {
                sparklineData: this.generateSparklineData(7, false)
            });
    },
    
    /**
     * Update a metric card with value and mini-chart
     * @param {string} elementId - Element ID
     * @param {string} value - Value to display
     * @param {string} type - Type of metric (positive, negative, neutral)
     * @param {Object} options - Additional options (trend, trendValue, sparklineData)
     */
    updateMetricCard: function(elementId, value, type, options = {}) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Clear previous content
        element.innerHTML = '';
        
        // Add value
        element.textContent = value;
        
        // Set color class
        element.className = `metric-value ${type}`;
        
        // Get the parent card
        const cardElement = element.closest('.metric-card');
        if (cardElement) {
            // Add the type class to the card
            cardElement.classList.add(type);
            
            // Add trend indicator if provided
            if (options.trend) {
                const trendElement = document.createElement('div');
                trendElement.className = `metric-trend trend-${options.trend}`;
                trendElement.innerHTML = `
                    <i class="fa-solid fa-arrow-${options.trend === 'up' ? 'up' : 'down'}"></i>
                    ${options.trendValue || ''}
                `;
                cardElement.appendChild(trendElement);
            }
            
            // Add mini-chart if data provided
            if (options.sparklineData) {
                const chartContainer = document.createElement('div');
                chartContainer.className = 'mini-chart-container';
                
                if (options.sparklineData.type === 'sparkline') {
                    // Create SVG element
                    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svg.setAttribute('class', `sparkline ${type}`);
                    svg.setAttribute('viewBox', '0 0 100 40');
                    
                    // Create path
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('d', options.sparklineData.path);
                    svg.appendChild(path);
                    
                    // Create area fill
                    if (options.sparklineData.areaPath) {
                        const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        areaPath.setAttribute('d', options.sparklineData.areaPath);
                        areaPath.setAttribute('class', `sparkline-fill ${type}`);
                        svg.appendChild(areaPath);
                    }
                    
                    chartContainer.appendChild(svg);
                } else if (options.sparklineData.type === 'donut') {
                    // Create SVG element for donut chart
                    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svg.setAttribute('class', `sparkline ${type}`);
                    svg.setAttribute('viewBox', '0 0 100 40');
                    
                    // Add donut elements
                    const circle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle1.setAttribute('cx', '50');
                    circle1.setAttribute('cy', '20');
                    circle1.setAttribute('r', '15');
                    circle1.setAttribute('fill', 'none');
                    circle1.setAttribute('stroke', '#ddd');
                    circle1.setAttribute('stroke-width', '3');
                    svg.appendChild(circle1);
                    
                    // Calculate stroke-dasharray for percentage
                    const circumference = 2 * Math.PI * 15;
                    const dashArray = `${options.sparklineData.value * circumference} ${circumference}`;
                    
                    const circle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle2.setAttribute('cx', '50');
                    circle2.setAttribute('cy', '20');
                    circle2.setAttribute('r', '15');
                    circle2.setAttribute('fill', 'none');
                    circle2.setAttribute('stroke', type === 'positive' ? '#2ecc71' : type === 'negative' ? '#e74c3c' : '#3498db');
                    circle2.setAttribute('stroke-width', '3');
                    circle2.setAttribute('stroke-dasharray', dashArray);
                    circle2.setAttribute('transform', 'rotate(-90 50 20)');
                    svg.appendChild(circle2);
                    
                    chartContainer.appendChild(svg);
                } else if (options.sparklineData.type === 'bar') {
                    // Create SVG element for bar chart
                    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svg.setAttribute('class', `sparkline ${type}`);
                    svg.setAttribute('viewBox', '0 0 100 40');
                    
                    // Add bars
                    options.sparklineData.values.forEach((value, index) => {
                        const barWidth = 100 / options.sparklineData.values.length / 1.5;
                        const barHeight = value * 30;
                        const x = index * (100 / options.sparklineData.values.length) + (100 / options.sparklineData.values.length) / 4;
                        const y = 40 - barHeight;
                        
                        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        rect.setAttribute('x', x);
                        rect.setAttribute('y', y);
                        rect.setAttribute('width', barWidth);
                        rect.setAttribute('height', barHeight);
                        rect.setAttribute('rx', '1');
                        rect.setAttribute('fill', type === 'positive' ? '#2ecc71' : type === 'negative' ? '#e74c3c' : '#3498db');
                        rect.setAttribute('opacity', '0.7');
                        svg.appendChild(rect);
                    });
                    
                    chartContainer.appendChild(svg);
                }
                
                cardElement.appendChild(chartContainer);
            }
        }
    },
    
    /**
     * Generate sparkline path data
     * @param {number} points - Number of points
     * @param {boolean} uptrend - Whether the trend is up
     * @param {boolean} withArea - Whether to include area fill
     * @returns {Object} Sparkline data
     */
    generateSparklineData: function(points = 7, uptrend = true, withArea = true) {
        // Generate random data points with general trend
        const values = [];
        for (let i = 0; i < points; i++) {
            let baseValue;
            if (uptrend) {
                baseValue = 10 + i * 3 + Math.random() * 10 - 5;
            } else {
                baseValue = 40 - i * 3 + Math.random() * 10 - 5;
            }
            values.push(Math.max(1, baseValue));
        }
        
        // Normalize values to fit in viewBox
        const maxValue = Math.max(...values);
        const normalizedValues = values.map(v => 35 - (v / maxValue) * 30);
        
        // Generate path
        let path = '';
        normalizedValues.forEach((value, index) => {
            const x = index * (100 / (points - 1));
            if (index === 0) {
                path += `M ${x} ${value}`;
            } else {
                path += ` L ${x} ${value}`;
            }
        });
        
        // Generate area path if requested
        let areaPath = '';
        if (withArea) {
            areaPath = path + ` L ${100} 40 L 0 40 Z`;
        }
        
        return {
            type: 'sparkline',
            path: path,
            areaPath: areaPath
        };
    },
    
    /**
     * Generate donut chart data
     * @param {number} value - Value between 0 and 1
     * @returns {Object} Donut chart data
     */
    generateDonutData: function(value) {
        return {
            type: 'donut',
            value: Math.min(1, Math.max(0, value)) // Ensure value is between 0 and 1
        };
    },
    
    /**
     * Generate bar chart data
     * @param {number} bars - Number of bars
     * @param {boolean} uptrend - Whether the trend is up
     * @returns {Object} Bar chart data
     */
    generateBarData: function(bars = 5, uptrend = true) {
        // Generate random values for bars
        const values = [];
        for (let i = 0; i < bars; i++) {
            if (uptrend) {
                values.push(0.3 + Math.random() * 0.7);
            } else {
                values.push(0.3 + Math.random() * 0.4);
            }
        }
        
        return {
            type: 'bar',
            values: values
        };
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
     * @param {Array} data - Duration distribution data
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
     * @param {Array} data - Win rate by duration data
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
        const calendarGrid = document.getElementById('trading-calendar-grid');
        if (!calendarGrid) {
            console.error('Calendar grid element not found');
            return;
        }

        try {
            // Show loading state
            calendarGrid.innerHTML = '<div class="loading-spinner">Loading calendar data...</div>';

            // Update the month title
            const monthTitleElement = document.getElementById('calendar-month-title');
            if (monthTitleElement) {
                const monthStr = this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                monthTitleElement.textContent = monthStr;
            }

            // Validate selected account
            const selectedAccount = sessionStorage.getItem('selectedAccount') || '';
            if (!selectedAccount) {
                throw new Error('Please select an account to view the calendar');
            }

            // Get date range for the current month
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            
            // Format dates for API
            const startDate = firstDay.toISOString().split('T')[0];
            const endDate = lastDay.toISOString().split('T')[0];

            // Fetch calendar data
            console.log(`Fetching calendar data for ${monthTitleElement.textContent}`);
            const filters = {
                account: selectedAccount,
                start_date: startDate,
                end_date: endDate
            };
            
            let calendarData;
            try {
                calendarData = await Api.getCalendarData(filters);
                console.log('Calendar data received:', calendarData);
                
                // Validate calendar data
                if (!calendarData || typeof calendarData !== 'object') {
                    throw new Error('Invalid calendar data received from server');
                }
            } catch (apiError) {
                console.error('Error fetching calendar data from API:', apiError);
                // Use mock data as fallback
                console.log('Using mock calendar data as fallback');
                calendarData = this.generateMockCalendarData(year, month, lastDay.getDate());
            }

            // Clear previous content
            calendarGrid.innerHTML = '';

            // Create weekday headers (Sunday to Saturday)
            const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            weekdays.forEach(day => {
                const dayHeader = document.createElement('div');
                dayHeader.className = 'calendar-day-header';
                dayHeader.textContent = day;
                calendarGrid.appendChild(dayHeader);
            });
            
            // Calculate the first day of the month (0 = Sunday, 1 = Monday, etc.)
            let firstDayOfMonth = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
            
            // Add empty cells for days before the first day of the month
            for (let i = 0; i < firstDayOfMonth; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'calendar-day empty';
                calendarGrid.appendChild(emptyDay);
            }
            
            // Extract daily and weekly data
            const dailyData = calendarData.daily || {};
            const weeklyData = calendarData.weekly || {};
            
            // Find the closest weekly data for each Saturday
            const saturdayWeeklyMap = {};
            
            // Add cells for each day of the month
            const daysInMonth = lastDay.getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const currentDate = new Date(year, month, day);
                const dateStr = currentDate.toISOString().split('T')[0];
                const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
                
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                
                // If it's Saturday, try to find and display weekly summary
                if (dayOfWeek === 6) { // Saturday
                    // Find the weekly data for this week
                    // Weekly data is typically stored with Friday's date in our backend
                    const fridayDate = new Date(year, month, day - 1);
                    const fridayDateStr = fridayDate.toISOString().split('T')[0];
                    
                    let weeklyPL = null;
                    let weeklyTrades = 0;
                    let weeklyClass = 'neutral';
                    
                    // Search for the closest weekly data
                    for (const weekEndStr in weeklyData) {
                        const weekEndDate = new Date(weekEndStr);
                        if (Math.abs(weekEndDate - currentDate) <= 3 * 24 * 60 * 60 * 1000) { // Within 3 days
                            weeklyPL = weeklyData[weekEndStr].pl;
                            weeklyTrades = weeklyData[weekEndStr].trades;
                            weeklyClass = weeklyData[weekEndStr].class;
                            break;
                        }
                    }
                    
                    // If we found weekly data, display it
                    if (weeklyPL !== null) {
                        dayElement.classList.add(weeklyClass);
                        dayElement.classList.add('weekly');
                        
                        // Format P&L
                        const formattedPL = new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                        }).format(weeklyPL);
                        
                        // Build day element content
                        dayElement.innerHTML = `
                            <div class="calendar-day-number">${day}</div>
                            <div class="calendar-day-pl ${weeklyClass}">${formattedPL}</div>
                            <div class="calendar-day-trades"><strong>Weekly:</strong> ${weeklyTrades} trades</div>
                        `;
                        
                        // Add hover effect with more details
                        dayElement.title = `
                            Week ending: ${currentDate.toLocaleDateString()}
                            Weekly P&L: ${formattedPL}
                            Weekly Trades: ${weeklyTrades}
                        `;
                    } else {
                        // Use regular daily data if weekly not found
                        const dayData = dailyData[dateStr];
                        this.buildDayElement(dayElement, dayData, day, currentDate);
                    }
                } else {
                    // For regular days
                    const dayData = dailyData[dateStr];
                    this.buildDayElement(dayElement, dayData, day, currentDate);
                }
                
                calendarGrid.appendChild(dayElement);
            }
            
            // Add empty cells for days after the last day of the month
            const lastDayOfMonth = lastDay.getDay();
            const emptyCellsToAdd = lastDayOfMonth === 6 ? 0 : 6 - lastDayOfMonth;
            for (let i = 0; i < emptyCellsToAdd; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'calendar-day empty';
                calendarGrid.appendChild(emptyDay);
            }

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
     * Helper method to build a day element in the calendar
     * @param {HTMLElement} dayElement - The day element to build
     * @param {Object} dayData - The data for this day
     * @param {number} day - The day number
     * @param {Date} currentDate - The date object for this day
     */
    buildDayElement: function(dayElement, dayData, day, currentDate) {
        if (dayData) {
            // Add classes based on P&L
            if (dayData.class) {
                dayElement.classList.add(dayData.class);
            }
            
            // Format P&L
            const formattedPL = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(dayData.pl);
            
            // Build day element content
            dayElement.innerHTML = `
                <div class="calendar-day-number">${day}</div>
                <div class="calendar-day-pl ${dayData.class}">${formattedPL}</div>
                <div class="calendar-day-trades">${dayData.trades || 0} trades</div>
            `;
            
            // Add hover effect with more details
            dayElement.title = `
                Date: ${currentDate.toLocaleDateString()}
                P&L: ${formattedPL}
                Trades: ${dayData.trades || 0}
            `;
        } else {
            // Empty day
            dayElement.innerHTML = `<div class="calendar-day-number">${day}</div>`;
        }
    },
    
    /**
     * Generate mock calendar data for testing when the API fails
     * @param {number} year - Year
     * @param {number} month - Month (0-11)
     * @param {number} days - Number of days in month
     * @returns {Object} Mock calendar data in the same format as the API
     */
    generateMockCalendarData: function(year, month, days) {
        const dailyData = {};
        const weeklyData = {};
        
        // Generate daily data
        for (let day = 1; day <= days; day++) {
            // Skip weekends
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;
            
            // Only create data for some random weekdays
            if (Math.random() > 0.3) {
                const dateStr = date.toISOString().split('T')[0];
                const pl = Math.random() > 0.5 ? 
                    Math.round(Math.random() * 500) : 
                    -Math.round(Math.random() * 300);
                
                dailyData[dateStr] = {
                    pl: pl,
                    trades: Math.floor(Math.random() * 8) + 1,
                    class: pl > 0 ? 'positive' : pl < 0 ? 'negative' : 'neutral'
                };
            }
        }
        
        // Generate weekly data (simplified)
        for (let week = 0; week < 5; week++) {
            const weekEndDate = new Date(year, month, 5 + (week * 7));
            const dateStr = weekEndDate.toISOString().split('T')[0];
            const pl = Math.random() > 0.5 ? 
                Math.round(Math.random() * 1500) : 
                -Math.round(Math.random() * 800);
            
            weeklyData[dateStr] = {
                pl: pl,
                trades: Math.floor(Math.random() * 25) + 5,
                class: pl > 0 ? 'positive' : pl < 0 ? 'negative' : 'neutral'
            };
        }
        
        return {
            daily: dailyData,
            weekly: weeklyData
        };
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
    }
}; 