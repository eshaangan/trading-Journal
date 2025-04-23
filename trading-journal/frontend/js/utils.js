/**
 * Utility functions for the Trading Journal application
 */

const Utils = {
    /**
     * Format currency value
     * @param {number} value - Value to format
     * @param {boolean} showSign - Whether to show plus sign for positive values
     * @returns {string} Formatted currency string
     */
    formatCurrency: (value, showSign = false) => {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        const formatted = formatter.format(value);
        
        if (showSign && value > 0) {
            return '+' + formatted;
        }
        
        return formatted;
    },
    
    /**
     * Format percentage value
     * @param {number} value - Value to format
     * @param {boolean} showSign - Whether to show plus sign for positive values
     * @returns {string} Formatted percentage string
     */
    formatPercentage: (value, showSign = false) => {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        const formatted = formatter.format(value / 100);
        
        if (showSign && value > 0) {
            return '+' + formatted;
        }
        
        return formatted;
    },
    
    /**
     * Format date
     * @param {string} dateString - Date string in ISO format
     * @returns {string} Formatted date string
     */
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },
    
    /**
     * Get CSS class for P&L value
     * @param {number} value - P&L value
     * @returns {string} CSS class name
     */
    getPLClass: (value) => {
        if (value > 0) return 'positive';
        if (value < 0) return 'negative';
        return 'neutral';
    },
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError: (message) => {
        alert(`Error: ${message}`);
    },
    
    /**
     * Show modal dialog
     * @param {string} modalId - Modal element ID
     */
    showModal: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },
    
    /**
     * Hide modal dialog
     * @param {string} modalId - Modal element ID
     */
    hideModal: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },
    
    /**
     * Show a specific page
     * @param {string} pageId - Page element ID
     */
    showPage: (pageId) => {
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach((page) => {
            page.classList.add('hidden');
        });
        
        // Show the selected page
        const selectedPage = document.getElementById(pageId);
        if (selectedPage) {
            selectedPage.classList.remove('hidden');
        }
        
        // Update nav item active state
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach((item) => {
            if (item.dataset.page === pageId.replace('-page', '')) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Update page title
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            pageTitle.textContent = pageId.replace('-page', '').split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
        }
    },
    
    /**
     * Create a chart
     * @param {string} canvasId - Canvas element ID
     * @param {string} type - Chart type
     * @param {Object} data - Chart data
     * @param {Object} options - Chart options
     * @returns {Chart} Chart instance
     */
    createChart: (canvasId, type, data, options = {}) => {
        const canvas = document.getElementById(canvasId);
        
        if (!canvas) {
            console.error(`Canvas element with ID '${canvasId}' not found`);
            return null;
        }
        
        // Clear any existing chart
        const chartInstance = Chart.getChart(canvas);
        if (chartInstance) {
            chartInstance.destroy();
        }
        
        // Default chart options based on theme
        const isDarkTheme = document.body.classList.contains('dark-theme');
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        color: isDarkTheme ? '#aaa' : '#666'
                    },
                    grid: {
                        color: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: isDarkTheme ? '#aaa' : '#666'
                    },
                    grid: {
                        color: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: isDarkTheme ? '#ddd' : '#333'
                    }
                }
            }
        };
        
        // Create the chart
        return new Chart(canvas, {
            type: type,
            data: data,
            options: { ...defaultOptions, ...options }
        });
    },
    
    /**
     * Parse date range string
     * @param {string} dateRangeStr - Date range string
     * @returns {Object} Start and end dates
     */
    parseDateRange: (dateRangeStr) => {
        if (!dateRangeStr) {
            return { start_date: null, end_date: null };
        }
        
        const dates = dateRangeStr.split(' to ');
        
        if (dates.length !== 2) {
            return { start_date: null, end_date: null };
        }
        
        const start = dates[0].trim();
        const end = dates[1].trim();
        
        return {
            start_date: start,
            end_date: end
        };
    },
    
    /**
     * Calculate trade P&L and P&L% based on entry, exit, and size
     * @param {number} entry - Entry price
     * @param {number} exit - Exit price
     * @param {number} size - Trade size
     * @param {string} type - Trade type (Long or Short)
     * @returns {Object} Calculated P&L and P&L%
     */
    calculatePL: (entry, exit, size, type) => {
        let pl, plPercent;
        
        if (type === 'Long') {
            pl = (exit - entry) * size;
            plPercent = (exit - entry) / entry * 100;
        } else { // Short
            pl = (entry - exit) * size;
            plPercent = (entry - exit) / entry * 100;
        }
        
        return {
            pl: parseFloat(pl.toFixed(2)),
            pl_percent: parseFloat(plPercent.toFixed(2))
        };
    }
}; 