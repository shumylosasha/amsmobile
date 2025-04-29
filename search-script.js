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
            <div class="flex items-center space-x-2 text-sm text-section-subtitle mb-1 mt-3"> 
                <span class="w-5 h-5 border-2 border-nav-passive-icon rounded-full block shrink-0"></span>
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
            <div class="bg-white text-section-title rounded-lg p-3 max-w-xs shadow message-bubble message-bubble-enter">
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
                <img src="https://imgcdn.mckesson.com/CumulusWeb/Images/Original_Image/765876_ppkgleft.jpg" alt="Exam Glove Large" class="w-20 h-20 object-contain rounded border bg-gray-100 shrink-0">
                <div class="flex-grow pointer-events-none">
                    <h3 class="font-semibold text-section-title">Exam Glove McKesson Confiderm Large</h3>
                    <p class="text-xs text-section-subtitle mt-1 mb-2 line-clamp-2">NONSTERILE VINYL STANDARD CUFF LENGTH SMOOTH CLEAR NO...</p>
                    <button class="text-xs bg-gray-200 text-section-subtitle px-3 py-1 rounded-full hover:bg-gray-300 pointer-events-auto">Brand - McKesson</button>
                </div>
            </div>
        `;
        const productCard2HTML = `
            <div class="product-card bg-white rounded-lg shadow p-4 flex space-x-4 items-start cursor-pointer hover:shadow-md transition-shadow w-full mt-2">
                <img src="https://m.media-amazon.com/images/I/51SrQanqqpL._AC_.jpg" alt="Exam Glove Small" class="w-20 h-20 object-contain rounded border bg-gray-100 shrink-0">
                <div class="flex-grow pointer-events-none">
                    <h3 class="font-semibold text-section-title">Exam Glove McKesson Confiderm Small</h3>
                    <p class="text-xs text-section-subtitle mt-1 mb-2 line-clamp-2">NONSTERILE VINYL STANDARD CUFF LENGTH SMOOTH CLEAR NO...</p>
                    <button class="text-xs bg-gray-200 text-section-subtitle px-3 py-1 rounded-full hover:bg-gray-300 pointer-events-auto">Brand - McKesson</button>
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
                <button class="urgency-button bg-white text-section-title rounded-lg shadow px-4 py-3 w-full text-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nav-active-icon">High</button>
                <button class="urgency-button bg-white text-section-title rounded-lg shadow px-4 py-3 w-full text-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nav-active-icon">Normal</button>
                <button class="urgency-button bg-white text-section-title rounded-lg shadow px-4 py-3 w-full text-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nav-active-icon">Low</button>
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
            <div class="bg-nav-active-icon text-white rounded-lg p-3 max-w-xs shadow">
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
             imgSrc: card.querySelector('img')?.src || '',
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
         card.style.border = '2px solid #004E70'; // Changed to nav-active-icon color 
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
            <div class="bg-nav-active-icon text-white rounded-lg p-3 max-w-xs shadow">
                <p>${selectedUrgency}</p>
            </div>
         `;
         addChatMessage(userMessageHTML, 'end');

         // Final AI confirmation CARD - REMOVE setTimeout, use await directly
         const summaryCardHTML = `
             <div class="bg-white rounded-lg shadow p-4 border border-gray-200 w-full">
                 
                 <div class="flex space-x-3 items-start border-b pb-3 mb-3">
                      <img src="${selectedProduct.imgSrc}" alt="Product Image" class="w-16 h-16 object-contain rounded border bg-gray-100 shrink-0">
                      <div class="flex-grow">
                          <h3 class="font-semibold text-section-title text-sm">${selectedProduct.name}</h3>
                          <p class="text-xs text-section-subtitle mt-1 mb-2 line-clamp-2">${selectedProduct.description}</p>
                          <button class="text-xs bg-gray-200 text-section-subtitle px-2 py-0.5 rounded-full">${selectedProduct.brand}</button>
                      </div>
                 </div>
                 
                 <div class="space-y-1 text-sm mb-4">
                     <div class="flex justify-between">
                          <span class="text-section-subtitle">Quantity:</span>
                          <span class="font-medium text-section-title">${selectedQuantity || '-'}</span>
                     </div>
                     <div class="flex justify-between">
                          <span class="text-section-subtitle">Urgency Level:</span>
                          <span class="font-medium text-section-title">${selectedUrgency || '-'}</span>
                     </div>
                     <div class="flex justify-between">
                          <span class="text-section-subtitle">Additional Notes:</span>
                          <span class="font-medium text-section-title">-</span>
                     </div>
                 </div>
                 
                 <div class="flex flex-col space-y-2">
                     <button class="bg-nav-active-icon text-white font-medium py-2.5 px-4 rounded-lg hover:bg-blue-700">Submit Request</button>
                     <button class="bg-white text-section-title font-medium py-2.5 px-4 rounded-lg border border-gray-300 hover:bg-gray-50">Edit Request</button>
                 </div>
                 
             </div>
         `;
             
         await addAiResponse("Order summary:", summaryCardHTML);
         conversationState = 'completed';
     };

     // Add listener for the AI answer to handle the urgency buttons
     chatContent.addEventListener('click', handleUrgencySelection);
     
     // Show/hide send button based on chat input content
     const toggleInputButtons = () => {
         if (chatInput.value.trim().length > 0) {
             chatSendButton.classList.remove('hidden');
             chatDictateButton.classList.add('hidden');
         } else {
             chatSendButton.classList.add('hidden');
             chatDictateButton.classList.remove('hidden');
         }
     };
     
     // Register event listeners
     if (chatInput) {
         chatInput.addEventListener('input', toggleInputButtons);
         chatInput.addEventListener('keypress', (e) => {
             if (e.key === 'Enter') handleSendMessage();
         });
     }
     
     if (chatSendButton) {
         chatSendButton.addEventListener('click', handleSendMessage);
     }
     
     if (chatDictateButton) {
         chatDictateButton.addEventListener('click', () => {
             alert('Speech recognition would be triggered here'); // Placeholder
         });
     }
     
     // Set initial state for buttons
     toggleInputButtons();
}); 