/**
 * Database utilities for Supabase
 * This file contains common functions for database operations
 */

import supabase from './supabase.js';

/**
 * Product Requests
 */

// Save a new product request
export async function saveProductRequest(requestData) {
  const { data, error } = await supabase
    .from('product_requests')
    .insert([requestData])
    .select();
  
  if (error) throw error;
  return data[0];
}

// Get all product requests for the current user
export async function getProductRequests() {
  const { data, error } = await supabase
    .from('product_requests')
    .select('*, request_responses(*)')
    .order('timestamp', { ascending: false });
  
  if (error) throw error;
  return data;
}

// Get a single product request by ID
export async function getProductRequestById(id) {
  const { data, error } = await supabase
    .from('product_requests')
    .select('*, request_responses(*)')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Feedback
 */

// Save a new feedback
export async function saveFeedback(feedbackData) {
  console.log('DB-UTILS: Attempting to save feedback:', feedbackData);
  
  try {
    const { data, error } = await supabase
      .from('feedback')
      .insert([feedbackData]);

    if (error) {
      console.error('DB-UTILS: Supabase error while saving feedback:', error);
      throw error;
    }

    console.log('DB-UTILS: Feedback saved successfully:', data);
    return data;
  } catch (error) {
    console.error('DB-UTILS: Error in saveFeedback function:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    throw error;
  }
}

// Get all feedback for the current user
export async function getFeedback() {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('timestamp', { ascending: false });
  
  if (error) {
    console.error('Error fetching feedback:', error);
    throw error;
  }
  return data;
}

/**
 * Responses
 */

// Get all new responses since a given timestamp
export async function getNewResponses(lastCheckedTimestamp) {
  // Get new request responses
  const { data: requestResponses, error: requestError } = await supabase
    .from('request_responses')
    .select('*, product_requests(*)')
    .gt('timestamp', lastCheckedTimestamp);
  
  if (requestError) throw requestError;
  
  // Get new feedback responses
  const { data: feedbackResponses, error: feedbackError } = await supabase
    .from('feedback_responses')
    .select('*, feedback(*)')
    .gt('timestamp', lastCheckedTimestamp);
  
  if (feedbackError) throw feedbackError;
  
  return {
    requestResponses,
    feedbackResponses
  };
}

// Save the last checked timestamp for notifications
export function saveLastCheckedTimestamp() {
  const timestamp = new Date().toISOString();
  localStorage.setItem('lastCheckedTimestamp', timestamp);
  return timestamp;
}

// Get the last checked timestamp
export function getLastCheckedTimestamp() {
  return localStorage.getItem('lastCheckedTimestamp') || new Date(0).toISOString();
}

/**
 * Offline Support
 */

// Queue an operation for later sync when offline
export function queueOfflineOperation(operation, data) {
  const offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
  offlineQueue.push({ operation, data, timestamp: new Date().toISOString() });
  localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
}

// Process offline queue when back online
export async function processOfflineQueue() {
  const offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
  if (offlineQueue.length === 0) return;
  
  const successfulOperations = [];
  
  for (let i = 0; i < offlineQueue.length; i++) {
    const { operation, data } = offlineQueue[i];
    
    try {
      switch (operation) {
        case 'saveProductRequest':
          await saveProductRequest(data);
          break;
        case 'saveFeedback':
          await saveFeedback(data);
          break;
        // Add other operations as needed
      }
      
      successfulOperations.push(i);
    } catch (error) {
      console.error('Error processing offline operation:', error);
    }
  }
  
  // Remove successful operations from queue
  const newQueue = offlineQueue.filter((_, index) => !successfulOperations.includes(index));
  localStorage.setItem('offlineQueue', JSON.stringify(newQueue));
}

/**
 * Test function to fetch feedback data
 */
export async function testFeedbackConnection() {
  console.log('Testing Supabase feedback connection...');
  
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Error fetching feedback:', error);
      return { error };
    }
    
    console.log('Successfully fetched feedback:', data);
    return { data };
  } catch (error) {
    console.error('Exception while fetching feedback:', error);
    return { error };
  }
} 