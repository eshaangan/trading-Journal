/**
 * Main application script
 */
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

/**
 * Initialize the application
 */
function initApp() {
    // Initialize each module
    Dashboard.init();
    TradeJournal.init();
    PastTrades.init();
    Analytics.init();
    ImportData.init();
    Settings.init();
    
    // Set up navigation
    setupNavigation();
    
    // Set up account selector
    setupAccountSelector();
    
    // Set up modals
    setupModals();
    
    // Set up theme switching
    setupThemeSwitch();
    
    // Set up the add trade button
    setupAddTradeButton();
    
    // Load accounts
    loadAccounts();
    
    // Initialize theme toggle
    initThemeToggle();
}

/**
 * Set up navigation
 */
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach((item) => {
        item.addEventListener('click', () => {
            const pageId = `${item.dataset.page}-page`;
            Utils.showPage(pageId);
        });
    });
}

/**
 * Set up account selector
 */
function setupAccountSelector() {
    const accountSelect = document.getElementById('account-select');
    
    accountSelect.addEventListener('change', async () => {
        const selectedAccount = accountSelect.value;
        
        // Store selected account in session storage
        sessionStorage.setItem('selectedAccount', selectedAccount);
        
        // Reload data for each module with the selected account
        await Dashboard.loadData();
        await TradeJournal.loadTrades();
        await PastTrades.loadTrades();
        await Analytics.loadData();
    });
}

/**
 * Set up theme switching
 */
function setupThemeSwitch() {
    const lightThemeBtn = document.getElementById('light-theme-btn');
    const darkThemeBtn = document.getElementById('dark-theme-btn');
    
    // Check for saved theme preference or use preferred color scheme
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        lightThemeBtn.classList.remove('active');
        darkThemeBtn.classList.add('active');
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        lightThemeBtn.classList.add('active');
        darkThemeBtn.classList.remove('active');
    } else {
        // Check for preferred color scheme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (prefersDark) {
            document.body.classList.add('dark-theme');
            lightThemeBtn.classList.remove('active');
            darkThemeBtn.classList.add('active');
        }
    }
    
    // Set up event listeners
    lightThemeBtn.addEventListener('click', () => {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
        lightThemeBtn.classList.add('active');
        darkThemeBtn.classList.remove('active');
        
        // Reload charts to update colors
        Dashboard.loadData();
        Analytics.loadData();
    });
    
    darkThemeBtn.addEventListener('click', () => {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        lightThemeBtn.classList.remove('active');
        darkThemeBtn.classList.add('active');
        
        // Reload charts to update colors
        Dashboard.loadData();
        Analytics.loadData();
    });
}

/**
 * Set up modal dialogs
 */
function setupModals() {
    // Close modal when clicking close button
    const closeButtons = document.querySelectorAll('.close-modal');
    
    closeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Close modal when clicking outside the modal content
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach((modal) => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Cancel delete
    document.getElementById('delete-cancel-btn').addEventListener('click', () => {
        Utils.hideModal('delete-confirm-modal');
    });
}

/**
 * Set up add trade button
 */
function setupAddTradeButton() {
    const addTradeBtn = document.getElementById('add-trade-btn');
    
    addTradeBtn.addEventListener('click', () => {
        TradeJournal.showAddTradeModal();
    });
}

/**
 * Load accounts
 */
async function loadAccounts() {
    try {
        const accounts = await Api.getAccounts();
        
        // Check if we have at least one account
        if (accounts.length === 0) {
            // Show settings page to add an account
            Utils.showPage('settings-page');
            return;
        }
        
        // Populate account selectors
        populateAccountSelectors(accounts);
        
        // Load initial data
        await Dashboard.loadData();
    } catch (error) {
        console.error('Error loading accounts:', error);
        Utils.showError('Failed to load accounts. Please try again.');
    }
}

/**
 * Populate account selectors
 * @param {Array} accounts - List of accounts
 */
function populateAccountSelectors(accounts) {
    const selectors = [
        document.getElementById('account-select'),
        document.getElementById('trade-account'),
        document.getElementById('edit-trade-account'),
        document.getElementById('import-account'),
        document.getElementById('past-account-filter')
    ];
    
    selectors.forEach((selector) => {
        if (!selector) return;
        
        // Clear existing options except the placeholder
        while (selector.options.length > 1) {
            selector.remove(1);
        }
        
        // Add account options
        accounts.forEach((account) => {
            const option = document.createElement('option');
            option.value = account.name;
            option.textContent = account.name;
            selector.appendChild(option);
        });
    });
    
    // Set selected account from session storage if available
    const selectedAccount = sessionStorage.getItem('selectedAccount');
    
    if (selectedAccount) {
        selectors.forEach((selector) => {
            if (selector) {
                selector.value = selectedAccount;
            }
        });
    } else if (accounts.length > 0) {
        // Set the first account as selected
        sessionStorage.setItem('selectedAccount', accounts[0].name);
        
        selectors.forEach((selector) => {
            if (selector) {
                selector.value = accounts[0].name;
            }
        });
    }
}

// Theme Toggle
function initThemeToggle() {
    const storedTheme = localStorage.getItem('theme') || 'light';
    const themeToggle = document.getElementById('theme-toggle');
    
    // Apply stored theme on page load
    if (storedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
    
    // Create theme toggle if it doesn't exist
    if (!themeToggle) {
        const topBar = document.querySelector('.top-bar');
        if (topBar) {
            const themeBtn = document.createElement('button');
            themeBtn.id = 'theme-toggle';
            themeBtn.className = 'theme-toggle-btn';
            themeBtn.innerHTML = storedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            themeBtn.setAttribute('aria-label', 'Toggle dark mode');
            themeBtn.addEventListener('click', toggleTheme);
            
            topBar.appendChild(themeBtn);
        }
    }
}

function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.contains('dark-theme');
    const themeToggle = document.getElementById('theme-toggle');
    
    body.classList.add('theme-transition');
    
    if (isDark) {
        body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
        if (themeToggle) {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    } else {
        body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        if (themeToggle) {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
    
    // Remove transition class after transition completes
    setTimeout(() => {
        body.classList.remove('theme-transition');
    }, 500);
} 