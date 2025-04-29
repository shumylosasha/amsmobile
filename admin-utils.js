/**
 * Admin utilities for Supabase
 * This file contains functions for admin operations using the service role
 * 
 * IMPORTANT: This file should only be used in secure server environments,
 * never in client-side code accessible to users.
 */

// Import Supabase client using unpkg CDN
import { createClient } from 'https://unpkg.com/@supabase/supabase-js@2';

// No need to access global supabase object anymore
// const { createClient } = supabase;

// Supabase project URL and service_role key (NEVER expose in client-side code)
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseServiceRoleKey = 'YOUR_SERVICE_ROLE_KEY'; // Keep this secure!

// Initialize Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Respond to a product request
 * @param {string} requestId - ID of the request to respond to
 * @param {string} responseText - Text of the response
 * @param {string} status - New status for the request (e.g., 'approved', 'rejected', 'in-progress')
 * @param {string} adminId - ID of the admin user
 */
export async function respondToProductRequest(requestId, responseText, status, adminId) {
  // First, create the response
  const { data: response, error: responseError } = await supabaseAdmin
    .from('request_responses')
    .insert([{
      request_id: requestId,
      response_text: responseText,
      response_status: status,
      admin_id: adminId,
      timestamp: new Date().toISOString()
    }])
    .select();
  
  if (responseError) throw responseError;
  
  // Then, update the request status and link to the response
  const { error: updateError } = await supabaseAdmin
    .from('product_requests')
    .update({
      status: status,
      response_id: response[0].id
    })
    .eq('id', requestId);
  
  if (updateError) throw updateError;
  
  return response[0];
}

/**
 * Respond to feedback
 * @param {string} feedbackId - ID of the feedback to respond to
 * @param {string} responseText - Text of the response
 * @param {string} adminId - ID of the admin user
 */
export async function respondToFeedback(feedbackId, responseText, adminId) {
  // Create the response
  const { data: response, error: responseError } = await supabaseAdmin
    .from('feedback_responses')
    .insert([{
      feedback_id: feedbackId,
      response_text: responseText,
      admin_id: adminId,
      timestamp: new Date().toISOString()
    }])
    .select();
  
  if (responseError) throw responseError;
  
  // Update the feedback to link to the response
  const { error: updateError } = await supabaseAdmin
    .from('feedback')
    .update({
      response_id: response[0].id
    })
    .eq('id', feedbackId);
  
  if (updateError) throw updateError;
  
  return response[0];
}

/**
 * Get all pending product requests
 */
export async function getPendingProductRequests() {
  const { data, error } = await supabaseAdmin
    .from('product_requests')
    .select('*')
    .eq('status', 'pending')
    .order('timestamp', { ascending: false });
  
  if (error) throw error;
  return data;
}

/**
 * Get all feedback without responses
 */
export async function getUnansweredFeedback() {
  const { data, error } = await supabaseAdmin
    .from('feedback')
    .select('*')
    .is('response_id', null)
    .order('timestamp', { ascending: false });
  
  if (error) throw error;
  return data;
}

/**
 * Get overall statistics
 */
export async function getAdminStats() {
  // Get counts of various items
  const [
    pendingRequests,
    unansweredFeedback,
    totalRequests,
    totalFeedback
  ] = await Promise.all([
    supabaseAdmin.from('product_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('feedback').select('id', { count: 'exact', head: true }).is('response_id', null),
    supabaseAdmin.from('product_requests').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('feedback').select('id', { count: 'exact', head: true })
  ]);
  
  return {
    pendingRequests: pendingRequests.count || 0,
    unansweredFeedback: unansweredFeedback.count || 0,
    totalRequests: totalRequests.count || 0,
    totalFeedback: totalFeedback.count || 0,
    responseRate: totalRequests.count 
      ? ((totalRequests.count - pendingRequests.count) / totalRequests.count) * 100 
      : 0
  };
} 