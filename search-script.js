document.addEventListener('DOMContentLoaded', () => {
    const chatContent = document.getElementById('chat-content');
    const chatInput = document.getElementById('chat-input');
    const chatSendButton = document.getElementById('chat-send-button');
    const chatDictateButton = document.getElementById('chat-dictate-button'); // Select dictate button
    // TODO: Add selectors/listeners for scan and dictate buttons if needed on this page

    // Conversation State Tracking
    let conversationState = 'initial'; // initial, awaiting_product_selection, awaiting_quantity, awaiting_urgency, completed
    let selectedProduct = { name: '', description: '', imgSrc: '', brand: '' }; // Expanded product info
    let selectedQuantity = ''; // Store quantity
    let selectedUrgency = ''; // Store urgency

    // Function to append a message to the chat content
    const addChatMessage = (messageHTML, align = 'start', extraClasses = '') => {
        if (!chatContent) {
            console.error('Chat content area not found');
            return;
        }
        const messageContainer = document.createElement('div');
        messageContainer.className = `flex ${align === 'end' ? 'justify-end' : 'justify-start'} mb-2 ${extraClasses}`;
        messageContainer.innerHTML = messageHTML;
        chatContent.appendChild(messageContainer);
        chatContent.scrollTop = chatContent.scrollHeight; // Scroll to bottom
        return messageContainer; // Return the added element
    };

    // Function to add AI source indicator + message bubble + optional buttons/cards
    const addAiResponse = async (messageText, followupHTML = '') => {
        if (!chatContent) {
            console.error('Chat content area not found for AI message');
            return;
        }
        
        // 1. Show indicator and thinking animation
        const aiIndicatorHTML = `
            <div class="flex items-center space-x-2 text-sm text-gray-600 mb-1 mt-3"> 
                <span class="w-5 h-5 border-2 border-gray-400 rounded-full block shrink-0"></span>
                <span>AMS chat</span>
            </div>
        `;
         chatContent.insertAdjacentHTML('beforeend', aiIndicatorHTML);

        const thinkingBubbleHTML = `
            <div class="bg-white text-gray-500 rounded-lg p-3 max-w-xs shadow inline-flex items-center message-bubble message-bubble-enter">
                 <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
            </div>
        `;
        const thinkingContainer = addChatMessage(thinkingBubbleHTML, 'start'); 
        
        // Force reflow to apply initial state for transition
        thinkingContainer.offsetHeight; 
        // Remove enter class to trigger transition
        thinkingContainer.querySelector('.message-bubble').classList.remove('message-bubble-enter');

        // 2. Wait for a short "thinking" period (e.g., 1 second)
        await new Promise(resolve => setTimeout(resolve, 1000)); 

        // 3. Replace thinking animation with the actual message
        const actualMessageBubbleHTML = `
            <div class="bg-white text-gray-800 rounded-lg p-3 max-w-xs shadow message-bubble message-bubble-enter">
                <p>${messageText || '...'}</p> 
            </div>
        `;
        thinkingContainer.innerHTML = actualMessageBubbleHTML; // Replace content within the same container
        
        // Force reflow & trigger transition for the actual message
        thinkingContainer.offsetHeight; 
        thinkingContainer.querySelector('.message-bubble').classList.remove('message-bubble-enter');

        // 4. Add any follow-up HTML below the message container
        if (followupHTML) {
            const followupContainer = document.createElement('div');
            followupContainer.className = 'flex justify-start flex-col items-start w-full max-w-xs pl-7 mt-2 message-bubble message-bubble-enter'; // Align under AI bubble & animate
            followupContainer.innerHTML = followupHTML;
            chatContent.appendChild(followupContainer); // Append after the message container
            
            // Force reflow & trigger transition for follow-up
            followupContainer.offsetHeight;
            followupContainer.classList.remove('message-bubble-enter');
        }
        
        chatContent.scrollTop = chatContent.scrollHeight; // Scroll down after everything
    }

    // Function to handle the initial product request
    const handleInitialRequest = async (messageText) => {
        chatInput.value = ''; // Input is already cleared in handleSendMessage

        // Reset previous selections when starting a new request
        selectedProduct = { name: '', description: '', imgSrc: '', brand: '' }; 
        selectedQuantity = '';
        selectedUrgency = '';

        // Simulate AI response with product choices
        const choosePrompt = "Choose one";
        const productCard1HTML = `
            <div class="product-card bg-white rounded-lg shadow p-4 flex space-x-4 items-start cursor-pointer hover:shadow-md transition-shadow w-full mt-2">
                <img src="user-photo.jpg" alt="Product Image" class="w-20 h-auto object-contain rounded border bg-gray-100 shrink-0">
                <div class="flex-grow pointer-events-none">
                    <h3 class="font-semibold text-gray-800">Exam Glove McKesson Confiderm Large</h3>
                    <p class="text-xs text-gray-500 mt-1 mb-2 line-clamp-2">NONSTERILE VINYL STANDARD CUFF LENGTH SMOOTH CLEAR NO...</p>
                    <button class="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-300 pointer-events-auto">Brand - McKesson</button>
                </div>
            </div>
        `;
        const productCard2HTML = `
            <div class="product-card bg-white rounded-lg shadow p-4 flex space-x-4 items-start cursor-pointer hover:shadow-md transition-shadow w-full mt-2">
                <img src="user-photo.jpg" alt="Product Image" class="w-20 h-auto object-contain rounded border bg-gray-100 shrink-0">
                <div class="flex-grow pointer-events-none">
                    <h3 class="font-semibold text-gray-800">Exam Glove McKesson Confiderm Small</h3>
                    <p class="text-xs text-gray-500 mt-1 mb-2 line-clamp-2">NONSTERILE VINYL STANDARD CUFF LENGTH SMOOTH CLEAR NO...</p>
                    <button class="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-300 pointer-events-auto">Brand - McKesson</button>
                </div>
            </div>
        `;
        const productsHTML = productCard1HTML + productCard2HTML;
        await addAiResponse(choosePrompt, productsHTML);
        addProductCardListeners();
        conversationState = 'awaiting_product_selection';
    };

    // Function to handle quantity input
    const handleQuantityInput = async (quantityText) => {
         selectedQuantity = quantityText; // Store quantity
         console.log('Quantity stored:', selectedQuantity);
         chatInput.value = ''; // Input is already cleared in handleSendMessage

        // Ask for urgency level
        const urgencyPrompt = "What is Urgency Level?";
        const urgencyButtonsHTML = `
            <div class="space-y-2 pt-2 pb-4 flex flex-col items-start w-full">
                <button class="urgency-button bg-white text-gray-800 rounded-lg shadow px-4 py-3 w-full text-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">High</button>
                <button class="urgency-button bg-white text-gray-800 rounded-lg shadow px-4 py-3 w-full text-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Normal</button>
                <button class="urgency-button bg-white text-gray-800 rounded-lg shadow px-4 py-3 w-full text-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Low</button>
            </div>
        `;
        await addAiResponse(urgencyPrompt, urgencyButtonsHTML);
        conversationState = 'awaiting_urgency';
    };

    // Main handler for text input submission
    const handleSendMessage = async () => {
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        const userMessageHTML = `
            <div class="bg-blue-900 text-white rounded-lg p-3 max-w-xs shadow">
                <p>${messageText}</p>
            </div>
        `;
        addChatMessage(userMessageHTML, 'end'); 
        chatInput.value = ''; // Clear input
        chatInput.dispatchEvent(new Event('input')); // Reset buttons

        // --- Handle different conversation states ---
        if (conversationState === 'initial') {
            await handleInitialRequest(messageText);
        } else if (conversationState === 'awaiting_quantity') {
            await handleQuantityInput(messageText);
        } else {
             // Default handling for other states
             console.log('Received message in state:', conversationState, messageText);
             await addAiResponse("Okay.");
        }
    };

    // Function to handle product card selection
    const handleProductSelection = async (event) => {
        const card = event.currentTarget;
        selectedProduct = {
             name: card.querySelector('h3')?.textContent || 'Selected Product',
             description: card.querySelector('p')?.textContent || 'Description...',
             imgSrc: 'user-photo.jpg',
             brand: card.querySelector('button')?.textContent || 'Brand'
         };
        console.log('Product selected:', selectedProduct);

        // Remove or visually disable product cards (optional)
         const allCards = chatContent.querySelectorAll('.product-card');
         allCards.forEach(c => {
             // Prevent further clicks on other cards after selection
             c.removeEventListener('click', handleProductSelection); 
             c.style.opacity = '0.5';
             c.style.cursor = 'default';
            }); 
         card.style.opacity = '1';
         card.style.border = '2px solid #3b82f6'; 
         card.style.cursor = 'default'; // Remove pointer cursor from selected too

        // Ask for quantity - REMOVE setTimeout, use await directly
        await addAiResponse("How many packages do you need?");
        conversationState = 'awaiting_quantity';
        if(chatInput) chatInput.focus();
    };

    // Add listeners to dynamically added product cards
    const addProductCardListeners = () => {
        const productCards = chatContent ? chatContent.querySelectorAll('.product-card') : [];
        productCards.forEach(card => {
            card.removeEventListener('click', handleProductSelection); // Prevent duplicates
            card.addEventListener('click', handleProductSelection);
        });
    };

     // Function to handle urgency button selection
     const handleUrgencySelection = async (event) => {
         if (!event.target.matches('.urgency-button')) return;

         selectedUrgency = event.target.textContent.trim(); // Store urgency
         console.log('Urgency selected:', selectedUrgency);

         // Hide urgency buttons
         const buttonContainer = event.target.closest('div');
         if (buttonContainer) buttonContainer.remove();

         // Display user's choice
         const userMessageHTML = `
            <div class="bg-blue-900 text-white rounded-lg p-3 max-w-xs shadow">
                <p>${selectedUrgency}</p>
            </div>
         `;
         addChatMessage(userMessageHTML, 'end');

         // Final AI confirmation CARD - REMOVE setTimeout, use await directly
         const summaryCardHTML = `
             <div class="bg-white rounded-lg shadow p-4 border border-gray-200 w-full">
                 
                 <div class="flex space-x-3 items-start border-b pb-3 mb-3">
                      <img src="user-photo.jpg" alt="Product Image" class="w-16 h-auto object-contain rounded border bg-gray-100 shrink-0">
                      <div class="flex-grow">
                          <h3 class="font-semibold text-gray-800 text-sm">${selectedProduct.name}</h3>
                          <p class="text-xs text-gray-500 mt-1 mb-2 line-clamp-2">${selectedProduct.description}</p>
                          <button class="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">${selectedProduct.brand}</button>
                      </div>
                 </div>
                 
                 <div class="space-y-1 text-sm mb-4">
                     <div class="flex justify-between">
                          <span class="text-gray-500">Quantity:</span>
                          <span class="font-medium text-gray-800">${selectedQuantity || '-'}</span>
                     </div>
                     <div class="flex justify-between">
                          <span class="text-gray-500">Urgency Level:</span>
                          <span class="font-medium text-gray-800">${selectedUrgency || '-'}</span>
                     </div>
                     <div class="flex justify-between">
                          <span class="text-gray-500">Additional Notes:</span>
                          <span class="font-medium text-gray-800">-</span>
                     </div>
                 </div>
                 
                 <button id="final-request-button" class="w-full bg-gray-900 text-white rounded-full py-2.5 px-4 text-sm font-semibold hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800">
                     Request Product
                 </button>
             </div>
         `;
         await addAiResponse("", summaryCardHTML); 

         conversationState = 'completed';

         // Add listener for the final request button
         const finalRequestButton = document.getElementById('final-request-button');
         if (finalRequestButton) {
             finalRequestButton.addEventListener('click', () => {
                 console.log('Final request submitted with:', selectedProduct, selectedQuantity, selectedUrgency);
                 try {
                     const existingRequests = JSON.parse(localStorage.getItem('productRequests') || '[]');
                     const newRequest = {
                         id: Date.now(), name: selectedProduct.name, imgSrc: selectedProduct.imgSrc,
                         quantity: selectedQuantity, urgency: selectedUrgency,
                         trackingNumber: 'AQ' + Math.random().toString().substring(2, 12).toUpperCase(),
                         status: 'processing'
                     };
                     existingRequests.push(newRequest);
                     localStorage.setItem('productRequests', JSON.stringify(existingRequests));
                     console.log('Saved requests to localStorage:', existingRequests);
                 } catch (error) {
                     console.error('Error saving request to localStorage:', error);
                 }
                 localStorage.setItem('showRequestToast', 'true');
                 window.location.href = 'index.html'; 
             });
         }
     };

    // Function to toggle Send/Dictate button based on input value
    const toggleInputButtons = () => {
        console.log('toggleInputButtons called'); // Log when function starts
        if (!chatInput || !chatSendButton || !chatDictateButton) {
            console.error('Missing button/input elements for toggle');
            return;
        }
        const hasValue = chatInput.value.trim().length > 0;
        console.log('Input has value:', hasValue); // Log the check result

        chatSendButton.classList.toggle('hidden', !hasValue);
        chatDictateButton.classList.toggle('hidden', hasValue);
        console.log('Send hidden:', chatSendButton.classList.contains('hidden')); // Log final state
        console.log('Dictate hidden:', chatDictateButton.classList.contains('hidden')); // Log final state
    };

    // --- Event Listeners Setup ---
    if (chatSendButton) {
        chatSendButton.addEventListener('click', handleSendMessage);
    }
    if (chatInput) {
        chatInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleSendMessage();
            }
        });
        // Add input event listener
        chatInput.addEventListener('input', () => { 
            console.log('Input event fired!'); // Log when event listener triggers
            toggleInputButtons();
        });
    }
    if (chatContent) {
        chatContent.addEventListener('click', handleUrgencySelection);
    }
    if (chatDictateButton) {
        // TODO: Implement dictate button functionality for this page if needed
        chatDictateButton.addEventListener('click', () => {
            alert('Dictate button clicked (implement functionality)');
        });
    }

    // Call initially to set correct button state
    toggleInputButtons(); 

}); 