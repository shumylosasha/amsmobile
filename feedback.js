document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const modal = document.getElementById('feedback-modal');
    const addFeedbackBtn = document.getElementById('add-feedback-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const prevStepBtn = document.getElementById('prev-step-btn');
    const nextStepBtn = document.getElementById('next-step-btn');
    const submitFeedbackBtn = document.getElementById('submit-feedback-btn');
    const feedbackList = document.getElementById('feedback-list');
    const feedbackText = document.getElementById('feedback-text');
    const steps = document.querySelectorAll('.modal-step');
    const stepIndicators = document.querySelectorAll('.step');
    const stars = document.querySelectorAll('.star');

    // State
    let currentStep = 1;
    const maxSteps = 3;
    const feedbackData = {
        type: '',
        method: '',
        text: '',
        product: '',
        rating: 0,
        category: ''
    };

    // Functions
    function updateStepVisibility() {
        steps.forEach(step => {
            step.style.display = step.dataset.step == currentStep ? 'block' : 'none';
        });

        stepIndicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index + 1 <= currentStep);
        });

        // Update navigation buttons
        prevStepBtn.style.display = currentStep > 1 ? 'block' : 'none';
        nextStepBtn.style.display = currentStep < maxSteps ? 'block' : 'none';
        submitFeedbackBtn.style.display = currentStep === maxSteps ? 'block' : 'none';
    }

    function goToNextStep() {
        if (currentStep < maxSteps) {
            currentStep++;
            updateStepVisibility();
        }
    }

    function goToPrevStep() {
        if (currentStep > 1) {
            currentStep--;
            updateStepVisibility();
        }
    }

    function resetModal() {
        currentStep = 1;
        feedbackData.type = '';
        feedbackData.method = '';
        feedbackData.text = '';
        feedbackData.product = '';
        feedbackData.rating = 0;
        feedbackData.category = '';
        
        // Reset UI elements
        document.querySelectorAll('.choice-btn, .method-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        feedbackText.value = '';
        document.getElementById('product-select').value = '';
        document.getElementById('category-select').value = '';
        stars.forEach(star => star.classList.remove('selected'));
        
        updateStepVisibility();
    }

    function openModal() {
        resetModal();
        modal.classList.add('show');
    }

    function closeModal() {
        modal.classList.remove('show');
        setTimeout(resetModal, 300); // Reset after animation
    }

    // Event Listeners
    addFeedbackBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    prevStepBtn.addEventListener('click', goToPrevStep);
    nextStepBtn.addEventListener('click', goToNextStep);

    // Close modal if clicked outside
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Choice buttons (Step 1)
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            feedbackData.type = btn.dataset.type;
        });
    });

    // Method buttons (Step 2)
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            feedbackData.method = btn.dataset.method;

            // Handle method-specific actions
            if (btn.dataset.method === 'dictate') {
                // TODO: Implement speech recognition
                console.log('Dictation selected');
            } else if (btn.dataset.method === 'camera') {
                // TODO: Implement camera functionality
                console.log('Camera selected');
            }
        });
    });

    // Rating stars
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            feedbackData.rating = rating;
            stars.forEach(s => {
                s.classList.toggle('selected', parseInt(s.dataset.rating) <= rating);
            });
        });
    });

    // Form inputs (Step 3)
    document.getElementById('product-select').addEventListener('change', (e) => {
        feedbackData.product = e.target.value;
    });

    document.getElementById('category-select').addEventListener('change', (e) => {
        feedbackData.category = e.target.value;
    });

    feedbackText.addEventListener('input', (e) => {
        feedbackData.text = e.target.value;
    });

    // Submit feedback
    submitFeedbackBtn.addEventListener('click', () => {
        if (!feedbackData.type) {
            alert('Please select a feedback type');
            return;
        }

        if (!feedbackData.text && !feedbackData.method) {
            alert('Please enter your feedback or select an input method');
            return;
        }

        if (!feedbackData.product) {
            alert('Please select a product');
            return;
        }

        if (!feedbackData.rating) {
            alert('Please provide a rating');
            return;
        }

        if (!feedbackData.category) {
            alert('Please select a category');
            return;
        }

        // Create feedback card
        const feedbackCard = document.createElement('div');
        feedbackCard.classList.add('feedback-card');
        feedbackCard.innerHTML = `
            <strong>${feedbackData.type.charAt(0).toUpperCase() + feedbackData.type.slice(1)}</strong>
            <p>${feedbackData.text}</p>
            <div class="feedback-meta">
                <span>Product: ${feedbackData.product}</span>
                <span>Rating: ${'★'.repeat(feedbackData.rating)}${'☆'.repeat(5-feedbackData.rating)}</span>
                <span>Category: ${feedbackData.category}</span>
            </div>
        `;

        // Remove initial message if it exists
        const initialMessage = feedbackList.querySelector('p');
        if (initialMessage) {
            feedbackList.removeChild(initialMessage);
        }

        feedbackList.appendChild(feedbackCard);
        closeModal();
    });
}); 