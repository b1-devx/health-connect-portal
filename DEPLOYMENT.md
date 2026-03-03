# WellA App — Vercel + Supabase Deployment Guide

## Overview

This app uses:
- **Frontend**: React + Vite → deployed to Vercel (static)
- **Backend**: Express API → deployed to Vercel (serverless via `api/server.ts`)
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase email/password authentication

---

## Step 1: Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database** and copy the **Connection string** (URI format)
   - It looks like: `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`
3. Go to **Settings → API** and note:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`
   - **JWT Secret** (under JWT Settings) → `SUPABASE_JWT_SECRET`
4. **Disable email confirmation** (required for users to log in immediately)
   - Go to **Authentication → Providers → Email**
   - Turn off **"Confirm email"**
   - Without this, users will get an "Email not confirmed" error when signing in

### Run database migrations

In this Replit project (or locally), set `DATABASE_URL` to your Supabase connection string, then run:

```bash
npm run db:push
```

This creates all required tables in your Supabase database.

---

## Step 2: Vercel Setup

1. Push this code to a GitHub repository
2. Import the repository at [vercel.com](https://vercel.com)
3. Framework preset: **Vite** (Vercel usually detects this automatically)
4. Build settings (already configured in `vercel.json`):
   - Build Command: `vite build && node scripts/bundle-api.mjs`
   - Output Directory: `dist/public`
   - The build script compiles the frontend (Vite) and bundles the Express API into a single serverless-ready CJS file (`api/server.js`)

### Environment Variables to set in Vercel

Go to **Project Settings → Environment Variables** and add:

| Variable | Value | Where to find |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | Supabase → Settings → Database → URI |
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Supabase → Settings → API |
| `SUPABASE_JWT_SECRET` | `your-jwt-secret` | Supabase → Settings → API → JWT Settings |
| `GEMINI_API_KEY` | `AIza...` | [Google AI Studio](https://aistudio.google.com/) |

---

## Step 3: Vercel API Routes

The Express backend is served as a Vercel serverless function via `api/server.ts`.

The `vercel.json` already routes:
- `/api/*` → `api/server.ts` (Express backend)
- All other paths → `index.html` (React SPA)

---

## Step 4: Deploy

1. Push to GitHub
2. Vercel will auto-deploy on every push to `main`
3. Your app will be live at `https://your-project.vercel.app`

---

## Local Development

The Replit environment still works for local development using the Replit PostgreSQL database and the Replit-integrated Gemini AI. No changes needed — just continue using the "Start application" workflow in Replit.
