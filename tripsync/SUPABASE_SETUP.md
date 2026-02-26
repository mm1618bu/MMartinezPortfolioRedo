# Supabase Authentication Setup Guide

## Prerequisites
- A Supabase account (sign up at https://supabase.com)

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in your project details:
   - Name: TripSync (or any name you prefer)
   - Database Password: Choose a secure password
   - Region: Select the closest region to your users
4. Click "Create new project" and wait for it to be provisioned (takes ~2 minutes)

## Step 2: Get Your API Credentials

1. In your Supabase dashboard, click on the **Settings** icon (gear icon)
2. Go to **API** section
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

## Step 3: Configure Your App

1. Create a `.env` file in the root of the tripsync directory:
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file and add your credentials:
   ```
   REACT_APP_SUPABASE_URL=https://your-project-url.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **IMPORTANT**: Make sure `.env` is in your `.gitignore` file (it should be by default in Create React App)

## Step 4: Configure Supabase Authentication Settings

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Under **Site URL**, add your app URL:
   - For local development: `http://localhost:3000`
   - For production: Your production URL
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/reset-password` (for local development)
   - Your production URL + `/reset-password` (for production)

## Step 5: Email Templates (Optional but Recommended)

1. Go to **Authentication** → **Email Templates**
2. Customize the email templates for:
   - Confirm signup
   - Reset password
   - Magic Link (if you want to use it)

## Step 6: Test Your Authentication

1. Make sure your `.env` file is configured correctly
2. Restart your development server:
   ```bash
   npm start
   ```
3. Try registering a new account
4. Check your email for the confirmation link
5. Click the confirmation link
6. Try logging in with your credentials

## Features Implemented

### ✅ User Registration
- Sign up with email and password
- Username stored in user metadata
- Email confirmation required
- Password minimum 6 characters

### ✅ User Login
- Sign in with email and password
- Persistent sessions
- Error handling for invalid credentials

### ✅ Forgot Password
- Send password reset email
- Custom redirect URL for password reset flow

### ✅ Session Management
- Auto-detects existing sessions on page load
- Stays logged in across page refreshes
- Logout functionality
- Auth state listener for real-time updates

## Security Notes

1. **Never commit your `.env` file** - It contains sensitive credentials
2. The **anon key is safe to use** in the frontend - it's designed to be public
3. Supabase handles all security through Row Level Security (RLS) policies
4. All authentication operations happen over HTTPS

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env` file has the correct values
- Make sure you're using `REACT_APP_` prefix for Create React App
- Restart your development server after changing `.env`

### Email confirmation not arriving
- Check your spam folder
- Verify the email in Supabase dashboard under Authentication → Users
- Check email rate limits in Supabase dashboard

### Can't log in after registration
- Make sure email confirmation is complete
- Check if the user appears in Authentication → Users in Supabase dashboard
- Look for error messages in the browser console

## Next Steps

You can enhance the authentication system with:
- **User profiles**: Create a `profiles` table to store additional user data
- **OAuth providers**: Add Google, GitHub, etc. sign-in options
- **Password reset page**: Create a dedicated page for password reset flow
- **Email verification resend**: Add functionality to resend verification emails
- **Account deletion**: Allow users to delete their accounts

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client Library](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
