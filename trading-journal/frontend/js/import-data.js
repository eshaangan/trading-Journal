/**
 * Import Data module for the Trading Journal application
 */
const ImportData = {
    /**
     * Initialize the import data module
     */
    init: function() {
        this.setupImportForm();
    },
    
    /**
     * Set up import form
     */
    setupImportForm: function() {
        const importForm = document.getElementById('import-form');
        
        importForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            try {
                const accountSelect = document.getElementById('import-account');
                const fileInput = document.getElementById('csv-file');
                
                // Validate inputs
                if (!accountSelect.value) {
                    Utils.showError('Please select an account');
                    return;
                }
                
                if (!fileInput.files || fileInput.files.length === 0) {
                    Utils.showError('Please select a CSV file');
                    return;
                }
                
                const file = fileInput.files[0];
                
                // Check file extension
                if (!file.name.toLowerCase().endsWith('.csv')) {
                    Utils.showError('Please select a CSV file');
                    return;
                }
                
                // Import trades
                const result = await Api.importTrades(file, accountSelect.value);
                
                // Show import results
                this.showImportResults(result);
                
                // Reset form
                importForm.reset();
                
                // Reload data
                await Dashboard.loadData();
                await TradeJournal.loadTrades();
            } catch (error) {
                console.error('Error importing trades:', error);
                
                // Show error results
                this.showImportResults({
                    success: false,
                    message: error.message || 'Failed to import trades. Please try again.'
                });
            }
        });
    },
    
    /**
     * Show import results
     * @param {Object} result - Import result
     */
    showImportResults: function(result) {
        const importResults = document.getElementById('import-results');
        const importMessage = document.getElementById('import-message');
        
        // Set message
        if (result.success) {
            importResults.className = 'success';
            
            let message = result.message;
            
            if (result.total && result.imported !== undefined && result.duplicates !== undefined) {
                message += `<br>Total: ${result.total}, Imported: ${result.imported}, Duplicates: ${result.duplicates}`;
            }
            
            importMessage.innerHTML = message;
        } else {
            importResults.className = 'error';
            importMessage.textContent = result.message || 'Failed to import trades';
        }
        
        // Show results
        importResults.classList.remove('hidden');
        
        // Hide results after 10 seconds
        setTimeout(() => {
            importResults.classList.add('hidden');
        }, 10000);
    }
}; 