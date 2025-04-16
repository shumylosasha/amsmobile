document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('productRequestForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form data
        const formData = {
            productName: document.getElementById('productName').value,
            quantity: document.getElementById('quantity').value,
            urgency: document.getElementById('urgency').value,
            description: document.getElementById('description').value,
            timestamp: new Date().toISOString()
        };

        try {
            // For now, we'll just log the data
            console.log('Product Request:', formData);
            
            // Clear form
            form.reset();

            // Show success message
            alert('Product request submitted successfully!');
            
            // Redirect back to home page
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error submitting request:', error);
            alert('Error submitting request. Please try again.');
        }
    });
}); 