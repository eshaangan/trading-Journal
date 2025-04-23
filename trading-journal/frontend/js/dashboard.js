/**
 * Dashboard module for the Trading Journal application
 */
const Dashboard = {
    // Chart instances
    performanceChart: null,
    
    // Cache for data
    metricsData: null,
    
    /**
     * Initialize the dashboard
     */
    init: function() {
        this.setupDateRangePicker();
        this.setupChartPeriodSelector();
    },
    
    /**
     * Set up date range picker
     */
    setupDateRangePicker: function() {
        const dateRangePicker = document.getElementById('date-range');
        
        if (dateRangePicker) {
            // Initialize flatpickr
            this.dateRangePicker = flatpickr(dateRangePicker, {
                mode: 'range',
                dateFormat: 'Y-m-d',
                maxDate: 'today',
                defaultDate: [
                    new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
                    new Date() // Today
                ],
                onChange: (selectedDates, dateStr) => {
                    if (selectedDates.length === 2) {
                        this.loadData();
                    }
                }
            });
        }
    },
    
    /**
     * Set up chart period selector
     */
    setupChartPeriodSelector: function() {
        const periodButtons = document.querySelectorAll('.chart-period');
        
        periodButtons.forEach((button) => {
            button.addEventListener('click', () => {
                // Update active state
                periodButtons.forEach((btn) => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Reload chart with selected period
                this.updatePerformanceChart(button.dataset.period);
            });
        });
    },
    
    /**
     * Load dashboard data
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
            
            // Get metrics
            const metrics = await Api.getMetrics(filters);
            this.metricsData = metrics;
            
            // Update dashboard metrics
            this.updateMetrics(metrics);
            
            // Get cumulative P&L data
            const cumulativePL = await Api.getCumulativePL(filters);
            
            // Update performance chart
            this.updatePerformanceChart('daily', cumulativePL);
            
            // Update calendar
            // this.updateCalendar(cumulativePL);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            Utils.showError('Failed to load dashboard data. Please try again.');
        }
    },
    
    /**
     * Update dashboard metrics
     * @param {Object} metrics - Metrics data
     */
    updateMetrics: function(metrics) {
        document.getElementById('total-pl').textContent = Utils.formatCurrency(metrics.total_pl);
        document.getElementById('win-rate').textContent = `${metrics.win_rate}%`;
        document.getElementById('profit-factor').textContent = metrics.profit_factor.toFixed(2);
        document.getElementById('avg-trade').textContent = Utils.formatCurrency(metrics.avg_trade_pl);
        
        // Set colors based on values
        document.getElementById('total-pl').className = `metric-value ${Utils.getPLClass(metrics.total_pl)}`;
        document.getElementById('profit-factor').className = `metric-value ${Utils.getPLClass(metrics.profit_factor - 1)}`;
        document.getElementById('avg-trade').className = `metric-value ${Utils.getPLClass(metrics.avg_trade_pl)}`;
    },
    
    /**
     * Update performance chart
     * @param {string} period - Chart period (daily, weekly, monthly)
     * @param {Array} cumulativePL - Cumulative P&L data
     */
    updatePerformanceChart: function(period = 'daily', cumulativePLData = null) {
        // If no data provided, use cached data
        if (!cumulativePLData && !this.cumulativePLData) {
            return;
        } else if (cumulativePLData) {
            this.cumulativePLData = cumulativePLData;
        }
        
        const data = this.cumulativePLData;
        
        // Group data by period
        let groupedData = [];
        
        if (period === 'weekly') {
            // Group by week
            const weekMap = new Map();
            
            data.forEach((item) => {
                const date = new Date(item.date);
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                
                const weekKey = weekStart.toISOString().split('T')[0];
                
                if (!weekMap.has(weekKey)) {
                    weekMap.set(weekKey, { date: weekKey, value: 0 });
                }
                
                const weekData = weekMap.get(weekKey);
                
                if (item.value > weekData.value) {
                    weekData.value = item.value;
                }
            });
            
            groupedData = Array.from(weekMap.values());
        } else if (period === 'monthly') {
            // Group by month
            const monthMap = new Map();
            
            data.forEach((item) => {
                const date = new Date(item.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                if (!monthMap.has(monthKey)) {
                    monthMap.set(monthKey, { date: `${monthKey}-01`, value: 0 });
                }
                
                const monthData = monthMap.get(monthKey);
                
                if (item.value > monthData.value) {
                    monthData.value = item.value;
                }
            });
            
            groupedData = Array.from(monthMap.values());
        } else {
            // Daily data (no grouping)
            groupedData = data;
        }
        
        // Sort data by date
        groupedData.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Prepare chart data
        const chartData = {
            labels: groupedData.map((item) => {
                return this.formatDateLabel(item.date, period);
            }),
            datasets: [{
                label: 'Cumulative P&L',
                data: groupedData.map((item) => item.value),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
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
        this.performanceChart = Utils.createChart('performance-chart', 'line', chartData, options);
    },
    
    /**
     * Format date label for chart
     * @param {string} dateString - Date string
     * @param {string} period - Chart period (daily, weekly, monthly)
     * @returns {string} Formatted date label
     */
    formatDateLabel: function(dateString, period) {
        const date = new Date(dateString);
        
        if (period === 'monthly') {
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else if (period === 'weekly') {
            const weekEnd = new Date(date);
            weekEnd.setDate(date.getDate() + 6);
            
            return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }
}; 