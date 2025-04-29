import { saveProductRequest, queueOfflineOperation } from './db-utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('productRequestForm');
    const submitButton = document.getElementById('submitButton');
    const statusMessage = document.getElementById('statusMessage');

    // Check if online
    function isOnline() {
        return navigator.onLine;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Disable the submit button and show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
        statusMessage.textContent = '';

        // Get form data
        const formData = {
            productName: document.getElementById('productName').value,
            quantity: document.getElementById('quantity').value,
            urgency: document.getElementById('urgency').value,
            description: document.getElementById('description').value,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        try {
            if (isOnline()) {
                // If online, save directly to Supabase
                await saveProductRequest(formData);
                statusMessage.textContent = 'Product request submitted successfully!';
                statusMessage.className = 'text-green-500';
            } else {
                // If offline, queue for later
                queueOfflineOperation('saveProductRequest', formData);
                statusMessage.textContent = 'Product request saved offline. Will sync when online.';
                statusMessage.className = 'text-yellow-500';
            }
            
            // Clear form
            form.reset();
            
            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } catch (error) {
            console.error('Error submitting request:', error);
            statusMessage.textContent = 'Error submitting request. Please try again.';
            statusMessage.className = 'text-red-500';
        } finally {
            // Re-enable the submit button
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Request';
        }
    });
}); 