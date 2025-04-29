# Supabase Integration Setup Guide

This guide will help you set up Supabase for your AMS Mobile application to handle product requests, feedback, and track responses.

## 1. Create Supabase Project

1. Sign up or log in to [Supabase](https://supabase.com)
2. Create a new project from the dashboard
3. Choose a name for your project and set a secure database password
4. Select the region closest to your users
5. Wait for your project to be created (may take a few minutes)

## 2. Set Up Database Tables

1. Navigate to the SQL Editor in your Supabase project
2. Copy and paste the contents of `supabase-schema.sql` into the SQL editor
3. Run the SQL script to create the necessary tables and set up row-level security policies

## 3. Get API Keys

1. In your Supabase project, go to Settings > API
2. You'll need two values:
   - **URL**: Your project URL (e.g., `https://abcdefghijklm.supabase.co`)
   - **anon key**: Public API key for client-side access

## 4. Update Configuration

1. Open the `supabase.js` file in your project
2. Replace the placeholder values with your actual Supabase URL and anon key:

```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

## 5. Authentication (Optional but Recommended)

For better security, you can implement user authentication:

1. In Supabase, go to Authentication > Settings
2. Configure your authentication providers (Email, Google, etc.)
3. Update your application code to include authentication

```javascript
// Example login with email/password
const { user, error } = await supabase.auth.signIn({
  email: 'user@example.com',
  password: 'password123'
})

// Example signup
const { user, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})
```

## 6. Row-Level Security

The SQL setup includes row-level security policies to protect your data. For these to work properly:

1. Make sure to set the `user_id` field in your requests and feedback to the authenticated user's ID when inserting data
2. For admin functionality, we're using Supabase's built-in service_role:

   - Regular users can only see and modify their own data
   - The service_role can access all data (used for admin functions)
   - In your admin application, you'll need to use the service_role key instead of the anon key

   ```javascript
   // For admin access
   const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
   ```

   > **Important:** Never expose the service_role key in client-side code. Use it only in secure server environments.

3. Alternative approach: If you need more granular admin control, you can:
   - Create a separate `user_profiles` table with an `is_admin` boolean field
   - Update the RLS policies to check this field instead of the role

## 7. Testing Your Integration

1. Make sure all JavaScript files are properly loaded in your HTML files with type="module"
2. Submit a test product request and check your Supabase database
3. Submit test feedback and verify it appears in the database
4. Test the offline functionality by disabling your network connection

## 8. Deploying to Production

When deploying to production:

1. Consider using environment variables for Supabase credentials
2. Implement proper error handling and logging
3. Set up CORS policies in Supabase to restrict access to your domain
4. Consider server-side validation for critical operations

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://github.com/supabase/supabase-js)
- [Supabase Authentication Guides](https://supabase.com/docs/guides/auth) 