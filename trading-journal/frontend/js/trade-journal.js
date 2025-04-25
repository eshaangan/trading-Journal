/**
 * Trade Journal module for the Trading Journal application
 */
const TradeJournal = {
    // Cache for trades data
    tradesData: [],
    // Date range picker instance
    dateRangePicker: null,
    
    /**
     * Initialize the trade journal
     */
    init: function() {
        this.setupTradeForm();
        this.setupEditTradeForm();
        this.setupFilters();
        this.setupDateRangePicker();
    },
    
    /**
     * Set up trade form
     */
    setupTradeForm: function() {
        const tradeForm = document.getElementById('trade-form');
        
        tradeForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            try {
                // Get form data
                const formData = {
                    date: document.getElementById('trade-date').value,
                    symbol: document.getElementById('trade-symbol').value.toUpperCase(),
                    type: document.getElementById('trade-type').value,
                    size: parseFloat(document.getElementById('trade-size').value),
                    entry: parseFloat(document.getElementById('trade-entry').value),
                    exit: parseFloat(document.getElementById('trade-exit').value),
                    pl: parseFloat(document.getElementById('trade-pl').value),
                    pl_percent: parseFloat(document.getElementById('trade-pl-percent').value),
                    notes: document.getElementById('trade-notes').value,
                    account: document.getElementById('trade-account').value,
                    session: document.getElementById('trade-session').value
                };
                
                // Create trade
                await Api.createTrade(formData);
                
                // Hide modal
                Utils.hideModal('add-trade-modal');
                
                // Reset form
                tradeForm.reset();
                
                // Reload trades
                await this.loadTrades();
                
                // Reload dashboard
                await Dashboard.loadData();
            } catch (error) {
                console.error('Error creating trade:', error);
                Utils.showError('Failed to create trade. Please try again.');
            }
        });
        
        // Setup auto-calculation of P&L
        const entryField = document.getElementById('trade-entry');
        const exitField = document.getElementById('trade-exit');
        const sizeField = document.getElementById('trade-size');
        const typeField = document.getElementById('trade-type');
        const plField = document.getElementById('trade-pl');
        const plPercentField = document.getElementById('trade-pl-percent');
        
        [entryField, exitField, sizeField, typeField].forEach((field) => {
            field.addEventListener('input', () => {
                if (entryField.value && exitField.value && sizeField.value) {
                    const entry = parseFloat(entryField.value);
                    const exit = parseFloat(exitField.value);
                    const size = parseFloat(sizeField.value);
                    const type = typeField.value;
                    
                    const { pl, pl_percent } = Utils.calculatePL(entry, exit, size, type);
                    
                    plField.value = pl;
                    plPercentField.value = pl_percent;
                }
            });
        });
    },
    
    /**
     * Set up edit trade form
     */
    setupEditTradeForm: function() {
        const editTradeForm = document.getElementById('edit-trade-form');
        
        editTradeForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            try {
                const tradeId = document.getElementById('edit-trade-id').value;
                
                // Get form data
                const formData = {
                    date: document.getElementById('edit-trade-date').value,
                    symbol: document.getElementById('edit-trade-symbol').value.toUpperCase(),
                    type: document.getElementById('edit-trade-type').value,
                    size: parseFloat(document.getElementById('edit-trade-size').value),
                    entry: parseFloat(document.getElementById('edit-trade-entry').value),
                    exit: parseFloat(document.getElementById('edit-trade-exit').value),
                    pl: parseFloat(document.getElementById('edit-trade-pl').value),
                    pl_percent: parseFloat(document.getElementById('edit-trade-pl-percent').value),
                    notes: document.getElementById('edit-trade-notes').value,
                    account: document.getElementById('edit-trade-account').value,
                    session: document.getElementById('edit-trade-session').value
                };
                
                // Update trade
                await Api.updateTrade(tradeId, formData);
                
                // Hide modal
                Utils.hideModal('edit-trade-modal');
                
                // Reload trades
                await this.loadTrades();
                
                // Reload dashboard
                await Dashboard.loadData();
            } catch (error) {
                console.error('Error updating trade:', error);
                Utils.showError('Failed to update trade. Please try again.');
            }
        });
        
        // Setup auto-calculation of P&L
        const entryField = document.getElementById('edit-trade-entry');
        const exitField = document.getElementById('edit-trade-exit');
        const sizeField = document.getElementById('edit-trade-size');
        const typeField = document.getElementById('edit-trade-type');
        const plField = document.getElementById('edit-trade-pl');
        const plPercentField = document.getElementById('edit-trade-pl-percent');
        
        [entryField, exitField, sizeField, typeField].forEach((field) => {
            field.addEventListener('input', () => {
                if (entryField.value && exitField.value && sizeField.value) {
                    const entry = parseFloat(entryField.value);
                    const exit = parseFloat(exitField.value);
                    const size = parseFloat(sizeField.value);
                    const type = typeField.value;
                    
                    const { pl, pl_percent } = Utils.calculatePL(entry, exit, size, type);
                    
                    plField.value = pl;
                    plPercentField.value = pl_percent;
                }
            });
        });
    },
    
    /**
     * Set up filters
     */
    setupFilters: function() {
        const applyFiltersBtn = document.getElementById('apply-filters-btn');
        const clearFiltersBtn = document.getElementById('clear-filters-btn');
        
        applyFiltersBtn.addEventListener('click', () => {
            this.loadTrades();
        });
        
        clearFiltersBtn.addEventListener('click', () => {
            document.getElementById('symbol-filter').value = '';
            document.getElementById('type-filter').value = '';
            
            // Reset date range picker if it exists
            if (this.dateRangePicker) {
                const defaultDates = [
                    new Date(new Date().setDate(new Date().getDate() - 30)), // 30 days ago
                    new Date() // Today
                ];
                this.dateRangePicker.setDate(defaultDates);
            }
            
            this.loadTrades();
        });
    },
    
    /**
     * Set up date range picker
     */
    setupDateRangePicker: function() {
        const dateRangeInput = document.getElementById('trade-date-range');
        
        if (dateRangeInput) {
            // Initialize flatpickr
            this.dateRangePicker = flatpickr(dateRangeInput, {
                mode: 'range',
                dateFormat: 'Y-m-d',
                maxDate: 'today',
                defaultDate: [
                    new Date(new Date().setDate(new Date().getDate() - 30)), // 30 days ago
                    new Date() // Today
                ],
                onChange: (selectedDates, dateStr) => {
                    if (selectedDates.length === 2) {
                        this.loadTrades();
                    }
                }
            });
        }
    },
    
    /**
     * Load trades
     */
    loadTrades: async function() {
        try {
            const selectedAccount = sessionStorage.getItem('selectedAccount') || '';
            const symbolFilter = document.getElementById('symbol-filter').value;
            const typeFilter = document.getElementById('type-filter').value;
            const dateRange = this.dateRangePicker?.selectedDates || [];
            
            const filters = {
                account: selectedAccount,
                symbol: symbolFilter,
                type: typeFilter,
                start_date: dateRange.length > 0 ? dateRange[0].toISOString().split('T')[0] : null,
                end_date: dateRange.length > 1 ? dateRange[1].toISOString().split('T')[0] : null
            };
            
            // Get trades
            const trades = await Api.getTrades(filters);
            this.tradesData = trades;
            
            // Update trades table
            this.updateTradesTable(trades);
        } catch (error) {
            console.error('Error loading trades:', error);
            Utils.showError('Failed to load trades. Please try again.');
        }
    },
    
    /**
     * Update trades table
     * @param {Array} trades - List of trades
     */
    updateTradesTable: function(trades) {
        const tableBody = document.querySelector('#trades-table tbody');
        
        // Clear table
        tableBody.innerHTML = '';
        
        // Check if there are trades
        if (trades.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="10" class="text-center">No trades found</td>';
            tableBody.appendChild(row);
            return;
        }
        
        // Sort trades by date (newest first)
        trades.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Add rows
        trades.forEach((trade) => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${Utils.formatDate(trade.date)}</td>
                <td>${trade.symbol}</td>
                <td>${trade.type}</td>
                <td>${trade.size}</td>
                <td>${trade.entry}</td>
                <td>${trade.exit}</td>
                <td class="${Utils.getPLClass(trade.pl)}">${Utils.formatCurrency(trade.pl, true)}</td>
                <td class="${Utils.getPLClass(trade.pl_percent)}">${Utils.formatPercentage(trade.pl_percent, true)}</td>
                <td>${trade.notes || ''}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-button edit" data-id="${trade.id}"><i class="fa-solid fa-edit"></i></button>
                        <button class="action-button delete" data-id="${trade.id}"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
            
            // Add event listeners for edit and delete buttons
            row.querySelector('.edit').addEventListener('click', () => {
                this.showEditTradeModal(trade);
            });
            
            row.querySelector('.delete').addEventListener('click', () => {
                this.showDeleteTradeConfirmation(trade);
            });
            
            tableBody.appendChild(row);
        });
    },
    
    /**
     * Show add trade modal
     */
    showAddTradeModal: function() {
        // Set default date to today
        document.getElementById('trade-date').value = new Date().toISOString().split('T')[0];
        
        // Set default account
        const selectedAccount = sessionStorage.getItem('selectedAccount') || '';
        if (selectedAccount) {
            document.getElementById('trade-account').value = selectedAccount;
        }
        
        // Show modal
        Utils.showModal('add-trade-modal');
    },
    
    /**
     * Show edit trade modal
     * @param {Object} trade - Trade data
     */
    showEditTradeModal: function(trade) {
        // Set trade data in form
        document.getElementById('edit-trade-id').value = trade.id;
        document.getElementById('edit-trade-date').value = trade.date;
        document.getElementById('edit-trade-symbol').value = trade.symbol;
        document.getElementById('edit-trade-type').value = trade.type;
        document.getElementById('edit-trade-size').value = trade.size;
        document.getElementById('edit-trade-entry').value = trade.entry;
        document.getElementById('edit-trade-exit').value = trade.exit;
        document.getElementById('edit-trade-pl').value = trade.pl;
        document.getElementById('edit-trade-pl-percent').value = trade.pl_percent;
        document.getElementById('edit-trade-notes').value = trade.notes || '';
        document.getElementById('edit-trade-account').value = trade.account;
        document.getElementById('edit-trade-session').value = trade.session || '';
        
        // Show modal
        Utils.showModal('edit-trade-modal');
    },
    
    /**
     * Show delete trade confirmation
     * @param {Object} trade - Trade data
     */
    showDeleteTradeConfirmation: function(trade) {
        const message = `Are you sure you want to delete the ${trade.type} trade for ${trade.symbol} on ${Utils.formatDate(trade.date)}?`;
        document.getElementById('delete-confirm-message').textContent = message;
        
        // Set up delete button
        const deleteBtn = document.getElementById('delete-confirm-btn');
        deleteBtn.onclick = async () => {
            try {
                await Api.deleteTrade(trade.id);
                
                // Hide modal
                Utils.hideModal('delete-confirm-modal');
                
                // Reload trades
                await this.loadTrades();
                
                // Reload dashboard
                await Dashboard.loadData();
            } catch (error) {
                console.error('Error deleting trade:', error);
                Utils.showError('Failed to delete trade. Please try again.');
            }
        };
        
        // Show modal
        Utils.showModal('delete-confirm-modal');
    }
}; 