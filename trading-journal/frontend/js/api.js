/**
 * API Service for interacting with the backend
 */
const API_BASE_URL = 'http://localhost:8000';

const Api = {
    /**
     * Get accounts
     * @returns {Promise<Array>} List of accounts
     */
    getAccounts: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/accounts`);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching accounts:', error);
            throw error;
        }
    },
    
    /**
     * Create a new account
     * @param {Object} accountData - Account data
     * @returns {Promise<Object>} Created account
     */
    createAccount: async (accountData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/accounts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(accountData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error creating account:', error);
            throw error;
        }
    },
    
    /**
     * Update an account
     * @param {number} accountId - Account ID
     * @param {Object} accountData - Account data
     * @returns {Promise<Object>} Updated account
     */
    updateAccount: async (accountId, accountData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/accounts/${accountId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(accountData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error updating account:', error);
            throw error;
        }
    },
    
    /**
     * Delete an account
     * @param {number} accountId - Account ID
     * @returns {Promise<Object>} Response
     */
    deleteAccount: async (accountId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/accounts/${accountId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error deleting account:', error);
            throw error;
        }
    },
    
    /**
     * Get trades with optional filtering
     * @param {Object} filters - Filters
     * @returns {Promise<Array>} List of trades
     */
    getTrades: async (filters = {}) => {
        try {
            // Build query string from filters
            const queryParams = new URLSearchParams();
            
            if (filters.account) {
                queryParams.append('account', filters.account);
            }
            
            if (filters.symbol) {
                queryParams.append('symbol', filters.symbol);
            }
            
            if (filters.type) {
                queryParams.append('type', filters.type);
            }
            
            if (filters.start_date) {
                queryParams.append('start_date', filters.start_date);
            }
            
            if (filters.end_date) {
                queryParams.append('end_date', filters.end_date);
            }
            
            const queryString = queryParams.toString();
            const url = `${API_BASE_URL}/api/trades${queryString ? `?${queryString}` : ''}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching trades:', error);
            throw error;
        }
    },
    
    /**
     * Get a single trade by ID
     * @param {number} tradeId - Trade ID
     * @returns {Promise<Object>} Trade data
     */
    getTradeById: async (tradeId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/trades/${tradeId}`);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error fetching trade ${tradeId}:`, error);
            throw error;
        }
    },
    
    /**
     * Create a new trade
     * @param {Object} tradeData - Trade data
     * @returns {Promise<Object>} Created trade
     */
    createTrade: async (tradeData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/trades`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tradeData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error creating trade:', error);
            throw error;
        }
    },
    
    /**
     * Update a trade
     * @param {number} tradeId - Trade ID
     * @param {Object} tradeData - Trade data
     * @returns {Promise<Object>} Updated trade
     */
    updateTrade: async (tradeId, tradeData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/trades/${tradeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tradeData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error updating trade:', error);
            throw error;
        }
    },
    
    /**
     * Delete a trade
     * @param {number} tradeId - Trade ID
     * @returns {Promise<Object>} Response
     */
    deleteTrade: async (tradeId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/trades/${tradeId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error deleting trade:', error);
            throw error;
        }
    },
    
    /**
     * Import trades from CSV
     * @param {File} file - CSV file
     * @param {string} account - Account name
     * @returns {Promise<Object>} Import results
     */
    importTrades: async (file, account) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('account', account);
            
            const response = await fetch(`${API_BASE_URL}/api/trades/import`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error importing trades:', error);
            throw error;
        }
    },
    
    /**
     * Get trading metrics
     * @param {Object} filters - Filters
     * @returns {Promise<Object>} Metrics
     */
    getMetrics: async (filters = {}) => {
        try {
            // Build query string from filters
            const queryParams = new URLSearchParams();
            
            if (filters.account) {
                queryParams.append('account', filters.account);
            }
            
            if (filters.start_date) {
                queryParams.append('start_date', filters.start_date);
            }
            
            if (filters.end_date) {
                queryParams.append('end_date', filters.end_date);
            }
            
            const queryString = queryParams.toString();
            const url = `${API_BASE_URL}/api/analytics/metrics${queryString ? `?${queryString}` : ''}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching metrics:', error);
            throw error;
        }
    },
    
    /**
     * Get performance by symbol
     * @param {Object} filters - Filters
     * @returns {Promise<Object>} Performance data
     */
    getPerformanceBySymbol: async (filters = {}) => {
        try {
            // Build query string from filters
            const queryParams = new URLSearchParams();
            
            if (filters.account) {
                queryParams.append('account', filters.account);
            }
            
            if (filters.start_date) {
                queryParams.append('start_date', filters.start_date);
            }
            
            if (filters.end_date) {
                queryParams.append('end_date', filters.end_date);
            }
            
            const queryString = queryParams.toString();
            const url = `${API_BASE_URL}/api/analytics/performance/symbol${queryString ? `?${queryString}` : ''}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching symbol performance:', error);
            throw error;
        }
    },
    
    /**
     * Get performance by day of week
     * @param {Object} filters - Filters
     * @returns {Promise<Object>} Performance data
     */
    getPerformanceByDay: async (filters = {}) => {
        try {
            // Build query string from filters
            const queryParams = new URLSearchParams();
            
            if (filters.account) {
                queryParams.append('account', filters.account);
            }
            
            if (filters.start_date) {
                queryParams.append('start_date', filters.start_date);
            }
            
            if (filters.end_date) {
                queryParams.append('end_date', filters.end_date);
            }
            
            const queryString = queryParams.toString();
            const url = `${API_BASE_URL}/api/analytics/performance/day${queryString ? `?${queryString}` : ''}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching day performance:', error);
            throw error;
        }
    },
    
    /**
     * Get cumulative P&L data
     * @param {Object} filters - Filters
     * @returns {Promise<Array>} Cumulative P&L data
     */
    getCumulativePL: async (filters = {}) => {
        try {
            // Build query string from filters
            const queryParams = new URLSearchParams();
            
            if (filters.account) {
                queryParams.append('account', filters.account);
            }
            
            if (filters.start_date) {
                queryParams.append('start_date', filters.start_date);
            }
            
            if (filters.end_date) {
                queryParams.append('end_date', filters.end_date);
            }
            
            const queryString = queryParams.toString();
            const url = `${API_BASE_URL}/api/analytics/cumulative-pl${queryString ? `?${queryString}` : ''}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching cumulative P&L:', error);
            throw error;
        }
    }
}; 