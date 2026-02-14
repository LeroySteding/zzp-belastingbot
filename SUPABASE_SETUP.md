# Supabase Setup Guide

This guide will walk you through setting up the Supabase backend for ZZP Tax App.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- The ZZP Tax App code (this repository)

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Choose your organization
4. Project settings:
   - **Name**: `zzp-tax-app` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Europe (Netherlands) - for GDPR compliance
   - **Pricing plan**: Free tier is fine for development

5. Wait for the project to initialize (1-2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll need these values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) ⚠️ Keep this secret!

## Step 3: Configure Environment Variables

### Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### Vercel Production

1. Go to https://vercel.com/dashboard
2. Select your project: `zzp-tax-app`
3. Go to **Settings** → **Environment Variables**
4. Add these variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = your service role key (mark as **Secret**)

5. Redeploy your app for changes to take effect

## Step 4: Run Database Migrations

You need to create the database tables. There are two ways to do this:

### Option A: Supabase SQL Editor (Recommended)

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the contents of `supabase/migrations/20240101000000_initial_schema.sql`
4. Paste and click "Run"
5. Repeat for `supabase/migrations/20240102000000_add_waitlist.sql`

### Option B: Supabase CLI (Advanced)

If you have the Supabase CLI installed:

```bash
# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Step 5: Verify Setup

### Test the Waitlist API

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to http://localhost:3000
3. Try subscribing to the waitlist with your email
4. Check in Supabase dashboard → **Table Editor** → `waitlist` table

### Check Tables

In Supabase **Table Editor**, you should see these tables:
- ✅ `profiles`
- ✅ `expenses`
- ✅ `btw_reports`
- ✅ `waitlist`

### Check Row Level Security (RLS)

In Supabase **Authentication** → **Policies**, verify:
- All tables have RLS enabled (🔒 icon)
- Policies are created for user access
- Waitlist has public insert policy (anyone can subscribe)

## Step 6: Test Authentication (Optional)

The main app features require authentication:

1. In Supabase dashboard → **Authentication** → **Providers**
2. Enable **Email** provider (enabled by default)
3. Configure email templates (optional)
4. Test by signing up at `/signup`

## Troubleshooting

### "Failed to fetch" or API errors

- ✅ Check `.env.local` has correct values
- ✅ Restart Next.js dev server after changing `.env.local`
- ✅ In production, redeploy after adding Vercel environment variables

### "relation 'waitlist' does not exist"

- ✅ Run the migrations (Step 4)
- ✅ Check in Supabase **Table Editor** that tables exist

### "JWT expired" or auth errors

- ✅ Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- ✅ Make sure you're using the **anon** key, not the service role key for frontend

### RLS policy errors

- ✅ For waitlist, make sure the public insert policy exists
- ✅ For other tables, users must be authenticated

## Next Steps

Once setup is complete:

1. ✅ Test the landing page waitlist form
2. ✅ Deploy to Vercel (auto-deploys from GitHub)
3. ✅ Monitor Supabase logs for errors
4. 🚀 Ready for production!

## Security Checklist

- ⚠️ **Never** commit `.env.local` to git (it's in `.gitignore`)
- ⚠️ **Never** expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code
- ✅ RLS is enabled on all tables
- ✅ Policies restrict access to own data
- ✅ Use `NEXT_PUBLIC_*` prefix only for safe client-side variables

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Next.js Docs: https://nextjs.org/docs

---

**Need help?** Open an issue on GitHub or contact support@zzptax.nl
