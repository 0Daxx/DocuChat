# DocuChat - Supabase Setup Guide

## Overview

DocuChat now supports Supabase for authentication and data persistence. This guide will help you set up Supabase and configure the application.

## Prerequisites

- A Supabase account (free tier available at https://supabase.com)
- Node.js and npm installed
- API keys for LLM providers (Groq, Cerebras)

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in project details:
   - Name: `docuchat` (or your preferred name)
   - Database Password: (save this securely)
   - Region: Choose closest to your users
4. Click "Create new project"
5. Wait for project to initialize (takes ~2 minutes)

## Step 2: Get Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

## Step 3: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste it into the SQL Editor
5. Click "Run" (or press Ctrl+Enter)
6. Wait for all tables and policies to be created

### What Gets Created

- **profiles**: User profiles (extends auth.users)
- **user_api_keys**: API keys for LLM providers
- **projects**: Chat projects/folders
- **chat_sessions**: Individual chat conversations
- **chat_messages**: Messages within chats
- **documents**: Uploaded documents
- **document_chunks**: Document text chunks for RAG
- **user_preferences**: User settings and preferences
- **Storage bucket**: For document file storage

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

## Step 4: Get LLM Provider API Keys

### Groq (3 free keys recommended)
1. Go to https://console.groq.com/keys
2. Sign up / Sign in
3. Click "Create API Key"
4. Create 3 keys (for free tier fallback)
5. Copy each key (starts with `gsk_...`)

### Cerebras (3 free keys recommended)
1. Go to https://cloud.cerebras.ai/
2. Sign up / Sign in
3. Navigate to API Keys section
4. Create 3 keys (for free tier fallback)
5. Copy each key (starts with `csk_...`)

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your values:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here

   # Demo Mode (set to false when using Supabase)
   VITE_DEMO_MODE=false

   # Groq API Keys (3 free keys)
   VITE_GROQ_API_KEY_1=gsk_your_first_groq_key
   VITE_GROQ_API_KEY_2=gsk_your_second_groq_key
   VITE_GROQ_API_KEY_3=gsk_your_third_groq_key

   # Cerebras API Keys (3 free keys)
   VITE_CEREBRAS_API_KEY_1=csk_your_first_cerebras_key
   VITE_CEREBRAS_API_KEY_2=csk_your_second_cerebras_key
   VITE_CEREBRAS_API_KEY_3=csk_your_third_cerebras_key

   # Local Provider URLs (optional - have defaults)
   VITE_LMSTUDIO_DEFAULT_URL=http://localhost:1234/v1
   VITE_LLAMACPP_DEFAULT_URL=http://localhost:8080/v1
   ```

## Step 6: Insert Default System API Keys

After creating the database, you need to insert the default system API keys that will be available to all users.

1. In Supabase dashboard, go to **SQL Editor**
2. Run this query (replace with your actual API keys):

```sql
-- Insert default Groq keys (available to all users)
INSERT INTO public.user_api_keys (user_id, provider, name, api_key, is_preferred, is_system_key)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'groq', 'Free Tier Key 1', 'gsk_your_first_groq_key', true, true),
  ('00000000-0000-0000-0000-000000000000', 'groq', 'Free Tier Key 2', 'gsk_your_second_groq_key', false, true),
  ('00000000-0000-0000-0000-000000000000', 'groq', 'Free Tier Key 3', 'gsk_your_third_groq_key', false, true);

-- Insert default Cerebras keys (available to all users)
INSERT INTO public.user_api_keys (user_id, provider, name, api_key, is_preferred, is_system_key)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'cerebras', 'Free Tier Key 1', 'csk_your_first_cerebras_key', true, true),
  ('00000000-0000-0000-0000-000000000000', 'cerebras', 'Free Tier Key 2', 'csk_your_second_cerebras_key', false, true),
  ('00000000-0000-0000-0000-000000000000', 'cerebras', 'Free Tier Key 3', 'csk_your_third_cerebras_key', false, true);
```

**Note**: The `user_id` of `00000000-0000-0000-0000-000000000000` is a special marker for system keys. The application will automatically assign these to new users.

## Step 7: Configure Storage Policies

The schema already includes storage policies, but verify they're working:

1. Go to **Storage** in Supabase dashboard
2. You should see a `documents` bucket
3. The bucket should be private (not public)
4. Policies should allow users to upload/view/delete their own files

## Step 8: Test Authentication

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Go to http://localhost:5173

3. Try signing up with a new account
4. Verify you can sign in/sign out
5. Check that system API keys are automatically added to your account

## Step 9: Verify Data Persistence

1. Create a new chat
2. Send some messages
3. Refresh the page
4. Verify your chat and messages are still there
5. Try creating a project and adding chats to it

## Deployment

### Vercel

1. Push your code to GitHub
2. Go to https://vercel.com and import your repository
3. Add environment variables in Vercel dashboard:
   - All variables from your `.env` file
4. Deploy

### Netlify

1. Push your code to GitHub
2. Go to https://netlify.com and import your repository
3. Add environment variables in Netlify dashboard
4. Deploy

## Troubleshooting

### "Supabase credentials not found"
- Make sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `.env`
- Restart the development server after changing `.env`

### "Failed to load user profile"
- Check that the database schema was created successfully
- Verify RLS policies are enabled on all tables
- Check browser console for detailed errors

### "API keys not working"
- Verify API keys are correctly formatted
- Check that keys have proper permissions in provider dashboards
- Test keys individually in the Settings page

### "Cannot upload documents"
- Verify storage bucket exists
- Check storage policies are configured
- Ensure user is authenticated

## Security Notes

1. **Never commit `.env` to Git** - it's already in `.gitignore`
2. **Use environment variables** for all secrets
3. **RLS is enabled** on all tables - users can only access their own data
4. **API keys are masked** in the UI (only last 4 characters shown)
5. **System keys** are read-only for users
6. **Storage bucket** is private - files are only accessible to owners

## Free Tier Limits

### Supabase Free Tier
- 500 MB database
- 1 GB file storage
- 50,000 monthly active users
- 500 MB bandwidth

### Groq Free Tier
- 30 requests per minute
- 14,400 requests per day
- Rate limits may vary by model

### Cerebras Free Tier
- Check https://cloud.cerebras.ai/ for current limits
- Typically generous for development use

## Support

For issues or questions:
- Check the Supabase documentation: https://supabase.com/docs
- Review the application logs in browser console
- Check Supabase dashboard for database/logs

## Next Steps

After setup is complete:
1. Test all features (chat, projects, documents)
2. Verify API key fallback works
3. Test on multiple devices
4. Deploy to production
5. Monitor usage and costs

---

**Last Updated**: 2026
**Version**: 2.0.0 (Supabase Integration)
