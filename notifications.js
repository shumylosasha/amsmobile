/**
 * Notifications system for Supabase responses
 * Handles checking for new responses and displaying notifications
 */

import { getNewResponses, getLastCheckedTimestamp, saveLastCheckedTimestamp } from './db-utils.js';

// DOM Elements
let notificationContainer;
let notificationBadge;
let unreadCount = 0;

// Initialize notification system
export function initNotifications() {
    // Create notification container if it doesn't exist
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = 'fixed top-16 right-4 w-80 max-w-full z-50 flex flex-col-reverse gap-2';
        document.body.appendChild(notificationContainer);
    }
    
    // Find the notification badge if it exists in the DOM
    notificationBadge = document.getElementById('notification-badge');
    
    // Start checking for notifications
    checkForNewResponses();
    
    // Set up interval to check periodically (every 5 minutes)
    setInterval(checkForNewResponses, 5 * 60 * 1000);
}

// Check for new responses since last check
async function checkForNewResponses() {
    try {
        // Skip if offline
        if (!navigator.onLine) return;
        
        const lastChecked = getLastCheckedTimestamp();
        const { requestResponses, feedbackResponses } = await getNewResponses(lastChecked);
        
        // Process new responses
        if (requestResponses.length > 0 || feedbackResponses.length > 0) {
            // Update unread count
            unreadCount += requestResponses.length + feedbackResponses.length;
            updateNotificationBadge();
            
            // Show notifications for each response
            requestResponses.forEach(response => {
                showNotification('Request Response', 
                    `Response to your product request "${response.product_requests?.productName || 'Unknown'}" has been updated.`,
                    'request-responses.html?id=' + response.request_id);
            });
            
            feedbackResponses.forEach(response => {
                showNotification('Feedback Response', 
                    `Your feedback about "${response.feedback?.product || 'Unknown'}" has received a response.`,
                    'feedback-responses.html?id=' + response.feedback_id);
            });
        }
        
        // Update last checked timestamp
        saveLastCheckedTimestamp();
    } catch (error) {
        console.error('Error checking for new responses:', error);
    }
}

// Display a notification
function showNotification(title, message, link) {
    const notification = document.createElement('div');
    notification.className = 'bg-white shadow-lg rounded-lg p-4 border-l-4 border-blue-500 transform transition-all duration-300 opacity-0 translate-x-full';
    notification.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <h4 class="font-semibold text-gray-900">${title}</h4>
                <p class="text-sm text-gray-600">${message}</p>
            </div>
            <button class="text-gray-400 hover:text-gray-600 focus:outline-none" aria-label="Close">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
        ${link ? `<a href="${link}" class="block mt-2 text-sm text-blue-500 hover:underline">View details</a>` : ''}
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('opacity-0', 'translate-x-full');
    }, 10);
    
    // Close button
    const closeBtn = notification.querySelector('button');
    closeBtn.addEventListener('click', () => {
        notification.classList.add('opacity-0', 'translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('opacity-0', 'translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 10000);
}

// Update the notification badge
function updateNotificationBadge() {
    if (notificationBadge) {
        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            notificationBadge.classList.remove('hidden');
        } else {
            notificationBadge.classList.add('hidden');
        }
    }
}

// Mark notifications as read
export function markAsRead() {
    unreadCount = 0;
    updateNotificationBadge();
}

// Manually check for new responses (can be called from buttons, etc.)
export function checkNow() {
    return checkForNewResponses();
} 