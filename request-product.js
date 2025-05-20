import { saveProductRequest } from './db-utils.js';
import supabase from './supabase.js';
import config from './config.js';

// Product categories and items data
const productData = {
    categories: [
        {
            id: 'protective',
            name: 'Protective Equipment',
            items: [
                { id: 'synguard-nitrile', name: 'Synguard Nitrile Exam Gloves', image: 'https://m.media-amazon.com/images/I/6166OEAwJ9L._AC_SX679_.jpg' },
                { id: 'gloves-m', name: 'Gloves - Size M', image: 'https://www.gloves.com/cdn/shop/articles/maskmedicare-shop-zCsup0tF-q4-unsplash.jpg?v=1673613431' },
                { id: 'gloves-l', name: 'Gloves - Size L', image: 'https://www.gloves.com/cdn/shop/articles/maskmedicare-shop-zCsup0tF-q4-unsplash.jpg?v=1673613431' },
                { id: 'masks', name: 'Masks - Type IIR', image: 'https://hdbrows.com/shop/pro/media/catalog/product/cache/83883c3d58d0958e9d4c7e2cf62df9ac/t/y/type-iir-mask.jpg' }
            ]
        },
        {
            id: 'surgical',
            name: 'Surgical Instruments',
            items: [
                { id: 'scissors', name: 'Surgical Scissors', image: 'https://cdn.webshopapp.com/shops/308248/files/472938159/325x325x2/medipharchem-surgical-scissors-st-st-curved.jpg' },
                { id: 'forceps', name: 'Forceps', image: 'https://cdn.webshopapp.com/shops/308248/files/472938159/325x325x2/medipharchem-surgical-scissors-st-st-curved.jpg' }
            ]
        },
        {
            id: 'monitoring',
            name: 'Monitoring Equipment',
            items: [
                { id: 'bp-monitor', name: 'Blood Pressure Monitor', image: 'https://cdn.webshopapp.com/shops/308248/files/472938159/325x325x2/medipharchem-surgical-scissors-st-st-curved.jpg' },
                { id: 'thermometer', name: 'Digital Thermometer', image: 'https://cdn.webshopapp.com/shops/308248/files/472938159/325x325x2/medipharchem-surgical-scissors-st-st-curved.jpg' }
            ]
        }
    ]
};

// Request state to track selections
let requestState = {
    selectedProduct: null,
    photo: null,
    method: 'text' // Default method
};

// Authentication function
async function signInUser() {
    try {
        // Check if user is already signed in
        const { data: { user }, error: getUserError } = await supabase.auth.getUser();
        
        if (getUserError) {
            console.error('Error checking user:', getUserError);
        }
        
        if (!user) {
            console.log('No authenticated user, attempting to sign in...');
            // Try signing in with test credentials
            const { data, error } = await supabase.auth.signInWithPassword({
                email: 'test@example.com',
                password: 'test123'
            });
            
            if (error) {
                console.error('Authentication error:', error.message);
                // Try signing up if sign in fails
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: 'test@example.com',
                    password: 'test123'
                });
                
                if (signUpError) {
                    console.error('Sign up error:', signUpError.message);
                    throw new Error(`Authentication failed: ${signUpError.message}`);
                } else {
                    console.log('User signed up:', signUpData);
                    return signUpData.user;
                }
            } else {
                console.log('User authenticated:', data);
                return data.user;
            }
        } else {
            console.log('User already authenticated:', user);
            return user;
        }
    } catch (error) {
        console.error('Authentication error:', error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('productRequestForm');
    const submitButton = document.getElementById('submitButton');
    const statusMessage = document.getElementById('statusMessage');

    // Sign in the user when the page loads
    await signInUser();

    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const dictatedText = urlParams.get('dictatedText');
    
    // If there's dictated text, populate the reason field
    if (dictatedText) {
        const reasonInput = document.getElementById('reason');
        if (reasonInput) {
            reasonInput.value = dictatedText;
        }
    }

    // Function to show loading state
    function showLoadingState() {
        const aiDetectionNotice = document.getElementById('ai-detection-notice');
        aiDetectionNotice.classList.remove('hidden');
        aiDetectionNotice.innerHTML = `
            <div class="bg-blue-50 rounded-md p-3 mt-2">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <svg class="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-blue-700">Analyzing image...</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Check for photo in localStorage
    const photoSource = urlParams.get('photoSource');
    
    if (photoSource === 'localStorage') {
        const photoDataToUse = localStorage.getItem('capturedImage');
        console.log('Photo from localStorage detected. Data length:', 
            photoDataToUse ? photoDataToUse.length : 0,
            'Data starts with:',
            photoDataToUse ? photoDataToUse.substring(0, 50) + '...' : 'null');
            
        if (photoDataToUse) {
            const photoPreview = document.getElementById('photo-preview');
            const removePhotoBtn = document.getElementById('remove-photo');
            
            if (photoPreview) {
                photoPreview.src = photoDataToUse;
                photoPreview.style.display = 'block';
                
                // Show the remove button
                if (removePhotoBtn) {
                    removePhotoBtn.classList.remove('hidden');
                }
                
                // Store in request state
                requestState.photo = photoDataToUse;
                requestState.method = 'photo';
                console.log('Stored photo from localStorage in requestState. Length:', 
                    requestState.photo ? requestState.photo.length : 0);
                
                // Add analyzing class to trigger animation
                photoPreview.classList.add('analyzing');
                
                // Show loading state immediately
                showLoadingState();
                
                // Start product detection
                analyzeImageWithChatGPT(photoDataToUse)
                    .then(result => {
                        console.log('Analysis result:', result);
                        showAnalysisResult(result);
                    })
                    .catch(error => {
                        console.error('Error during product detection:', error);
                        showAnalysisResult({
                            productName: 'Unknown',
                            productType: 'Other',
                            description: `Error analyzing image: ${error.message}`,
                            scenario: 3
                        });
                    })
                    .finally(() => {
                        photoPreview.classList.remove('analyzing');
                        // Don't clear from localStorage after retrieving
                        // We want to keep it for the upload
                        // localStorage.removeItem('capturedImage');
                    });
            }
        }
    }

    let currentCategory = null;

    // Product selector elements
    const productButton = document.getElementById('product-selector-button');
    const productDropdown = document.getElementById('product-dropdown');
    const productOverlay = document.getElementById('product-overlay');
    const productList = document.getElementById('product-list');
    const breadcrumb = document.getElementById('product-breadcrumb');

    // Show product selector
    if (productButton) {
        productButton.addEventListener('click', () => {
            productDropdown.classList.add('active');
            productOverlay.classList.add('active');
            if (!currentCategory) {
                showCategories();
            }
        });
    }

    // Hide product selector
    if (productOverlay) {
        productOverlay.addEventListener('click', () => {
            productDropdown.classList.remove('active');
            productOverlay.classList.remove('active');
            currentCategory = null;
            updateBreadcrumb();
        });
    }

    // Function to show categories
    function showCategories() {
        productList.innerHTML = productData.categories.map(category => `
            <div class="category-item" data-category-id="${category.id}">
                <div class="flex justify-between items-center">
                    <span class="text-gray-900">${category.name}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                </div>
            </div>
        `).join('');

        // Add click handlers for categories
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                const categoryId = item.dataset.categoryId;
                currentCategory = productData.categories.find(c => c.id === categoryId);
                showProducts(currentCategory);
                updateBreadcrumb();
            });
        });
    }

    function showProducts(category) {
        productList.innerHTML = category.items.map(item => `
            <div class="product-item" data-product-id="${item.id}">
                <img src="${item.image}" alt="${item.name}">
                <span class="text-gray-900">${item.name}</span>
            </div>
        `).join('');

        // Add click handlers for products
        document.querySelectorAll('.product-item').forEach(item => {
            item.addEventListener('click', () => {
                const productId = item.dataset.productId;
                const selectedProduct = category.items.find(p => p.id === productId);
                selectProduct(selectedProduct);
            });
        });
    }

    function updateBreadcrumb() {
        if (currentCategory) {
            breadcrumb.innerHTML = `
                <span class="breadcrumb-item" id="category-back">Categories</span>
                <span class="breadcrumb-separator">/</span>
                <span class="breadcrumb-item active">${currentCategory.name}</span>
            `;
            document.getElementById('category-back').addEventListener('click', () => {
                currentCategory = null;
                showCategories();
                updateBreadcrumb();
            });
        } else {
            breadcrumb.innerHTML = '<span class="breadcrumb-item active">Categories</span>';
        }
    }

    function selectProduct(product) {
        if (!product) {
            console.warn('Attempted to select null product');
            return;
        }
        console.log('Selecting product:', product.name);
        
        const selectedProductText = document.getElementById('selected-product-text');
        const productButton = document.getElementById('product-selector-button');
        
        if (selectedProductText) {
            selectedProductText.textContent = product.name;
        }
        if (productButton) {
            productButton.classList.add('selected');
        }
        
        productDropdown.classList.remove('active');
        productOverlay.classList.remove('active');
        currentCategory = null;
        updateBreadcrumb();
    }

    // Initialize categories view
    showCategories();

    // Add search functionality
    const productSearch = document.getElementById('product-search');
    if (productSearch) {
        productSearch.addEventListener('input', (e) => {
            const searchQuery = e.target.value.toLowerCase();
            
            if (currentCategory) {
                // Search within current category
                const filteredProducts = currentCategory.items.filter(item => 
                    item.name.toLowerCase().includes(searchQuery)
                );
                showProducts({ ...currentCategory, items: filteredProducts });
            } else {
                // Search across all categories
                const filteredCategories = productData.categories.map(category => ({
                    ...category,
                    items: category.items.filter(item => 
                        item.name.toLowerCase().includes(searchQuery)
                    )
                })).filter(category => category.items.length > 0);

                if (filteredCategories.length > 0) {
                    productList.innerHTML = filteredCategories.map(category => `
                        <div class="category-item" data-category-id="${category.id}">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-900">${category.name}</span>
                                <span class="text-sm text-gray-500">${category.items.length} items</span>
                            </div>
                            <div class="mt-2 space-y-2">
                                ${category.items.map(item => `
                                    <div class="product-item pl-4" data-product-id="${item.id}">
                                        <img src="${item.image}" alt="${item.name}">
                                        <span class="text-gray-900">${item.name}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('');

                    // Add click handlers for both categories and products
                    document.querySelectorAll('.category-item').forEach(item => {
                        item.addEventListener('click', (e) => {
                            if (!e.target.closest('.product-item')) {
                                const categoryId = item.dataset.categoryId;
                                currentCategory = productData.categories.find(c => c.id === categoryId);
                                showProducts(currentCategory);
                                updateBreadcrumb();
                            }
                        });
                    });

                    document.querySelectorAll('.product-item').forEach(item => {
                        item.addEventListener('click', () => {
                            const productId = item.dataset.productId;
                            const selectedProduct = productData.categories
                                .flatMap(c => c.items)
                                .find(p => p.id === productId);
                            selectProduct(selectedProduct);
                        });
                    });
                } else {
                    productList.innerHTML = `
                        <div class="p-4 text-center text-gray-500">
                            No products found matching "${searchQuery}"
                        </div>
                    `;
                }
            }
        });
    }

    // Check if online
    function isOnline() {
        return navigator.onLine;
    }

    // Form submission handler
    const productRequestForm = document.getElementById('productRequestForm');
    
    if (productRequestForm) {
        productRequestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                // Get the selected product from the request state or the button text
                const selectedProductText = document.getElementById('selected-product-text');
                const selectedProduct = requestState.selectedProduct ? 
                    requestState.selectedProduct.name : 
                    (selectedProductText.textContent !== 'Select Product' ? selectedProductText.textContent : null);
                
                // Get form field values
                const quantity = document.getElementById('quantity').value;
                const reason = document.getElementById('reason').value;
                const urgent = document.getElementById('urgent').checked;
                const preferredBrand = document.getElementById('preferredBrand').value;
                const expectedDelivery = document.getElementById('expectedDelivery').value;
                
                // Validate form
                if (!selectedProduct) {
                    throw new Error('Please select a product');
                }
                
                if (!quantity || quantity < 1) {
                    throw new Error('Please enter a valid quantity');
                }
                
                if (!reason) {
                    throw new Error('Please enter a reason for your request');
                }
                
                // Get current user
                const { data: { user } } = await supabase.auth.getUser();
                
                // Upload image if exists
                let imageUrl = null;
                if (requestState.photo) {
                    console.log('Photo detected, starting upload...');
                    console.log('Photo data type:', typeof requestState.photo);
                    console.log('Photo data length:', requestState.photo.length);
                    console.log('Photo data starts with:', requestState.photo.substring(0, 50) + '...');
                    
                    // Check if this came from localStorage (search params)
                    const urlParams = new URLSearchParams(window.location.search);
                    const photoSource = urlParams.get('photoSource');
                    
                    if (photoSource === 'localStorage') {
                        console.log('This is a localStorage photo, processing accordingly');
                        // Make sure image is properly formatted as data URL
                        if (!requestState.photo.startsWith('data:image')) {
                            console.log('Photo does not start with data:image, prepending prefix');
                            requestState.photo = 'data:image/jpeg;base64,' + requestState.photo.replace(/^data:image\/jpeg;base64,/, '');
                        }
                    }
                    
                    imageUrl = await uploadProductImage(requestState.photo);
                    console.log('Image upload completed, URL:', imageUrl);
                } else {
                    console.log('No photo to upload');
                }
                
                // Prepare request data
                const requestData = {
                    product_name: selectedProduct,
                    quantity: parseInt(quantity),
                    urgency: urgent ? 'critical' : 'normal',
                    description: reason,
                    preferred_brand: preferredBrand || null,
                    expected_delivery: expectedDelivery || null,
                    timestamp: new Date().toISOString(),
                    status: 'pending',
                    user_id: user ? user.id : null,
                    method: requestState.method,
                    image_url: imageUrl
                };
                
                console.log('Submitting product request:', requestData);
                
                // Save to Supabase using the utility function
                const data = await saveProductRequest(requestData);
                console.log('Product request saved successfully:', data);
                
                // Success - redirect to home
                alert('Your product request has been submitted successfully!');
                window.location.href = 'index.html';
                
            } catch (error) {
                console.error('Error submitting request:', error);
                alert(`Error submitting request: ${error.message}`);
            }
        });
    }

    let stream = null;
    let recognition = null;
    let isListening = false;

    // Camera elements
    const cameraContainer = document.getElementById('camera-container');
    const cameraPreview = document.getElementById('camera-preview');
    const photoPreview = document.getElementById('photo-preview');
    const captureButton = document.getElementById('capture-photo');
    const cancelButton = document.getElementById('cancel-photo');
    const removePhotoBtn = document.getElementById('remove-photo');

    // Camera button
    const cameraButton = document.getElementById('camera-request');
    if (cameraButton) {
        cameraButton.addEventListener('click', async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'environment',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    } 
                });
                cameraPreview.srcObject = stream;
                cameraContainer.style.display = 'block';
            } catch (error) {
                console.error('Error accessing camera:', error);
                alert('Failed to access camera. Please ensure camera permissions are granted.');
            }
        });
    }

    // Modify the capture photo event listener
    if (captureButton) {
        captureButton.addEventListener('click', async () => {
            const canvas = document.createElement('canvas');
            const maxWidth = 1920;
            const maxHeight = 1080;
            let width = cameraPreview.videoWidth;
            let height = cameraPreview.videoHeight;

            // Calculate new dimensions while maintaining aspect ratio
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(cameraPreview, 0, 0, width, height);
            
            // Store photo and show preview
            const photoData = canvas.toDataURL('image/jpeg', 0.8);
            photoPreview.src = photoData;
            photoPreview.style.display = 'block';
            
            // Store in request state
            requestState.photo = photoData;
            requestState.method = 'photo';
            
            // Clean up camera
            stopCamera();

            // Show remove button
            if (removePhotoBtn) {
                removePhotoBtn.classList.remove('hidden');
            }

            // Add analyzing class to trigger animation
            photoPreview.classList.add('analyzing');

            // Show loading state immediately
            showLoadingState();

            try {
                // Analyze image with ChatGPT
                const result = await analyzeImageWithChatGPT(photoData);
                console.log('Analysis result:', result);
                
                // Show the analysis result
                showAnalysisResult(result);
            } catch (error) {
                console.error('Error during product detection:', error);
                showAnalysisResult({
                    productName: 'Unknown',
                    productType: 'Other',
                    description: `Error analyzing image: ${error.message}`,
                    scenario: 3
                });
            } finally {
                // Remove analyzing class after detection
                photoPreview.classList.remove('analyzing');
            }
        });
    }

    // Cancel photo
    if (cancelButton) {
        cancelButton.addEventListener('click', stopCamera);
    }

    // Remove photo
    if (removePhotoBtn && photoPreview) {
        removePhotoBtn.addEventListener('click', () => {
            photoPreview.style.display = 'none';
            removePhotoBtn.classList.add('hidden');
            requestState.photo = null;
        });
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        cameraContainer.style.display = 'none';
    }

    // Dictation elements
    const dictationContainer = document.getElementById('dictation-container');
    const dictationPulse = document.getElementById('dictation-pulse');
    const dictationText = document.getElementById('dictation-text');
    const startDictationBtn = document.getElementById('start-dictation');
    const stopDictationBtn = document.getElementById('stop-dictation');
    const cancelDictationBtn = document.getElementById('cancel-dictation');
    const reasonInput = document.getElementById('reason');

    // Initialize speech recognition
    function initializeSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in your browser.');
            return null;
        }
        
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            if (finalTranscript) {
                const currentText = reasonInput.value;
                reasonInput.value = currentText + (currentText ? ' ' : '') + finalTranscript;
            }
            
            dictationText.textContent = interimTranscript || 'Listening...';
        };
        
        recognition.onerror = (event) => {
            if (event.error === 'no-speech') {
                dictationText.textContent = 'No speech detected. Try again.';
            } else {
                console.error('Speech recognition error:', event.error);
                dictationText.textContent = 'Error occurred. Please try again.';
            }
            dictationPulse.classList.remove('listening');
            startDictationBtn.style.display = 'flex';
            stopDictationBtn.style.display = 'none';
        };
        
        recognition.onend = () => {
            isListening = false;
            dictationPulse.classList.remove('listening');
            if (dictationContainer.style.display === 'flex') {
                startDictationBtn.style.display = 'flex';
                stopDictationBtn.style.display = 'none';
                dictationText.textContent = 'Tap Start to begin speaking...';
            }
        };

        return recognition;
    }

    // Dictate button
    const dictateButton = document.getElementById('dictate-request');
    if (dictateButton) {
        dictateButton.addEventListener('click', () => {
            dictationContainer.style.display = 'flex';
            dictationText.textContent = 'Tap Start to begin speaking...';
            startDictationBtn.style.display = 'flex';
            stopDictationBtn.style.display = 'none';
            dictationPulse.classList.remove('listening');
            
            // Initialize recognition if not already done
            if (!recognition) {
                recognition = initializeSpeechRecognition();
            }
        });
    }

    // Start dictation
    if (startDictationBtn) {
        startDictationBtn.addEventListener('click', () => {
            if (!recognition) {
                recognition = initializeSpeechRecognition();
                if (!recognition) return;
            }
            
            recognition.start();
            isListening = true;
            dictationPulse.classList.add('listening');
            startDictationBtn.style.display = 'none';
            stopDictationBtn.style.display = 'flex';
            dictationText.textContent = 'Listening...';
        });
    }

    // Stop dictation
    if (stopDictationBtn) {
        stopDictationBtn.addEventListener('click', () => {
            if (recognition && isListening) {
                recognition.stop();
                isListening = false;
                dictationPulse.classList.remove('listening');
                dictationContainer.style.display = 'none';
            }
        });
    }

    // Cancel dictation
    if (cancelDictationBtn) {
        cancelDictationBtn.addEventListener('click', () => {
            if (recognition && isListening) {
                recognition.abort();
                isListening = false;
            }
            dictationContainer.style.display = 'none';
        });
    }

    // Function to analyze image with ChatGPT
    async function analyzeImageWithChatGPT(imageData) {
        try {
            console.log('Starting image analysis with ChatGPT...');
            
            // Convert base64 to blob
            console.log('Converting image to blob...');
            const base64Data = imageData.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteArrays = [];
            
            for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
                const slice = byteCharacters.slice(offset, offset + 1024);
                const byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }
            
            const blob = new Blob(byteArrays, { type: 'image/jpeg' });
            console.log('Blob created successfully, size:', blob.size, 'bytes');

            // Prepare API request
            console.log('Preparing API request...');
            const requestBody = {
                // IMPORTANT: Do not change the model name - this specific version is required
                model: "gpt-4.1-nano-2025-04-14",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Please analyze this image and provide your response in the following format exactly:\n\n" +
                                "productName: [exact product name if identifiable, or 'Unknown']\n" +
                                "productType: [one of: 'Medical Nitrile Exam Gloves', 'General Gloves', 'Other']\n" +
                                "description: [based on the following rules:\n" +
                                "1. If you see a product box/packaging: List only specifications in comma-separated format (e.g., 'size M, 100 pairs, latex-free, powder-free')\n" +
                                "2. If you see only gloves without packaging: List visible characteristics in comma-separated format (e.g., 'blue color, medium size, nitrile material')\n" +
                                "3. If no medical products visible: 'No medical products visible, please retake photo or select manually']\n\n" +
                                "Please maintain this exact format and be concise with no narrative text."
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: imageData
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 150
            };

            console.log('Making API request to OpenAI...');
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.openaiApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Response received:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API Response data:', data);

            const analysis = data.choices[0].message.content;
            console.log('Analysis content:', analysis);

            // Parse the structured response
            let productName = 'Unknown';
            let productType = 'Other';
            let description = 'No description available';
            let scenario = 3; // Default to unknown/error scenario

            try {
                // First try to parse as JSON
                const parsedContent = JSON.parse(analysis);
                productName = parsedContent.productName || 'Unknown';
                productType = parsedContent.productType || 'Other';
                description = parsedContent.description || 'No description available';
            } catch (parseError) {
                // If JSON parsing fails, try to extract using regex
                console.log('JSON parsing failed, using regex extraction');
                
                const productNameMatch = analysis.match(/productName:\s*(.+?)(?:\n|$)/);
                const productTypeMatch = analysis.match(/productType:\s*(.+?)(?:\n|$)/);
                const descriptionMatch = analysis.match(/description:\s*(.+?)(?:\n|$)/);
                
                if (productNameMatch) productName = productNameMatch[1].trim();
                if (productTypeMatch) productType = productTypeMatch[1].trim();
                if (descriptionMatch) description = descriptionMatch[1].trim();
            }
            
            // Determine the scenario based on the product type
            // Prioritize the productType field first
            if (productType.includes('Medical Nitrile Exam Gloves')) {
                scenario = 1; // Synguard Nitrile Exam Gloves
            } else if (productType.includes('General Gloves')) {
                scenario = 2; // General Gloves
            } else {
                // Fall back to name and description only if productType didn't match
                if ((productName.includes('Synguard') && productName.toLowerCase().includes('nitrile')) || 
                    (productName.toLowerCase().includes('nitrile') && productName.toLowerCase().includes('exam'))) {
                    scenario = 1; // Synguard Nitrile Exam Gloves
                } else if (productName.toLowerCase().includes('gloves') || 
                          description.toLowerCase().includes('gloves')) {
                    scenario = 2; // General Gloves
                } else {
                    scenario = 3; // Other/Unknown
                }
            }
            
            // Store the product in request state
            const productToSelect = {
                name: productName,
                type: productType,
                description: description
            };
            requestState.selectedProduct = productToSelect;
            
            return {
                productName,
                productType,
                description,
                scenario
            };

        } catch (error) {
            console.error('Error in analyzeImageWithChatGPT:', error);
            
            // Show error in UI
            const aiDetectionNotice = document.getElementById('ai-detection-notice');
            if (aiDetectionNotice) {
                aiDetectionNotice.innerHTML = `
                    <div class="bg-red-50 rounded-md p-3 mt-2">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-red-800">Error Analyzing Image</h3>
                                <div class="mt-2 text-sm text-red-700">
                                    <p>${error.message}</p>
                                    <p class="mt-1">Please select a product manually.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            return {
                productName: 'Unknown',
                productType: 'Other',
                description: `Error analyzing image: ${error.message}`,
                scenario: 3
            };
        }
    }

    // Function to show analysis result
    function showAnalysisResult({ productName, productType, description, scenario }) {
        const aiDetectionNotice = document.getElementById('ai-detection-notice');
        let content = '';

        // Helper function to find product by type
        const findProductByType = (type) => {
            if (!productData || !productData.categories) {
                console.warn('Product data not available');
                return null;
            }
            console.log('Searching for product type:', type);
            for (const category of productData.categories) {
                for (const item of category.items) {
                    // Try exact match first
                    if (item.name === type) {
                        console.log('Found exact match:', item.name);
                        return item;
                    }
                    // Then try case-insensitive match
                    if (item.name.toLowerCase() === type.toLowerCase()) {
                        console.log('Found case-insensitive match:', item.name);
                        return item;
                    }
                    // Finally try includes
                    if (item.name.toLowerCase().includes(type.toLowerCase())) {
                        console.log('Found partial match:', item.name);
                        return item;
                    }
                }
            }
            console.warn('No product found for type:', type);
            return null;
        };

        switch (scenario) {
            case 1: // Synguard Medical Nitrile Exam Gloves
                content = `
                    <div class="bg-green-50 rounded-md p-3 mt-2">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-green-800">Synguard Medical Nitrile Exam Gloves Detected</h3>
                                <div class="mt-2 text-sm text-green-700">
                                    ${productName !== 'Unknown' ? `<p><strong>Product:</strong> ${productName}</p>` : ''}
                                    <p>${description}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                // Find and select the Synguard Nitrile Exam Gloves product
                console.log('Selecting Synguard product');
                const synguardGloves = findProductByType('Synguard Nitrile Exam Gloves');
                if (synguardGloves) {
                    selectProduct(synguardGloves);
                }
                break;

            case 2: // General Gloves
                content = `
                    <div class="bg-blue-50 rounded-md p-3 mt-2">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-blue-800">Medical Gloves Detected</h3>
                                <div class="mt-2 text-sm text-blue-700">
                                    ${productName !== 'Unknown' ? `<p><strong>Product:</strong> ${productName}</p>` : ''}
                                    <p>${description}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                // Find and select a generic glove product
                console.log('Selecting generic gloves');
                const genericGloves = findProductByType('Gloves - Size M');
                if (genericGloves) {
                    selectProduct(genericGloves);
                }
                break;

            case 3: // Other/Undefined
                content = `
                    <div class="bg-gray-50 rounded-md p-3 mt-2">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="ml-3 text-sm text-gray-700">
                                ${description}
                            </div>
                        </div>
                    </div>
                `;
                break;
        }

        aiDetectionNotice.innerHTML = content;
        aiDetectionNotice.classList.remove('hidden');

        // Add animation to the product selector if a product was selected
        if (scenario === 1 || scenario === 2) {
            const productButton = document.getElementById('product-selector-button');
            if (productButton) {
                productButton.classList.add('selected');
                productButton.style.animation = 'pulse 2s';
                setTimeout(() => productButton.style.animation = '', 2000);
            }
        }
    }

    // Function to compress image
    function compressImage(imageData, maxWidth = 1024, maxHeight = 1024, quality = 0.8) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to JPEG with compression
                const compressedData = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedData);
            };
            img.src = imageData;
        });
    }

    // Function to upload image to Supabase Storage
    async function uploadProductImage(imageData) {
        try {
            // Log the start of the process
            console.log('Starting image upload process...');
            
            // Validate image data format
            if (!imageData) {
                throw new Error('No image data provided');
            }
            
            console.log('Image data type:', typeof imageData);
            console.log('Image data length:', imageData.length);
            console.log('Image data starts with:', imageData.substring(0, 50) + '...');
            
            // Ensure proper data URL format
            if (!imageData.startsWith('data:image')) {
                console.log('Image data does not start with data:image prefix, adding it');
                imageData = 'data:image/jpeg;base64,' + imageData.replace(/^data:image\/jpeg;base64,/, '');
            }

            // Compress image before upload
            console.log('Compressing image...');
            const compressedImage = await compressImage(imageData);
            console.log('Image compressed successfully');

            // Convert base64 to blob
            console.log('Converting to blob...');
            const base64Data = compressedImage.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteArrays = [];
            
            for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
                const slice = byteCharacters.slice(offset, offset + 1024);
                const byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }
            
            const blob = new Blob(byteArrays, { type: 'image/jpeg' });
            console.log('Blob created, size:', Math.round(blob.size / 1024), 'KB');

            // Check authentication
            console.log('Checking authentication...');
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError) {
                console.error('Authentication error:', {
                    message: authError.message,
                    status: authError.status,
                    details: authError
                });
                throw new Error(`Authentication failed: ${authError.message}`);
            }
            if (!user) {
                console.error('No authenticated user found');
                await signInUser(); // Try to sign in now
                const { data: { user: retryUser } } = await supabase.auth.getUser();
                if (!retryUser) {
                    throw new Error('Still no authenticated user after retry');
                }
                console.log('Authentication successful after retry, user:', retryUser.id);
            } else {
                console.log('Authentication successful, user:', user.id);
            }

            // Using exact same approach as in add-feedback.html
            const bucketName = 'feedback-images';
            const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            console.log('Generated filename:', fileName);
            console.log('Full upload path:', `public/${fileName}`);
            console.log('Bucket name:', bucketName);

            // Attempt upload
            console.log('Starting file upload to bucket:', bucketName);
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(`public/${fileName}`, blob, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: 'image/jpeg'
                });

            if (uploadError) {
                console.error('Upload error details:', {
                    message: uploadError.message,
                    status: uploadError.status,
                    statusText: uploadError.statusText,
                    details: uploadError.details,
                    name: uploadError.name,
                    code: uploadError.code,
                    hint: uploadError.hint
                });
                throw uploadError;
            }

            console.log('File uploaded successfully. Upload data:', uploadData);

            // Get public URL - exact structure from add-feedback.html
            console.log('Getting public URL...');
            const { data: urlData, error: urlError } = supabase.storage
                .from(bucketName)
                .getPublicUrl(`public/${fileName}`);

            if (urlError) {
                console.error('URL generation error:', {
                    message: urlError.message,
                    status: urlError.status,
                    details: urlError
                });
                throw urlError;
            }

            const publicUrl = urlData.publicUrl;
            console.log('Public URL generated:', publicUrl);
            return publicUrl;

        } catch (error) {
            console.error('Detailed upload error:', {
                message: error.message,
                name: error.name,
                code: error.code,
                status: error.status,
                statusText: error.statusText,
                details: error.details,
                hint: error.hint,
                stack: error.stack
            });
            
            alert(`Image upload failed: ${error.message}\nPlease check browser console for details.`);
            return null;
        }
    }

    // Function to test storage bucket access
    async function testBucketAccess() {
        try {
            console.log('Testing bucket access...');
            const { data, error } = await supabase.storage.getBucket('feedback-images');
            
            if (error) {
                console.error('Bucket access error:', error);
                return false;
            }
            
            console.log('Bucket access successful:', data);
            return true;
        } catch (error) {
            console.error('Exception testing bucket access:', error);
            return false;
        }
    }

    // Function to test uploading a simple image
    async function testImageUpload() {
        try {
            // Create a small test image using canvas
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            
            // Log the image data
            console.log('Test image created');
            
            // Convert base64 to blob
            const base64Data = imageData.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });
            
            // Check authentication
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('No authenticated user for test upload');
                return null;
            }
            
            // Attempt upload
            const bucketName = 'feedback-images';
            const fileName = `test-${Date.now()}.jpg`;
            console.log('Testing upload to:', bucketName, 'path:', `public/${fileName}`);
            
            const { data, error } = await supabase.storage
                .from(bucketName)
                .upload(`public/${fileName}`, blob, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: 'image/jpeg'
                });
            
            if (error) {
                console.error('Test upload error:', error);
                return null;
            }
            
            console.log('Test upload successful:', data);
            
            // Get public URL
            const { data: urlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(`public/${fileName}`);
            
            console.log('Test URL:', urlData.publicUrl);
            return urlData.publicUrl;
        } catch (error) {
            console.error('Exception in test upload:', error);
            return null;
        }
    }

    // Add test button to the page for debugging
    if (form) {
        const testButton = document.createElement('button');
        testButton.type = 'button';
        testButton.textContent = 'Test Image Upload';
        testButton.className = 'mt-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded';
        testButton.onclick = async () => {
            // Test authentication
            await signInUser();
            
            // Test bucket access
            const bucketAccess = await testBucketAccess();
            console.log('Bucket access test result:', bucketAccess);
            
            // Test image upload
            const testUrl = await testImageUpload();
            console.log('Test upload result:', testUrl);
            
            alert(`Test completed. Check console for results.\nUpload URL: ${testUrl || 'Failed'}`);
        };
        
        // Add before the submit button
        if (submitButton && submitButton.parentNode) {
            submitButton.parentNode.insertBefore(testButton, submitButton);
        }
    }
});

// No need to export saveProductRequest function here since we're importing it from db-utils.js 