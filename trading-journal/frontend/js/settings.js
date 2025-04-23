/**
 * Settings module for the Trading Journal application
 */
const Settings = {
    /**
     * Initialize the settings module
     */
    init: function() {
        this.setupAccountForm();
        this.setupEditAccountForm();
        this.loadAccounts();
    },
    
    /**
     * Set up account form
     */
    setupAccountForm: function() {
        const accountForm = document.getElementById('account-form');
        
        accountForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            try {
                // Get form data
                const accountData = {
                    name: document.getElementById('account-name').value.trim(),
                    description: document.getElementById('account-description').value.trim()
                };
                
                // Validate
                if (!accountData.name) {
                    Utils.showError('Account name is required');
                    return;
                }
                
                // Create account
                await Api.createAccount(accountData);
                
                // Reset form
                accountForm.reset();
                
                // Reload accounts
                await this.loadAccounts();
                
                // Reload account selectors in other modules
                await loadAccounts();
            } catch (error) {
                console.error('Error creating account:', error);
                Utils.showError(error.message || 'Failed to create account. Please try again.');
            }
        });
    },
    
    /**
     * Set up edit account form
     */
    setupEditAccountForm: function() {
        const editAccountForm = document.getElementById('edit-account-form');
        
        editAccountForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            try {
                const accountId = document.getElementById('edit-account-id').value;
                
                // Get form data
                const accountData = {
                    name: document.getElementById('edit-account-name').value.trim(),
                    description: document.getElementById('edit-account-description').value.trim()
                };
                
                // Validate
                if (!accountData.name) {
                    Utils.showError('Account name is required');
                    return;
                }
                
                // Update account
                await Api.updateAccount(accountId, accountData);
                
                // Hide modal
                Utils.hideModal('edit-account-modal');
                
                // Reload accounts
                await this.loadAccounts();
                
                // Reload account selectors in other modules
                await loadAccounts();
            } catch (error) {
                console.error('Error updating account:', error);
                Utils.showError(error.message || 'Failed to update account. Please try again.');
            }
        });
    },
    
    /**
     * Load accounts
     */
    loadAccounts: async function() {
        try {
            const accounts = await Api.getAccounts();
            
            // Update accounts table
            this.updateAccountsTable(accounts);
        } catch (error) {
            console.error('Error loading accounts:', error);
            Utils.showError('Failed to load accounts. Please try again.');
        }
    },
    
    /**
     * Update accounts table
     * @param {Array} accounts - List of accounts
     */
    updateAccountsTable: function(accounts) {
        const tableBody = document.querySelector('#accounts-table tbody');
        
        // Clear table
        tableBody.innerHTML = '';
        
        // Check if there are accounts
        if (accounts.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="3" class="text-center">No accounts found</td>';
            tableBody.appendChild(row);
            return;
        }
        
        // Sort accounts by name
        accounts.sort((a, b) => a.name.localeCompare(b.name));
        
        // Add rows
        accounts.forEach((account) => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${account.name}</td>
                <td>${account.description || ''}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-button edit" data-id="${account.id}"><i class="fa-solid fa-edit"></i></button>
                        <button class="action-button delete" data-id="${account.id}"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
            
            // Add event listeners for edit and delete buttons
            row.querySelector('.edit').addEventListener('click', () => {
                this.showEditAccountModal(account);
            });
            
            row.querySelector('.delete').addEventListener('click', () => {
                this.showDeleteAccountConfirmation(account);
            });
            
            tableBody.appendChild(row);
        });
    },
    
    /**
     * Show edit account modal
     * @param {Object} account - Account data
     */
    showEditAccountModal: function(account) {
        // Set account data in form
        document.getElementById('edit-account-id').value = account.id;
        document.getElementById('edit-account-name').value = account.name;
        document.getElementById('edit-account-description').value = account.description || '';
        
        // Show modal
        Utils.showModal('edit-account-modal');
    },
    
    /**
     * Show delete account confirmation
     * @param {Object} account - Account data
     */
    showDeleteAccountConfirmation: function(account) {
        const message = `Are you sure you want to delete the account "${account.name}"? This will also delete all trades associated with this account.`;
        document.getElementById('delete-confirm-message').textContent = message;
        
        // Set up delete button
        const deleteBtn = document.getElementById('delete-confirm-btn');
        deleteBtn.onclick = async () => {
            try {
                await Api.deleteAccount(account.id);
                
                // Hide modal
                Utils.hideModal('delete-confirm-modal');
                
                // Reload accounts
                await this.loadAccounts();
                
                // Reload account selectors in other modules
                await loadAccounts();
                
                // If the deleted account was the selected account, clear it
                const selectedAccount = sessionStorage.getItem('selectedAccount');
                if (selectedAccount === account.name) {
                    sessionStorage.removeItem('selectedAccount');
                    
                    // Reload dashboard with no account selected
                    await Dashboard.loadData();
                }
            } catch (error) {
                console.error('Error deleting account:', error);
                Utils.showError('Failed to delete account. Please try again.');
            }
        };
        
        // Show modal
        Utils.showModal('delete-confirm-modal');
    }
}; 