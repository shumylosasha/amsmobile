/**
 * Supabase client initialization
 * This file initializes and exports the Supabase client for use throughout the application
 */

// Import Supabase client from CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// No need to access global supabase object anymore
// const { createClient } = supabase;

// Supabase project URL and anon key
// In production, these should be environment variables
const supabaseUrl = 'https://ynsijvsabflqamakdaav.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inluc2lqdnNhYmZscWFtYWtkYWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjkyNjgsImV4cCI6MjA2MDg0NTI2OH0.M9unrZJzU8Dv5g92-aKcLDSyndlRGkLVlNavVu56wiQ';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export the initialized client
export default supabase; 