/**
 * Analytics module for the Trading Journal application
 */
const Analytics = {
    // Chart instances
    cumulativePLChart: null,
    winLossChart: null,
    symbolPerformanceChart: null,
    dayPerformanceChart: null,
    
    /**
     * Initialize the analytics module
     */
    init: function() {
        // No special initialization needed
    },
    
    /**
     * Load analytics data
     */
    loadData: async function() {
        try {
            const selectedAccount = sessionStorage.getItem('selectedAccount') || '';
            
            const filters = {
                account: selectedAccount
            };
            
            // Get metrics for win/loss distribution
            const metrics = await Api.getMetrics(filters);
            
            // Get cumulative P&L data
            const cumulativePL = await Api.getCumulativePL(filters);
            
            // Get performance by symbol
            const symbolPerformance = await Api.getPerformanceBySymbol(filters);
            
            // Get performance by day of week
            const dayPerformance = await Api.getPerformanceByDay(filters);
            
            // Update charts
            this.updateCumulativePLChart(cumulativePL);
            this.updateWinLossChart(metrics);
            this.updateSymbolPerformanceChart(symbolPerformance);
            this.updateDayPerformanceChart(dayPerformance);
        } catch (error) {
            console.error('Error loading analytics data:', error);
            Utils.showError('Failed to load analytics data. Please try again.');
        }
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
    }
}; 