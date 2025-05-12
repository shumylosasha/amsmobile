import { initNotifications } from './notifications.js';
import { processOfflineQueue, testFeedbackConnection, getFeedback } from './db-utils.js';

// Add this function after the existing functions but before the DOMContentLoaded event
async function displaySupabaseFeedback() {
    try {
        const feedbackContainer = document.querySelector('#feedback-content .space-y-4');
        if (!feedbackContainer) {
            console.error('Feedback container not found');
            return;
        }

        const response = await fetch('/api/feedback');
        if (!response.ok) {
            throw new Error('Failed to fetch feedback');
        }
        const feedback = await response.json();

        // Create HTML for each feedback item
        const feedbackHTML = feedback.map(feedback => `
            <div class="card p-4">
                <!-- Product Info Row -->
                <div class="flex items-center space-x-4">
                    <div class="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img src="${feedback.method === 'photo' ? feedback.photo_url || 'https://via.placeholder.com/150' : 'https://via.placeholder.com/150'}" 
                             alt="${feedback.product || 'Product'}" 
                             class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="text-lg font-medium text-gray-900">${feedback.product}</h3>
                                <p class="text-gray-500">${new Date(feedback.timestamp).toLocaleDateString()}</p>
                            </div>
                            ${feedback.is_critical ? `
                                <span class="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">
                                    Critical
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <div class="h-px bg-gray-200 my-4"></div>

                <!-- Feedback Row -->
                <div>
                    <div class="flex items-center mb-2">
                        <div class="flex">
                            ${Array(5).fill().map((_, i) => `
                                <svg class="w-5 h-5 ${i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}" 
                                     fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                            `).join('')}
                        </div>
                    </div>
                    <p class="text-gray-700">${feedback.text}</p>
                </div>
            </div>
        `).join('');

        // Insert the feedback cards at the beginning of the container
        feedbackContainer.insertAdjacentHTML('afterbegin', feedbackHTML);

    } catch (error) {
        console.error('Error displaying feedback:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded - Initializing scripts...');

    // Test Supabase connection when page loads
    console.log('Page loaded, testing Supabase connection...');
    const result = await testFeedbackConnection();
    
    if (result.error) {
        console.error('Failed to connect to Supabase:', result.error);
    } else {
        console.log('Successfully connected to Supabase');
        // Display feedback from Supabase
        await displaySupabaseFeedback();
    }

    // Add event listeners for Request Product buttons
    document.querySelectorAll('button').forEach(button => {
        if (button.textContent.includes('Request Product')) {
            button.addEventListener('click', () => {
                window.location.href = 'request-product.html';
            });
        }
    });

    // FAB and Modal Elements
    const fabButton = document.getElementById('fab-button');
    console.log('FAB Button Element:', fabButton); // Debug log
    
    // Verify button is properly configured
    if (fabButton) {
        console.log('FAB Button found with classes:', fabButton.className);
        console.log('FAB Button is visible:', window.getComputedStyle(fabButton).display !== 'none');
        console.log('FAB Button position:', window.getComputedStyle(fabButton).position);
        console.log('FAB Button z-index:', window.getComputedStyle(fabButton).zIndex);
    }

    const fabModal = document.getElementById('fab-modal');
    const closeModal = document.getElementById('close-modal');
    const modalButtons = fabModal.querySelectorAll('button:not(#close-modal)');

    // Function to close the modal smoothly
    const closeFabModal = () => {
        if (!fabModal) return;
        const modalContent = fabModal.querySelector('.bg-white');
        if (modalContent) {
            modalContent.classList.remove('translate-y-0');
            // Listen for the transition to end before hiding
            modalContent.addEventListener('transitionend', () => {
                fabModal.classList.add('hidden');
            }, { once: true }); // Remove listener after firing once
        } else {
            // Fallback if content not found, just hide modal
            fabModal.classList.add('hidden');
        }
    };

    // Check if fabButton exists before adding listener
    if (fabButton) {
        console.log('Adding click listener to FAB button');
        fabButton.addEventListener('click', () => {
            // alert('FAB button clicked!'); // Removed test alert
            console.log('FAB Button clicked - testing event handler');
            
            // Visual feedback - Removed
            // fabButton.style.backgroundColor = 'red';
            // setTimeout(() => {
            //     fabButton.style.backgroundColor = '';
            // }, 500);
            
            if (fabModal) {
                console.log('Attempting to show modal...');
                const modalContent = fabModal.querySelector('.bg-white');
                if (modalContent) {
                    fabModal.classList.remove('hidden');
                    fabModal.offsetHeight; // Force reflow
                    modalContent.classList.add('translate-y-0');
                } else {
                    console.error('Modal content (.bg-white) not found');
                }
            } else {
                console.error('FAB Modal element not found');
            }
        });
    } else {
        console.error('FAB Button (#fab-button) not found in DOM');
    }

    // Check if closeModal exists before adding listener
    if (closeModal) {
        closeModal.addEventListener('click', closeFabModal);
    } else {
        console.error('Close modal button (#close-modal) not found!');
    }

    // Check if fabModal exists before adding listener for internal buttons and outside click
    if (fabModal) {
        // Actions for buttons/links inside the modal
        const modalActions = fabModal.querySelectorAll('button:not(#close-modal), a'); // Include links too
        modalActions.forEach(actionElement => {
            actionElement.addEventListener('click', (event) => {
                let actionText = '';
                if (actionElement.tagName === 'A') {
                     actionText = actionElement.querySelector('span')?.textContent.trim();
                     console.log(`Modal Link Clicked: ${actionText} (href: ${actionElement.getAttribute('href')})`);
                     // Let the browser handle navigation for links
                     // We still close the modal after a short delay to allow navigation start
                     setTimeout(closeFabModal, 100); 
                } else { // It's a button
                     actionText = actionElement.textContent.trim();
                     console.log(`Modal Button Clicked: ${actionText}`);
                     event.preventDefault(); // Prevent default button action
                     if (actionText === 'Add Feedback') {
                         window.location.href = 'add-feedback.html';
                     }
                     // Close the modal immediately for button clicks
                     closeFabModal();
                }
            });
        });

        // Close modal when clicking the background overlay
        fabModal.addEventListener('click', (e) => {
            if (e.target === fabModal) {
                console.log('Clicked outside modal content.');
                closeFabModal();
            }
        });
    } else {
        console.error('FAB Modal element (#fab-modal) not found for internal/outside click listeners!');
    }

    // Camera Elements
    const cameraButton = document.getElementById('camera-button');
    const cameraOverlay = document.getElementById('camera-overlay');
    const videoElement = document.getElementById('camera-view');
    const captureButton = document.getElementById('capture-photo');
    const cancelButton = document.getElementById('cancel-photo');
    const photoReviewContainer = document.getElementById('photo-review-container');
    const capturedPhotoPreview = document.getElementById('captured-photo-preview');
    const cameraControls = document.getElementById('camera-controls');

    let stream = null;
    let currentFacingMode = 'environment';
    let capturedImage = null;

    // Function to stop the camera stream
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        if (videoElement) {
            videoElement.srcObject = null;
        }
        if (cameraOverlay) {
            cameraOverlay.classList.add('hidden');
        }
    };

    // Function to start the camera
    const startCamera = async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: currentFacingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            
            if (videoElement) {
                videoElement.srcObject = stream;
                videoElement.play().catch(e => console.error("Video play failed:", e));
            }
            
            if (cameraOverlay) {
                cameraOverlay.classList.remove('hidden');
                if (photoReviewContainer) {
                    photoReviewContainer.classList.add('hidden');
                }
                if (cameraControls) {
                    cameraControls.classList.remove('hidden');
                }
                if (videoElement) {
                    videoElement.classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Error accessing camera: ' + error.message);
        }
    };

    // Function to capture photo
    const capturePhoto = () => {
        if (!videoElement || !stream) {
            console.error("Video element or stream not available for capture");
            return;
        }
        
        console.log("Capturing photo...");
        
        // Create a canvas to capture the video frame
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        
        // Draw the current video frame to the canvas
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL (base64)
        capturedImage = canvas.toDataURL('image/jpeg', 0.8); // Add quality parameter for compression
        
        // Show the captured image for review
        if (capturedPhotoPreview) {
            capturedPhotoPreview.src = capturedImage;
            console.log("Setting preview image source");
        } else {
            console.error("Photo preview element not found");
        }
        
        // Update UI to show review options
        showPhotoReview();
        console.log("Photo captured successfully");
    };

    // Function to show photo review UI
    const showPhotoReview = () => {
        if (!photoReviewContainer || !cameraOverlay) {
            console.error("Photo review container or camera overlay not found");
            return;
        }
        
        console.log("Showing photo review UI");
        
        // Hide video preview
        if (videoElement) {
            videoElement.classList.add('hidden');
            console.log("Video element hidden");
        }
        
        // Hide camera controls
        if (cameraControls) {
            cameraControls.classList.add('hidden');
            console.log("Camera controls hidden");
        }
        
        // Show photo review container
        photoReviewContainer.classList.remove('hidden');
        console.log("Photo review container shown");
        
        // Setup the action buttons
        const addFeedbackBtn = document.getElementById('add-feedback-photo-btn');
        if (addFeedbackBtn) {
            // Update the href to include the image
            addFeedbackBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Store the image in localStorage
                console.log("Saving image to localStorage");
                localStorage.setItem('capturedImage', capturedImage);
                window.location.href = 'add-feedback.html?photoSource=localStorage';
            });
        }
        
        // Setup the request product button
        const requestProductBtn = document.getElementById('request-product-photo-btn');
        if (requestProductBtn) {
            requestProductBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Store the image in localStorage
                console.log("Saving image to localStorage");
                localStorage.setItem('capturedImage', capturedImage);
                window.location.href = 'request-product.html?photoSource=localStorage';
            });
        }
    };

    // Function to retake photo
    const retakePhoto = () => {
        console.log("Retake photo called");
        
        // Hide the photo review container
        if (photoReviewContainer) {
            photoReviewContainer.classList.add('hidden');
            console.log("Photo review container hidden");
        }
        
        // Show the video and camera controls again
        if (videoElement) {
            videoElement.classList.remove('hidden');
            console.log("Video element shown");
        }
        
        if (cameraControls) {
            cameraControls.classList.remove('hidden');
            console.log("Camera controls shown");
        }
        
        // Clear the captured image
        capturedImage = null;
        console.log("Captured image cleared");
    };

    // Check if camera button exists before adding listener
    if (cameraButton) {
        cameraButton.addEventListener('click', startCamera);
        console.log("Camera button listener added");
    }

    // Check if capture button exists before adding listener
    if (captureButton) {
        captureButton.addEventListener('click', capturePhoto);
        console.log("Capture button listener added");
    }

    // Check if cancel button exists before adding listener
    if (cancelButton) {
        cancelButton.addEventListener('click', stopCamera);
        console.log("Cancel button listener added");
    }
    
    // Add listener for retake button
    const retakeButton = document.getElementById('retake-photo');
    if (retakeButton) {
        retakeButton.addEventListener('click', retakePhoto);
        console.log("Retake button listener added");
    }
    
    // Add listener for cancel review button
    const cancelReviewButton = document.getElementById('cancel-review');
    if (cancelReviewButton) {
        cancelReviewButton.addEventListener('click', stopCamera);
        console.log("Cancel review button listener added");
    }

    // Dictation elements
    const dictateButton = document.getElementById('dictate-button');
    const dictateOverlay = document.getElementById('dictate-overlay');
    const stopDictationButton = document.getElementById('stop-dictation');
    const speechIndicator = document.getElementById('speech-indicator'); // Updated ID
    const dictationStatus = document.getElementById('dictation-status'); // Updated ID
    const interimTranscriptDisplay = document.getElementById('interim-transcript'); // Updated ID
    // --- NEW: Select additional dictation elements ---
    const startDictationButton = document.getElementById('start-dictation');
    const cancelDictationButton = document.getElementById('cancel-dictation');
    const dictationActions = document.getElementById('dictation-actions');
    const createFeedbackLink = document.getElementById('create-feedback-link');
    // --- END NEW ---

    // Product Request Elements
    const requestCardsContainer = document.getElementById('request-cards-container');
    const noRequestsMessage = document.getElementById('no-requests-message');

    // Tab Elements (NEW)
    const requestProductTab = document.getElementById('request-product-tab');
    const myFeedbackTab = document.getElementById('my-feedback-tab');
    const requestProductContent = document.getElementById('request-product-content');
    const myFeedbackContent = document.getElementById('my-feedback-content');

    // New Bottom Nav Elements
    const bottomNavRequests = document.getElementById('nav-requests');
    const bottomNavFeedback = document.getElementById('nav-feedback');
    const bottomNavMenu = document.getElementById('nav-menu');
    const aiFabButton = document.getElementById('ai-fab'); // Added FAB reference

    // Add Placeholder content divs if needed for Chat/Menu
    const chatContentPlaceholder = document.getElementById('chat-content-placeholder'); // Assuming these might be added
    const menuContentPlaceholder = document.getElementById('menu-content-placeholder');

    // Pull-to-refresh elements and state (NEW)
    const scrollableContent = document.getElementById('scrollable-content');
    const refreshIndicator = document.getElementById('refresh-indicator');
    let isRefreshing = false;
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    const PULL_THRESHOLD = 70; // Pixels to pull down to trigger refresh

    // State Variables
    let recognition = null; // Variable for Speech Recognition
    let lastFinalTranscript = ''; // Store the last complete transcript
    // let selectedProductInfo = { name: '', description: '', imgSrc: '', brand: '' }; // Removed chat-related state

    // Feedback state
    let feedbackState = {
        message: '',
        photo: null,
        detectedItem: '',
        suggestedSummary: '',
        rating: 0,
        tags: ['Needs Attention'],
        is_critical: false
    };

    // --- Helper Functions --- (Camera, Dictation, Requests Display, Tabs) --- 

    // --- Speech Recognition Setup ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true; // Keep listening even after pauses
        recognition.interimResults = true; // Get results while speaking
        recognition.lang = 'en-US'; // Set language

        recognition.onstart = () => {
            console.log('Speech recognition started');
            if (dictationStatus) dictationStatus.textContent = 'Listening...';
            if (speechIndicator) speechIndicator.classList.add('circle-animating');
            // --- NEW: Update button visibility on start ---
            if (startDictationButton) startDictationButton.classList.add('hidden');
            if (cancelDictationButton) cancelDictationButton.classList.add('hidden');
            if (stopDictationButton) stopDictationButton.classList.remove('hidden');
            // --- MODIFIED: Show actions if we have previous transcript ---
            if (dictationActions && lastFinalTranscript.trim()) {
                dictationActions.classList.remove('hidden');
                dictationActions.style.zIndex = '9999'; // Ensure it's above overlay
                dictationActions.querySelectorAll('a').forEach(link => {
                    link.classList.remove('opacity-50', 'pointer-events-none');
                    link.removeAttribute('aria-disabled');
                });
            }
            // --- END MODIFIED ---
        };

        recognition.onaudiostart = () => {
            console.log('Audio capturing started');
            // Animation now handled by .circle-animating class in CSS via onstart/onerror/onend
            if (dictationStatus) dictationStatus.textContent = 'Listening...'; // Keep as Listening or remove status update here
        };

        recognition.onaudioend = () => {
             console.log('Audio capturing ended');
             // Removed status change to "Processing..."
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let currentFinalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    // --- MODIFIED: Append final results --- 
                    const newFinalPart = event.results[i][0].transcript;
                    lastFinalTranscript += (lastFinalTranscript ? ' ' : '') + newFinalPart; // Add space only if not empty
                    currentFinalTranscript += newFinalPart + ' ';
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // Log the cumulative final transcript as it builds
            if (currentFinalTranscript.trim()) {
                console.log("Cumulative Final Transcript: ", lastFinalTranscript.trim());
            }

            // Update the display text in real-time
            if (interimTranscriptDisplay) {
                // --- MODIFIED: Show both final and interim ---
                const displayText = lastFinalTranscript + (interimTranscript ? ' ' + interimTranscript : '');
                interimTranscriptDisplay.textContent = displayText;
            }
            
            // --- MODIFIED: Enable actions if we have transcript ---
            if (dictationActions && lastFinalTranscript.trim()) {
                dictationActions.classList.remove('hidden');
                dictationActions.style.zIndex = '9999'; // Ensure it's above overlay
                dictationActions.querySelectorAll('a').forEach(link => {
                    link.classList.remove('opacity-50', 'pointer-events-none');
                    link.removeAttribute('aria-disabled');
                    link.dataset.transcript = lastFinalTranscript.trim();
                });
            }

            if (dictationStatus) {
                dictationStatus.textContent = interimTranscript ? 'Speaking...' : 'Listening...';
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (dictationStatus) dictationStatus.textContent = `Error: ${event.error}`; 
            if (speechIndicator) speechIndicator.classList.remove('circle-animating');
            // --- NEW: Reset buttons on error ---
            if (startDictationButton) startDictationButton.classList.remove('hidden');
            if (cancelDictationButton) cancelDictationButton.classList.remove('hidden');
            if (stopDictationButton) stopDictationButton.classList.add('hidden');
            // --- MODIFIED: Ensure action links are reset on cancel --- 
            if (dictationActions) {
                 dictationActions.querySelectorAll('a').forEach(link => {
                     link.classList.add('opacity-50', 'pointer-events-none');
                     link.setAttribute('aria-disabled', 'true');
                     delete link.dataset.transcript;
                 });
            }
            // --- END NEW ---
        };

        recognition.onend = () => {
            console.log('Speech recognition service disconnected');
            if (speechIndicator) speechIndicator.classList.remove('circle-animating');

            // --- MODIFIED: Handle showing actions or resetting on end ---
            if (lastFinalTranscript.trim()) {
                console.log("Recognition ended with transcript:", lastFinalTranscript);
                if (dictationStatus) dictationStatus.textContent = 'Dictation complete:';
                if (interimTranscriptDisplay) interimTranscriptDisplay.textContent = lastFinalTranscript.trim();
                if (speechIndicator) speechIndicator.classList.add('hidden');
                if (stopDictationButton) stopDictationButton.classList.add('hidden');
                if (startDictationButton) startDictationButton.classList.remove('hidden');
                
                // --- MODIFIED: Enable and show action buttons ---
                if (dictationActions) {
                    console.log('Enabling dictation action buttons.');
                    dictationActions.classList.remove('hidden');
                    dictationActions.style.zIndex = '9999'; // Ensure it's above overlay
                    dictationActions.querySelectorAll('a').forEach(link => {
                        link.classList.remove('opacity-50', 'pointer-events-none');
                        link.removeAttribute('aria-disabled');
                        link.dataset.transcript = lastFinalTranscript.trim();
                    });
                }
            } else {
                if (dictationStatus) dictationStatus.textContent = 'Tap Start to Dictate';
                if (interimTranscriptDisplay) interimTranscriptDisplay.textContent = '';
                if (startDictationButton) startDictationButton.classList.remove('hidden');
                if (cancelDictationButton) cancelDictationButton.classList.remove('hidden');
                if (stopDictationButton) stopDictationButton.classList.add('hidden');
                if (dictationActions) dictationActions.classList.add('hidden');
                if (speechIndicator) speechIndicator.classList.remove('hidden');
            }
        };

    } else {
        console.warn('Speech Recognition API not supported in this browser.');
        // Disable the dictate button or show a message
        if(dictateButton) dictateButton.disabled = true;
        if(dictationStatus) dictationStatus.textContent = 'Not supported';
    }
    // --- End Speech Recognition Setup ---

    // Function to show the dictation overlay
    const showDictation = () => {
        stopCamera(); // Close camera if open
        lastFinalTranscript = ''; // Reset transcript
        if (interimTranscriptDisplay) interimTranscriptDisplay.textContent = ''; // Clear interim display
        console.log('Showing dictation overlay...');
        if (dictateOverlay) {
            dictateOverlay.classList.remove('hidden');
            // --- MODIFIED: Set initial state, don't start recognition automatically ---
            if (dictationStatus) dictationStatus.textContent = 'Tap Start to Dictate';
            if (speechIndicator) {
                speechIndicator.classList.remove('hidden', 'circle-animating');
            }
            if (startDictationButton) startDictationButton.classList.remove('hidden');
            if (cancelDictationButton) cancelDictationButton.classList.remove('hidden');
            if (stopDictationButton) stopDictationButton.classList.add('hidden');
            // --- MODIFIED: Keep actions hidden initially ---
            if (dictationActions) {
                dictationActions.classList.add('hidden');
                dictationActions.querySelectorAll('a').forEach(link => {
                    link.classList.add('opacity-50', 'pointer-events-none'); 
                    link.setAttribute('aria-disabled', 'true');
                });
            }
            // --- END MODIFIED ---
            
            if (!SpeechRecognition) {
                if (dictationStatus) dictationStatus.textContent = 'Speech recognition not supported.';
                if (startDictationButton) startDictationButton.disabled = true;
                if (cancelDictationButton) cancelDictationButton.disabled = true;
            }
        }
    };

    // Function to hide the dictation overlay
    const hideDictation = (stopRecognition = true) => { // Added parameter
        console.log('Hiding dictation overlay...');
        if (stopRecognition && recognition) { // Only stop if requested and exists
            try {
                console.log('Stopping recognition...');
                recognition.stop();
            } catch(e) {
                 console.error("Recognition stop failed: ", e);
            }
        }
        if (dictateOverlay) {
            dictateOverlay.classList.add('hidden');
        }
        // --- NEW: Clear transcript when hiding completely ---
        lastFinalTranscript = '';
        if (interimTranscriptDisplay) interimTranscriptDisplay.textContent = '';
         // --- END NEW ---
          // --- NEW: Reset action button state on hide --- 
          if (dictationActions) {
              dictationActions.classList.add('hidden');
              dictationActions.querySelectorAll('a').forEach(link => {
                  link.classList.add('opacity-50', 'pointer-events-none');
                  link.setAttribute('aria-disabled', 'true');
                  delete link.dataset.transcript;
              });
          }
          // --- END NEW ---
    };

    // --- Toast Notification --- (Keep as it's generally useful)
    const showToast = (message) => {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    };

    // --- Product Request Card Display & Handling ---
    // Function to create HTML for a single request card
    const createRequestCardHTML = (request, index) => {
        // Example data - replace with actual data if available
        const quantity = request.quantity || 5;
        const urgency = request.urgency || 'High';
        const cardImage = `<img src="${request.imgSrc || 'https://instytutmkm.pl/wp-content/uploads/2019/01/medical_shop_5.jpg'}" alt="${request.name || 'Requested product'}" class="w-12 h-12 rounded border border-gray-200 object-cover flex-shrink-0">`; 
        const status = request.status || 'Unknown';
        let statusClasses = 'bg-gray-100 text-gray-700';
        if (status === 'Pending') {
            statusClasses = 'bg-yellow-100 text-yellow-700';
        } else if (status === 'Delivered') {
            statusClasses = 'bg-green-100 text-green-700';
        } else if (status === 'Waiting for approval') {
            statusClasses = 'bg-blue-100 text-blue-700';
        }
        const timeLeft = request.timeLeft || '45 min left';

        return `
        <div class="swipe-container bg-white rounded-lg shadow overflow-hidden mb-3" data-index="${index}">
            <div class="delete-action">
                <button class="delete-button p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                </button>
            </div>
            <div class="request-card-content p-4 space-y-3">
                <!-- Top Row: Image and Status -->
                <div class="flex justify-between items-start">
                    ${cardImage}
                    <span class="${statusClasses} text-xs font-medium px-3 py-1 rounded-full">${status}</span>
                </div>
                <!-- Middle Row: Item Name and Requester -->
                <div>
                    <h3 class="font-semibold text-section-title text-lg">${request.name}</h3>
                    <p class="text-sm text-gray-500 mt-1">Requested by ${request.requester || 'Unknown'} - ${request.department || 'Unknown Department'}</p>
                </div>
                <!-- Bottom Row: Details -->
                <div class="space-y-1 text-sm pt-2">
                    <div class="flex justify-between">
                        <span class="text-gray-500">Quantity:</span>
                        <span class="font-medium text-gray-800">${quantity}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Urgency Level:</span>
                        <span class="font-medium text-gray-800">${urgency}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Time Left:</span>
                        <span class="font-medium text-gray-800">${timeLeft}</span>
                    </div>
                    ${request.notes ? `
                    <div class="mt-2 pt-2 border-t border-gray-100">
                        <p class="text-xs text-gray-600">${request.notes}</p>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
        `;
    };

    // Function to add a new request and update display
    const addRequestCard = (name, details) => {
        let requests = JSON.parse(localStorage.getItem('productRequests') || '[]');
        // Add default status when creating a new request
        const newRequest = { id: Date.now(), name, details, status: 'Pending' }; 
        requests.push(newRequest);
        localStorage.setItem('productRequests', JSON.stringify(requests));
        displayRequestCards(); // Refresh the display
        showToast("Product request added!");
    };

    // Function to display request cards from localStorage
    // Modify displayRequestCards to simulate delay and return a promise
    const displayRequestCards = () => {
        return new Promise(resolve => { // Return a promise
            // Simulate fetch delay
            setTimeout(() => {
                const requests = JSON.parse(localStorage.getItem('productRequests') || '[]');
                // Target the section within the request-product-content div
                const cardsParentSection = requestProductContent ? requestProductContent.querySelector('section') : null;
                const currentNoRequestsMessage = requestProductContent ? requestProductContent.querySelector('#no-requests-message') : null;

                if (!cardsParentSection || !currentNoRequestsMessage) {
                     console.error("Request card parent section or message element not found");
                     resolve(); // Resolve promise even on error
                     return;
                }

                // Clear existing cards (excluding the no-requests message and caption)
                 Array.from(cardsParentSection.children).forEach(child => {
                     if (child.id !== 'no-requests-message' && !child.classList.contains('text-center')) { // Avoid removing caption too
                         child.remove();
                     }
                 });

                if (requests.length === 0) {
                    currentNoRequestsMessage.classList.remove('hidden');
                } else {
                    currentNoRequestsMessage.classList.add('hidden');
                    // Insert cards HTML *before* the no-requests message
                    const cardsHTML = requests.map((req, index) => createRequestCardHTML(req, index)).join('');
                    cardsParentSection.insertAdjacentHTML('afterbegin', cardsHTML);

                    // Add swipe listeners to the newly created cards within the section
                    cardsParentSection.querySelectorAll('.swipe-container').forEach(addSwipeListeners);

                    // Add delete button listeners within the section
                     cardsParentSection.querySelectorAll('.delete-button').forEach(button => {
                        button.addEventListener('click', handleDeleteRequest);
                    });
                }
                console.log("LOG: Cards displayed after refresh simulation.");
                resolve(); // Resolve promise after rendering
            }, 500); // 500ms delay simulation
        });
    };

    // --- Swipe-to-Delete Logic ---
    let touchStartX = 0;
    let touchCurrentX = 0;
    let swipedCard = null;
    let isSwiping = false;
    const SWIPE_THRESHOLD = 80; // Pixels to swipe to trigger delete reveal

    const handleTouchStart = (event) => {
        touchStartX = event.touches[0].clientX;
        touchCurrentX = touchStartX;
        isSwiping = true;
        swipedCard = event.currentTarget;
    };

    const handleTouchMove = (event) => {
        if (!isSwiping) return;
        touchCurrentX = event.touches[0].clientX;
    };

    const handleTouchEnd = (event) => {
        if (!isSwiping || !swipedCard) return;
        const deltaX = touchCurrentX - touchStartX;
        const content = swipedCard.querySelector('.request-card-content');
        if(content) content.style.transform = ''; // Reset transform for transition

        if (deltaX < -SWIPE_THRESHOLD) {
            // Open the swipe
            swipedCard.classList.add('is-swiped-open');
            // Ensure other cards are closed (Search within the parent section now)
            const parentSection = swipedCard.closest('section');
            if (parentSection) {
                 parentSection.querySelectorAll('.swipe-container.is-swiped-open').forEach(card => {
                    if (card !== swipedCard) {
                         card.classList.remove('is-swiped-open');
                    }
                });
            }
        } else {
            // Snap back closed (or ensure it is closed if not swiped far enough)
            swipedCard.classList.remove('is-swiped-open');
        }

        // Reset
        touchStartX = 0;
        touchCurrentX = 0;
        isSwiping = false;
        // Don't reset swipedCard here, needed for delete button
    };

    const addSwipeListeners = (element) => {
        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchmove', handleTouchMove, { passive: true });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });
        element.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    };

    // Function to handle delete button click
    const handleDeleteRequest = async (event) => {
        const requestId = event.currentTarget.dataset.id;
        
        try {
            const response = await fetch(`/api/requests?id=${requestId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete request');
            }

            showToast('Request deleted successfully!');
            await displayRequestCards();
        } catch (error) {
            console.error('Error deleting request:', error);
            showToast('Failed to delete request. Please try again.');
        }
    };

    // --- Renamed: Content Pane Switching Logic ---
    const switchContentPane = (targetButtonId) => { // Changed parameter name
        console.log(`Switching to nav item: ${targetButtonId}`);
        const pageTitleElement = document.getElementById('page-title');
        // const headerMenuIconElement = document.getElementById('header-menu-icon'); // Removed reference
        const addRequestButton = document.getElementById('add-request-button');

        // Define all nav buttons and content panes
        const navButtons = [bottomNavRequests, bottomNavFeedback, bottomNavMenu].filter(Boolean); // Filter out nulls
        const contentPanes = [requestProductContent, myFeedbackContent, chatContentPlaceholder, menuContentPlaceholder].filter(Boolean);
        let paneToShowId = null;
        let newPageTitle = 'Requests'; // Default title

        // Determine Content Pane ID and New Page Title based on Button ID
        if (targetButtonId === 'nav-requests') {
            paneToShowId = 'request-product-content';
            newPageTitle = 'Requests';
        } else if (targetButtonId === 'nav-feedback') {
            paneToShowId = 'my-feedback-content';
            newPageTitle = 'Feedback';
        } else if (targetButtonId === 'nav-menu') {
            paneToShowId = 'menu-content-placeholder';
            newPageTitle = 'Menu';
        } // Add else if for chat if re-enabled

        

       

        // Update Nav Item Appearance - Deactivate all first
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.classList.add('inactive');
        });
       

        // Update Content Pane Visibility - Hide all first
        contentPanes.forEach(pane => {
             pane.classList.remove('content-pane-visible');
             pane.classList.add('content-pane-hidden');
        });
        // Show the target pane (if one exists for the button)
        if (paneToShowId) {
            const paneToShow = document.getElementById(paneToShowId);
            if (paneToShow) {
                 paneToShow.classList.remove('content-pane-hidden');
                 paneToShow.classList.add('content-pane-visible');
                 // Refresh request cards ONLY when showing the requests pane
                 if (paneToShowId === 'request-product-content') {
                    displayRequestCards();
                }
            } else {
                 console.warn(`Content pane not found: ${paneToShowId}`);
            }
        }
        
        
    };
    // --- END: Content Pane Switching Logic ---

    // --- Event Listeners Setup ---
    if (dictateButton) {
        dictateButton.addEventListener('click', () => {
            showDictation();
        });
    } else {
        console.error('Dictate button not found');
    }

    if (stopDictationButton) {
        stopDictationButton.addEventListener('click', hideDictation);
    }

    // --- NEW: Add listeners for Start and Cancel Dictation ---
    if (startDictationButton) {
        startDictationButton.addEventListener('click', () => {
            if (recognition) {
                // --- NEW: Clear previous transcript before starting --- 
                lastFinalTranscript = ''; 
                if (interimTranscriptDisplay) interimTranscriptDisplay.textContent = '';
                if (dictationStatus) dictationStatus.textContent = 'Initializing...'; // Give feedback
                // --- END NEW ---
                try {
                    console.log('Starting recognition via Start button...');
                    recognition.start();
                    // Visibility updates are handled in recognition.onstart
                } catch(e) {
                    console.error("Recognition start failed: ", e);
                    if (dictationStatus) dictationStatus.textContent = 'Mic busy or error.';
                    // Reset buttons if start fails immediately
                    if (startDictationButton) startDictationButton.classList.remove('hidden');
                    if (cancelDictationButton) cancelDictationButton.classList.remove('hidden');
                    if (stopDictationButton) stopDictationButton.classList.add('hidden');
                }
            } else if (dictationStatus) {
                 dictationStatus.textContent = 'Speech recognition not supported.';
            }
        });
    } else {
        console.error('Start Dictation button not found');
    }

    if (cancelDictationButton) {
        cancelDictationButton.addEventListener('click', () => {
            console.log('Cancel dictation clicked.');
            hideDictation(true); // Hide and ensure recognition stops
             // --- MODIFIED: Ensure action links are reset on cancel --- 
            if (dictationActions) {
                 dictationActions.querySelectorAll('a').forEach(link => {
                     link.classList.add('opacity-50', 'pointer-events-none');
                     link.setAttribute('aria-disabled', 'true');
                     delete link.dataset.transcript;
                 });
            }
            // --- END MODIFIED ---
        });
    } else {
        console.error('Cancel Dictation button not found');
    }

    // --- NEW: Add listeners for Dictation Action Links ---
    if (createFeedbackLink) {
        createFeedbackLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link navigation
            const transcript = e.currentTarget.dataset.transcript || '';
            console.log('Create Feedback action clicked with transcript:', transcript);
            
            // Stop recognition if it's active
            if (recognition) {
                try {
                    recognition.stop();
                } catch(e) {
                    console.error("Recognition stop failed: ", e);
                }
            }
            
            // Hide dictation overlay and ensure recognition is stopped
            hideDictation(true);
            
            // Redirect to feedback page with transcript as query parameter
            window.location.href = `add-feedback.html?dictatedText=${encodeURIComponent(transcript)}`;
        });
    } else {
        console.error('Create Feedback link not found in dictation actions');
    }

    // Add listener for the "Request Product" link within dictation actions
    const requestProductLinkDictate = dictationActions ? dictationActions.querySelector('a:nth-child(2)') : null;
    if (requestProductLinkDictate) {
        requestProductLinkDictate.addEventListener('click', (e) => {
            e.preventDefault();
            const transcript = e.currentTarget.dataset.transcript || lastFinalTranscript.trim() || '';
            console.log('Request Product action clicked with transcript:', transcript);
            
            // Stop recognition if it's active
            if (recognition) {
                try {
                    recognition.stop();
                } catch(e) {
                    console.error("Recognition stop failed: ", e);
                }
            }
            
            // Hide dictation overlay and ensure recognition is stopped
            hideDictation(true);
            
            // Redirect to request page with transcript
            window.location.href = `request-product.html?dictatedText=${encodeURIComponent(transcript)}`;
        });
    } else {
        console.error('Request Product link not found in dictation actions');
    }
    // --- END NEW ---

    // --- NEW: Pull-to-refresh Handling ---
    const handleRefreshEnd = () => {
        console.log("LOG: handleRefreshEnd called"); // Log
        isRefreshing = false;
        if(refreshIndicator) { // Check if indicator exists
            refreshIndicator.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
            refreshIndicator.style.opacity = '0';
            refreshIndicator.style.transform = `translateY(-100%)`;
            // Make sure to reset content transform only if it was changed
            if (requestProductContent) { 
                 requestProductContent.style.transition = 'transform 0.3s ease-out';
                 requestProductContent.style.transform = 'translateY(0px)';
                 // Clean up styles after transition
                 setTimeout(() => {
                     requestProductContent.style.transition = '';
                 }, 300);
            }
            // Clean up indicator styles after transition
            setTimeout(() => {
                 refreshIndicator.style.transition = '';
             }, 300);
        }
    };

    const handlePTRTouchStart = (e) => {
        console.log("LOG: handlePTRTouchStart fired"); // Log
        if (isRefreshing || scrollableContent.scrollTop !== 0) {
             console.log(`LOG: PTR Start ignored - isRefreshing: ${isRefreshing}, scrollTop: ${scrollableContent.scrollTop}`); // Log
            return;
        }
        startY = e.touches[0].clientY;
        isDragging = true;
        console.log(`LOG: PTR Start - startY: ${startY}`); // Log
        // Remove transitions during drag
        if(refreshIndicator) refreshIndicator.style.transition = 'none';
        if(requestProductContent) requestProductContent.style.transition = 'none'; // Only affect request tab content
    };

    const handlePTRTouchMove = (e) => {
        if (!isDragging || isRefreshing) return;
        currentY = e.touches[0].clientY;
        let deltaY = currentY - startY;

        console.log(`LOG: handlePTRTouchMove - deltaY: ${deltaY.toFixed(2)}, scrollTop: ${scrollableContent.scrollTop}`); // Log

        if (deltaY < 0) deltaY = 0;
        
        if (scrollableContent.scrollTop === 0 && deltaY > 0) {
             e.preventDefault(); // Prevent scroll only when pulling down from top

            const pullDistance = Math.min(deltaY, PULL_THRESHOLD * 1.5);
            const indicatorPull = Math.max(0, pullDistance - PULL_THRESHOLD * 0.5);
            
            if(refreshIndicator) {
                 const newOpacity = Math.min(1, indicatorPull / PULL_THRESHOLD);
                 const newTransform = `translateY(${indicatorPull - refreshIndicator.offsetHeight}px)`;
                 console.log(`LOG: Applying to indicator - opacity: ${newOpacity.toFixed(2)}, transform: ${newTransform}`); // Log
                 refreshIndicator.style.opacity = `${newOpacity}`;
                 refreshIndicator.style.transform = newTransform;
            }
            
            // Only transform the request product content
            if(requestProductContent && !requestProductContent.classList.contains('content-pane-hidden')) {
                requestProductContent.style.transform = `translateY(${pullDistance * 0.4}px)`;
            }
        } 
    };

    const handlePTRTouchEnd = (e) => {
        if (!isDragging || isRefreshing) return;
        isDragging = false;
        let deltaY = currentY - startY;
        console.log(`LOG: handlePTRTouchEnd - deltaY: ${deltaY.toFixed(2)}`); // Log

        if (scrollableContent.scrollTop === 0 && deltaY > PULL_THRESHOLD) {
            isRefreshing = true;
            console.log("LOG: Refresh triggered!");
            if(refreshIndicator) {
                 refreshIndicator.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
                 refreshIndicator.style.opacity = '1';
                 refreshIndicator.style.transform = `translateY(0)`;

                 // Animate content down by indicator height
                 const indicatorHeight = refreshIndicator.offsetHeight; 
                 if(requestProductContent) {
                     requestProductContent.style.transition = 'transform 0.2s ease-out';
                     requestProductContent.style.transform = `translateY(${indicatorHeight}px)`;
                 }

                 displayRequestCards().then(() => {
                     handleRefreshEnd();
                 }).catch((err) => {
                      console.error("Error during refresh:", err);
                      handleRefreshEnd();
                 });

            } else {
                // If somehow indicator is missing, end refresh immediately
                handleRefreshEnd(); 
            }
        } else {
             // Snap Back (No Refresh)
             if(refreshIndicator) {
                 refreshIndicator.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
                 refreshIndicator.style.opacity = '0';
                 refreshIndicator.style.transform = `translateY(-100%)`;
                 setTimeout(() => { refreshIndicator.style.transition = ''; }, 300);
            }
             if(requestProductContent) {
                 requestProductContent.style.transition = 'transform 0.3s ease-out';
                 requestProductContent.style.transform = 'translateY(0px)';
                 setTimeout(() => { requestProductContent.style.transition = ''; }, 300);
             }
        }
        startY = 0;
        currentY = 0;
        console.log("LOG: PTR Touch End finished."); // Log
    };
    // --- END: Pull-to-refresh Handling ---

    

    

    // Function to create a sample request card
    const createSampleRequest = () => {
        const sampleRequest = {
            id: Date.now(),
            name: "Exam Gloves - Size M",
            imgSrc: "https://instytutmkm.pl/wp-content/uploads/2019/01/medical_shop_5.jpg",
            quantity: 10,
            urgency: "High",
            status: "Pending",
            timeLeft: "0 min left",
            requester: "Dr. Smith",
            department: "Emergency",
            notes: "For emergency department use"
        };
        
        let requests = JSON.parse(localStorage.getItem('productRequests') || '[]');
        // Only add if no requests exist
        if (requests.length === 0) {
            requests.push(sampleRequest);
            localStorage.setItem('productRequests', JSON.stringify(requests));
        }
    };

    // --- Initial Setup --- 
    //createSampleRequest(); // Add this line before switchContentPane
    switchContentPane('nav-requests');
    console.log("AMS Mobile script loaded and initialized.");

    // Add Request Modal and Flow
    const createAddRequestModal = () => {
        const modalHTML = `
            <div id="add-request-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-semibold text-gray-900">New Product Request</h2>
                        <button id="close-add-request-modal" class="text-gray-500 hover:text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <form id="add-request-form" class="space-y-4">
                        <div>
                            <label for="product-name" class="block text-sm font-medium text-gray-700">Product Name</label>
                            <input type="text" id="product-name" name="product-name" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500">
                        </div>
                        <div>
                            <label for="quantity" class="block text-sm font-medium text-gray-700">Quantity</label>
                            <input type="number" id="quantity" name="quantity" min="1" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500">
                        </div>
                        <div>
                            <label for="urgency" class="block text-sm font-medium text-gray-700">Urgency Level</label>
                            <select id="urgency" name="urgency" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500">
                                <option value="High">High</option>
                                <option value="Normal">Normal</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                        <div>
                            <label for="notes" class="block text-sm font-medium text-gray-700">Additional Notes</label>
                            <textarea id="notes" name="notes" rows="3"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"></textarea>
                        </div>
                        <div class="flex justify-end space-x-3">
                            <button type="button" id="cancel-add-request"
                                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500">
                                Cancel
                            </button>
                            <button type="submit"
                                class="px-4 py-2 text-sm font-medium text-white bg-cyan-600 border border-transparent rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500">
                                Submit Request
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    };

    const showAddRequestModal = () => {
        const modal = document.getElementById('add-request-modal');
        if (!modal) {
            createAddRequestModal();
        }
        document.getElementById('add-request-modal').classList.remove('hidden');
    };

    const hideAddRequestModal = () => {
        const modal = document.getElementById('add-request-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    };

    const handleAddRequestSubmit = async (event) => {
        event.preventDefault();
        
        try {
            const formData = new FormData(event.target);
            const requestData = {
                name: formData.get('name'),
                details: formData.get('details')
            };

            const response = await fetch('/api/requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error('Failed to submit request');
            }

            showToast('Request submitted successfully!');
            hideAddRequestModal();
            await displayRequestCards();
        } catch (error) {
            console.error('Error submitting request:', error);
            showToast('Failed to submit request. Please try again.');
        }
    };

    // Add event listeners for the add request flow
    if (document.getElementById('add-request-button')) {
        document.getElementById('add-request-button').addEventListener('click', showAddRequestModal);
    }

    // Add event listeners for the modal
    document.addEventListener('click', (event) => {
        if (event.target.id === 'close-add-request-modal' || event.target.id === 'cancel-add-request') {
            hideAddRequestModal();
        }
    });

    document.addEventListener('submit', (event) => {
        if (event.target.id === 'add-request-form') {
            handleAddRequestSubmit(event);
        }
    });

    // Feedback Modal and Flow
    const createFeedbackModal = () => {
        const modalHTML = `
            <div id="feedback-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-semibold text-gray-900">Submit Feedback</h2>
                        <button id="close-feedback-modal" class="text-gray-500 hover:text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <form id="feedback-form" class="space-y-4">
                        <!-- Step 1: Input Section -->
                        <div id="input-section" class="space-y-4">
                            <div class="text-center">
                                <h3 class="text-lg font-medium text-gray-900 mb-2">What's your feedback?</h3>
                                <p class="text-sm text-gray-500">Input via: Text, Dictate, or Photo</p>
                            </div>
                            
                            <div class="flex justify-center space-x-4">
                                <button type="button" id="dictate-feedback" class="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                    <span class="text-sm mt-1">Dictate</span>
                                </button>
                                
                                <button type="button" id="camera-feedback" class="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span class="text-sm mt-1">Photo</span>
                                </button>
                            </div>

                            <div class="mt-4">
                                <textarea id="feedback-message" name="feedback-message" rows="3" placeholder="Type your feedback here..."
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"></textarea>
                            </div>
                        </div>

                        <!-- Step 2: AI Preview Section (Initially Hidden) -->
                        <div id="preview-section" class="hidden space-y-4">
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <h3 class="text-lg font-medium text-gray-900 mb-2">AI-Generated Preview</h3>
                                
                                <div class="space-y-3">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700">Item Detected</label>
                                        <input type="text" id="detected-item" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" readonly>
                                    </div>
                                    
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700">Suggested Summary</label>
                                        <textarea id="suggested-summary" rows="2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
                                    </div>
                                    
                                    <div class="flex items-center space-x-2">
                                        <label class="block text-sm font-medium text-gray-700">Rating</label>
                                        <div id="rating-stars" class="flex">
                                            ${Array(5).fill().map((_, i) => `
                                                <button type="button" data-rating="${i + 1}" class="text-gray-400 hover:text-yellow-400 focus:outline-none">
                                                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                                    </svg>
                                                </button>
                                            `).join('')}
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center space-x-2">
                                        <label class="block text-sm font-medium text-gray-700">Tags</label>
                                        <div id="feedback-tags" class="flex flex-wrap gap-2">
                                            <span class="px-2 py-1 text-xs rounded-full bg-cyan-100 text-cyan-800">Needs Attention</span>
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center">
                                        <input type="checkbox" id="critical-safety" class="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded">
                                        <label for="critical-safety" class="ml-2 block text-sm text-gray-900">Critical to Patient Safety</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Step 3: Submit Section -->
                        <div class="flex justify-end space-x-3">
                            <button type="button" id="cancel-feedback"
                                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" id="submit-feedback"
                                class="px-4 py-2 text-sm font-medium text-white bg-cyan-600 border border-transparent rounded-md hover:bg-cyan-700">
                                Submit Feedback
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    };

    const showFeedbackModal = () => {
        const modal = document.getElementById('feedback-modal');
        if (!modal) {
            createFeedbackModal();
        }
        document.getElementById('feedback-modal').classList.remove('hidden');
    };

    const hideFeedbackModal = () => {
        const modal = document.getElementById('feedback-modal');
        if (modal) {
            modal.classList.add('hidden');
            stopCamera(); // Stop camera when closing modal
        }
    };

    let feedbackStream = null;
    let feedbackCurrentFacingMode = 'environment';

    const startFeedbackCamera = async (facingMode) => {
        stopFeedbackCamera();
        feedbackCurrentFacingMode = facingMode;

        const constraints = {
            video: {
                facingMode: facingMode
            }
        };

        try {
            feedbackStream = await navigator.mediaDevices.getUserMedia(constraints);
            const video = document.getElementById('camera-view');
            video.srcObject = feedbackStream;
            video.play();
        } catch (err) {
            console.error('Error accessing camera:', err);
            showToast('Could not access camera. Please ensure permissions are granted.');
        }
    };

    const stopFeedbackCamera = () => {
        if (feedbackStream) {
            feedbackStream.getTracks().forEach(track => track.stop());
            feedbackStream = null;
        }
        const video = document.getElementById('camera-view');
        if (video) {
            video.srcObject = null;
        }
    };

    const handleTakePhoto = () => {
        const video = document.getElementById('camera-view');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        const previewImage = document.getElementById('preview-image');
        previewImage.src = canvas.toDataURL('image/jpeg');
        
        document.getElementById('camera-container').classList.add('hidden');
        document.getElementById('photo-preview').classList.remove('hidden');
        stopFeedbackCamera();
    };

    const handleRetakePhoto = () => {
        document.getElementById('camera-container').classList.remove('hidden');
        document.getElementById('photo-preview').classList.add('hidden');
        startFeedbackCamera(feedbackCurrentFacingMode);
    };

    const handleFeedbackInput = () => {
        const message = document.getElementById('feedback-message').value;
        const photo = feedbackState.photo;
        
        if (message || photo) {
            const analysis = analyzeFeedback(message, photo);
            updatePreviewSection(analysis);
        } else {
            document.getElementById('preview-section').classList.add('hidden');
        }
    };

    const handlePhotoCapture = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = document.createElement('video');
            video.srcObject = stream;
            await video.play();
            
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            
            const photo = canvas.toDataURL('image/jpeg');
            feedbackState.photo = photo;
            
            stream.getTracks().forEach(track => track.stop());
            handleFeedbackInput();
        } catch (error) {
            console.error('Error capturing photo:', error);
            showToast('Failed to capture photo. Please try again.');
        }
    };

    const handleFeedbackSubmit = async (event) => {
        event.preventDefault();
        
        try {
            const formData = new FormData(event.target);
            const feedbackData = {
                product: formData.get('product'),
                rating: parseInt(formData.get('rating')),
                text: formData.get('feedback'),
                photo_url: currentPhotoUrl,
                is_critical: formData.get('is_critical') === 'true'
            };

            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedbackData)
            });

            if (!response.ok) {
                throw new Error('Failed to submit feedback');
            }

            showToast('Feedback submitted successfully!');
            hideFeedbackModal();
            resetFeedbackState();
            await displaySupabaseFeedback();
        } catch (error) {
            console.error('Error submitting feedback:', error);
            showToast('Failed to submit feedback. Please try again.');
        }
    };

    const resetFeedbackState = () => {
        feedbackState = {
            message: '',
            photo: null,
            detectedItem: '',
            suggestedSummary: '',
            rating: 0,
            tags: ['Needs Attention'],
            is_critical: false
        };
        document.getElementById('feedback-message').value = '';
        document.getElementById('preview-section').classList.add('hidden');
        document.getElementById('critical-safety').checked = false;
    };

    // Add event listeners for feedback functionality
    document.addEventListener('DOMContentLoaded', () => {
        // ... existing event listeners ...

        // Add feedback button listener
        const addFeedbackButton = document.getElementById('add-feedback-button');
        if (addFeedbackButton) {
            addFeedbackButton.addEventListener('click', () => {
                alert('Add Feedback button clicked!'); // Debug alert
                showFeedbackModal();
                resetFeedbackState();
            });
        }

        // Close feedback modal listener
        const closeFeedbackModal = document.getElementById('close-feedback-modal');
        if (closeFeedbackModal) {
            closeFeedbackModal.addEventListener('click', () => {
                hideFeedbackModal();
                resetFeedbackState();
            });
        }

        // Cancel feedback listener
        const cancelFeedback = document.getElementById('cancel-feedback');
        if (cancelFeedback) {
            cancelFeedback.addEventListener('click', () => {
                hideFeedbackModal();
                resetFeedbackState();
            });
        }

        // Feedback input listeners
        const feedbackMessage = document.getElementById('feedback-message');
        if (feedbackMessage) {
            feedbackMessage.addEventListener('input', handleFeedbackInput);
        }

        // Dictate button listener
        const dictateButton = document.getElementById('dictate-feedback');
        if (dictateButton) {
            dictateButton.addEventListener('click', () => {
                // Implement speech recognition here
                showToast('Dictation feature coming soon!');
            });
        }

        // Camera button listener
        const cameraButton = document.getElementById('camera-feedback');
        if (cameraButton) {
            cameraButton.addEventListener('click', handlePhotoCapture);
        }

        // Rating stars listeners
        const ratingStars = document.querySelectorAll('#rating-stars button');
        ratingStars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                feedbackState.rating = rating;
                ratingStars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.add('text-yellow-400');
                        s.classList.remove('text-gray-400');
                    } else {
                        s.classList.remove('text-yellow-400');
                        s.classList.add('text-gray-400');
                    }
                });
            });
        });

        // Submit button listener
        const submitButton = document.getElementById('submit-feedback');
        if (submitButton) {
            submitButton.addEventListener('click', handleFeedbackSubmit);
        }
    });

    // Function to display feedback cards
    const displayFeedbackCards = () => {
        const feedbacks = JSON.parse(localStorage.getItem('productFeedbacks') || '[]');
        const feedbackContainer = document.getElementById('feedback-cards-container');
        const noFeedbacksMessage = document.getElementById('no-feedbacks-message');

        if (!feedbackContainer || !noFeedbacksMessage) return;

        // Clear existing cards
        feedbackContainer.innerHTML = '';

        if (feedbacks.length === 0) {
            noFeedbacksMessage.classList.remove('hidden');
        } else {
            noFeedbacksMessage.classList.add('hidden');
            const cardsHTML = feedbacks.map((feedback, index) => createFeedbackCardHTML(feedback, index)).join('');
            feedbackContainer.insertAdjacentHTML('beforeend', cardsHTML);
        }
    };

    // Function to create HTML for a single feedback card
    const createFeedbackCardHTML = (feedback, index) => {
        const ratingStars = Array(5).fill().map((_, i) => `
            <svg class="w-5 h-5 ${i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
        `).join('');

        return `
            <div class="bg-white rounded-lg shadow overflow-hidden mb-3" data-index="${index}">
                <div class="p-4 space-y-3">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-lg font-medium text-gray-900">${feedback.detectedItem || 'Product Feedback'}</h3>
                            <p class="text-gray-500">${new Date(feedback.timestamp).toLocaleString()}</p>
                        </div>
                        ${feedback.is_critical ? `
                            <span class="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">Critical</span>
                        ` : ''}
                    </div>
                    
                    <div class="flex items-center">
                        ${ratingStars}
                    </div>
                    
                    <div class="space-y-2">
                        <p class="text-gray-700">${feedback.message}</p>
                        ${feedback.suggestedSummary ? `
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <p class="text-sm text-gray-600">${feedback.suggestedSummary}</p>
                            </div>
                        ` : ''}
                        ${feedback.photo ? `
                            <div class="mt-2">
                                <img src="${feedback.photo}" alt="Feedback photo" class="w-full rounded-md">
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="flex flex-wrap gap-2">
                        ${feedback.tags.map(tag => `
                            <span class="px-2 py-1 text-xs rounded-full bg-cyan-100 text-cyan-800">${tag}</span>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    };

    // Tab Switching
    const tabs = document.querySelectorAll('.tab-button-underline');
    const contentAreas = document.querySelectorAll('.content-pane'); // Updated selector

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Get the target content pane ID from the button's data attribute
            const targetContentId = tab.getAttribute('data-tab-button');
            if (!targetContentId) return; // Exit if no target ID found

            // Remove active class from all tabs
            tabs.forEach(t => {
                t.classList.remove('active');
                t.classList.add('inactive');
            });

            // Add active class to clicked tab
            tab.classList.remove('inactive');
            tab.classList.add('active');

            // Update content visibility
            contentAreas.forEach(area => {
                if (area.id === targetContentId) {
                    area.classList.remove('content-pane-hidden');
                    area.classList.add('content-pane-visible');
                } else {
                    area.classList.add('content-pane-hidden');
                    area.classList.remove('content-pane-visible');
            }
            });
        });
    });

    // Bottom Navigation
    const bottomNavButtons = document.querySelectorAll('.bottom-nav button');
    bottomNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = button.getAttribute('data-href');
        });
    });

    // Sample Data
    const sampleRequest = {
        id: 1,
        name: "Exam Gloves - Size M",
        quantity: 10,
        urgency: "High",
        timeLeft: "45 min left",
        requester: "Dr. Smith",
        department: "Emergency",
        status: "Pending",
        notes: "For emergency department use"
    };

    // Function to create request card
    function createRequestCard(request) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-sm p-4 mb-4';
        card.innerHTML = `
            <!-- Product Icon and Status -->
            <div class="flex justify-between items-start mb-4">
                <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-blue-500">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                </div>
                <span class="bg-yellow-50 text-yellow-800 text-xs font-medium px-2.5 py-1 rounded">${request.status}</span>
            </div>

            <!-- Product Name and Requester -->
            <div class="mb-4">
                <h3 class="text-lg font-semibold text-gray-900">${request.name}</h3>
                <p class="text-sm text-gray-500 mt-1">Requested by ${request.requester} - ${request.department}</p>
            </div>

            <!-- Details -->
            <div class="space-y-2">
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500">Quantity:</span>
                    <span class="text-sm font-medium text-gray-900">${request.quantity}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500">Urgency Level:</span>
                    <span class="text-sm font-medium text-gray-900">${request.urgency}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500">Time Left:</span>
                    <span class="text-sm font-medium text-gray-900">${request.timeLeft}</span>
                </div>
            </div>

            ${request.notes ? `
            <!-- Additional Note -->
            <div class="mt-4 pt-4 border-t border-gray-100">
                <p class="text-sm text-gray-500">${request.notes}</p>
            </div>
            ` : ''}
        `;
        return card;
    }

    // Initialize the page with sample data
    // const contentArea = document.querySelector('.flex-1.overflow-y-auto');
    // if (contentArea) {
    //     contentArea.appendChild(createRequestCard(sampleRequest));
    // }

    // Add click event for Request Product button
    const requestProductBtn = document.querySelector('button:has(span:contains("Request Product"))');
    if (requestProductBtn) {
        requestProductBtn.addEventListener('click', function() {
            window.location.href = 'request-product.html';
        });
    }

    // Initialize notifications system
    initNotifications(); // Commented out temporarily
    
    // Add offline/online event handlers
    window.addEventListener('online', async () => {
        console.log('Back online. Syncing offline data...');
        try {
            await processOfflineQueue(); // Commented out temporarily
            // Show a success message
            const offlineStatusEl = document.getElementById('offline-status');
            if (offlineStatusEl) {
                offlineStatusEl.textContent = 'Back online! Synced offline data.';
                offlineStatusEl.classList.remove('bg-yellow-500', 'hidden');
                offlineStatusEl.classList.add('bg-green-500');
                setTimeout(() => {
                    offlineStatusEl.classList.add('hidden');
                }, 3000);
            }
        } catch (error) {
            console.error('Error processing offline queue:', error);
        }
    });
    
    window.addEventListener('offline', () => {
        console.log('Offline mode. Data will be saved locally.');
        // Show offline message
        const offlineStatusEl = document.getElementById('offline-status');
        if (offlineStatusEl) {
            offlineStatusEl.textContent = 'You are offline. Data will be saved locally.';
            offlineStatusEl.classList.remove('bg-green-500', 'hidden');
            offlineStatusEl.classList.add('bg-yellow-500');
        }
    });
    
    // Initial offline check
    if (!navigator.onLine) {
        const offlineStatusEl = document.getElementById('offline-status');
        if (offlineStatusEl) {
            offlineStatusEl.textContent = 'You are offline. Data will be saved locally.';
            offlineStatusEl.classList.remove('hidden', 'bg-green-500');
            offlineStatusEl.classList.add('bg-yellow-500');
        }
    }
}); // End DOMContentLoaded 