/**
 * Past Trades module for the Trading Journal application
 */
const PastTrades = {
    // Cache for trades data
    tradesData: [],
    
    /**
     * Initialize the past trades module
     */
    init: function() {
        this.setupFilters();
    },
    
    /**
     * Set up filters
     */
    setupFilters: function() {
        const applyFiltersBtn = document.getElementById('past-apply-filters-btn');
        const clearFiltersBtn = document.getElementById('past-clear-filters-btn');
        
        applyFiltersBtn.addEventListener('click', () => {
            this.loadTrades();
        });
        
        clearFiltersBtn.addEventListener('click', () => {
            document.getElementById('past-symbol-filter').value = '';
            document.getElementById('past-account-filter').value = '';
            document.getElementById('session-filter').value = '';
            document.getElementById('outcome-filter').value = '';
            
            this.loadTrades();
        });
    },
    
    /**
     * Load trades
     */
    loadTrades: async function() {
        try {
            const symbolFilter = document.getElementById('past-symbol-filter').value;
            const accountFilter = document.getElementById('past-account-filter').value;
            const sessionFilter = document.getElementById('session-filter').value;
            const outcomeFilter = document.getElementById('outcome-filter').value;
            
            // Prepare filters
            const filters = {};
            
            if (accountFilter) {
                filters.account = accountFilter;
            }
            
            if (symbolFilter) {
                filters.symbol = symbolFilter;
            }
            
            // Get all trades (basic filters at API level)
            const trades = await Api.getTrades(filters);
            
            // Apply additional client-side filters
            let filteredTrades = trades;
            
            if (sessionFilter) {
                filteredTrades = filteredTrades.filter(trade => trade.session === sessionFilter);
            }
            
            if (outcomeFilter) {
                if (outcomeFilter === 'win') {
                    filteredTrades = filteredTrades.filter(trade => trade.pl > 0);
                } else if (outcomeFilter === 'loss') {
                    filteredTrades = filteredTrades.filter(trade => trade.pl < 0);
                }
            }
            
            this.tradesData = filteredTrades;
            
            // Update past trades table
            this.updatePastTradesTable(filteredTrades);
        } catch (error) {
            console.error('Error loading past trades:', error);
            Utils.showError('Failed to load past trades. Please try again.');
        }
    },
    
    /**
     * Update past trades table
     * @param {Array} trades - List of trades
     */
    updatePastTradesTable: function(trades) {
        const tableBody = document.querySelector('#past-trades-table tbody');
        
        // Clear table
        tableBody.innerHTML = '';
        
        // Check if there are trades
        if (trades.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="7" class="text-center">No trades found</td>';
            tableBody.appendChild(row);
            return;
        }
        
        // Sort trades by date (newest first)
        trades.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Add rows
        trades.forEach((trade) => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${trade.account}</td>
                <td>${trade.symbol}</td>
                <td>${Utils.formatDate(trade.date)}</td>
                <td>${trade.session || 'N/A'}</td>
                <td class="${Utils.getPLClass(trade.pl)}">${Utils.formatCurrency(trade.pl)}</td>
                <td>${trade.type}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-button view" data-id="${trade.id}"><i class="fa-solid fa-eye"></i></button>
                    </div>
                </td>
            `;
            
            // Add event listener for view button
            row.querySelector('.view').addEventListener('click', () => {
                TradeJournal.showEditTradeModal(trade);
            });
            
            tableBody.appendChild(row);
        });
    }
}; 