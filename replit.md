# WellA App - Healthcare Portal

## Overview

WellA is a modern healthcare portal that connects patients with doctors. It provides a comprehensive platform for managing medical appointments, lab results, prescriptions, and patient-doctor communication. The app features role-based access (doctor vs. patient), real-time messaging, AI-powered request analysis via Google Gemini, and Google Meet link generation for virtual consultations.

Key features:
- Role-based dashboard (doctor vs. patient views)
- Appointment scheduling with virtual meeting links and lab file upload (PDF/image, 15 MB)
- Lab result upload and management (file upload, Gemini AI analysis)
- Prescription management: doctors issue, patients view; full prescription document view with clinic letterhead, logo, and digital signature
- Patient request system with AI analysis
- Direct messaging between doctors and patients (file attachments)
- Onboarding flow for new users (multi-step, profile photo required)
- Doctors directory for patients (/doctors page)
- Profile Settings page (/settings) for all users to edit personal info, and role-specific: doctors can set clinic address, phone, logo, and digital signature for prescriptions

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React with TypeScript, bundled via Vite
- **Routing**: Wouter (lightweight client-side routing)
- **State/Data**: TanStack React Query for server state, with polling for real-time messages (3s interval)
- **UI Components**: Shadcn UI (New York style) built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (medical teal theme)
- **Fonts**: DM Sans (body), Outfit (display/headings)
- **Form Handling**: React Hook Form with Zod resolvers

**Key Pages**:
- `LandingPage` - Public marketing page with login CTA
- `Onboarding` - Role selection (doctor/patient) on first login
- `Dashboard` - Role-aware overview
- `Appointments` - Booking and managing appointments
- `LabResults` - Upload/view test results
- `Prescriptions` - Issue (doctor) or view (patient) prescriptions
- `Requests` - Patient requests with AI analysis feature
- `Messages` - Simple polling-based chat between users
- `Patients` - Doctor-only patient directory

**Auth Flow**: Unauthenticated users see the landing page → login via Replit Auth → if no profile exists, redirect to Onboarding → then to Dashboard.

### Backend Architecture

- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Style**: REST, JSON responses
- **Validation**: Zod schemas shared between frontend and backend via `shared/routes.ts`
- **Session**: PostgreSQL-backed sessions via `connect-pg-simple` + `express-session`
- **Auth**: Replit OIDC authentication (OpenID Connect via `openid-client` + Passport.js)

**Route Organization**:
- `server/routes.ts` - Main application routes (profiles, appointments, lab results, prescriptions, requests, messages)
- `server/replit_integrations/auth/` - Replit Auth setup, middleware, user storage
- `server/replit_integrations/chat/` - AI chat conversation routes
- `server/replit_integrations/image/` - AI image generation routes
- `server/replit_integrations/batch/` - Batch processing utilities for Gemini

**Storage Pattern**: A `storage.ts` interface (`IStorage`) abstracts all DB operations, using Drizzle ORM queries underneath.

### Data Storage

- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-Zod validation
- **Migrations**: Located in `./migrations/`, managed via `drizzle-kit push`

**Schema Tables** (in `shared/schema.ts` and `shared/models/`):
- `users` - Core user accounts (managed by Replit Auth)
- `sessions` - Session storage (required for Replit Auth, do not drop)
- `profiles` - Extended user info: role (doctor/patient), specialty, medical history, DOB
- `appointments` - Patient-doctor appointments with status, datetime, meet link
- `lab_results` - Medical test results with optional file URL
- `prescriptions` - Doctor-issued prescriptions
- `patient_requests` - Patient requests (referrals, prescriptions, etc.) with optional AI analysis
- `messages` - Direct messages between users
- `conversations` + `messages` (in `shared/models/chat.ts`) - AI chat conversation storage

**Important**: The `sessions` and `users` tables in `shared/models/auth.ts` are mandatory for Replit Auth and must not be dropped.

### Authentication & Authorization

- **Provider**: Replit OpenID Connect (OIDC)
- **Login URL**: `/api/login` (redirects to Replit auth)
- **Logout URL**: `/api/logout`
- **Session Storage**: PostgreSQL (`sessions` table)
- **Middleware**: `isAuthenticated` middleware guards all `/api/*` routes
- **User Identity**: `req.user.claims.sub` is the user ID string (varchar)
- **Role Authorization**: Role-based access (doctor vs. patient) enforced at route level using the `profiles` table

### Shared Code

The `shared/` directory is used by both frontend and backend:
- `shared/schema.ts` - All Drizzle table definitions + Zod insert schemas
- `shared/models/auth.ts` - Auth-specific tables (users, sessions)
- `shared/models/chat.ts` - Chat-specific tables
- `shared/routes.ts` - Typed API route definitions with path, method, input/response schemas

This allows the frontend hooks to reference typed API paths directly from `@shared/routes`.

## External Dependencies

### AI / Gemini
- **Package**: `@google/genai`
- **Provider**: Replit AI Integrations (proxied Gemini access, no personal API key needed)
- **Env Vars**: `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL`
- **Usage**:
  - Patient request analysis (summarize/analyze lab results and request descriptions)
  - AI chat conversations (`/api/conversations`)
  - Image generation (`/api/generate-image`)
- **Models**: `gemini-2.5-flash` (fast), `gemini-2.5-pro` (reasoning), `gemini-2.5-flash-image` (images)
- **Note**: Always set `httpOptions: { apiVersion: "", baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL }` when using Replit AI Integrations

### Database
- **Provider**: PostgreSQL (via `DATABASE_URL` env var)
- **Package**: `pg` (node-postgres)
- **Session Store**: `connect-pg-simple`

### Authentication
- **Provider**: Replit OIDC
- **Packages**: `openid-client`, `passport`, `passport-local`
- **Env Vars**: `ISSUER_URL` (defaults to `https://replit.com/oidc`), `REPL_ID`, `SESSION_SECRET`

### Virtual Meetings
- Google Meet links are generated programmatically (random string format, e.g., `https://meet.google.com/xxx-xxxx-xxx`) — no Google API integration required.

### Build
- **Client**: Vite → outputs to `dist/public/`
- **Server**: esbuild → outputs to `dist/index.cjs`
- **Dev**: `tsx` for TypeScript execution in development

### Replit-Specific Plugins (dev only)
- `@replit/vite-plugin-runtime-error-modal`
- `@replit/vite-plugin-cartographer`
- `@replit/vite-plugin-dev-banner`