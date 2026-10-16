# Seva Sathi — Production & Local Deployment Guide

This guide covers setup, environment configuration, database migration execution, local development, background scheduler setup, and production deployment across Supabase, Vercel, and Docker.

---

## 1. System Requirements

- **Node.js**: v18.0.0 or higher (v20+ LTS recommended)
- **Package Manager**: `npm` (v9+) or `pnpm` (v8+)
- **Database**: PostgreSQL 15+ or managed Supabase instance
- **Modern Browser**: Chrome 110+, Edge 110+, Firefox 115+, or Safari 16.4+ (Web Audio & Speech APIs required for voice features)

---

## 2. Environment Variables Configuration

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

### Environment Variable Reference

| Variable | Required | Default / Format | Description |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Yes | `https://xyzcompany.supabase.co` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | `eyJhbGciOi...` | Supabase Public Anonymous API Key |
| `GROQ_API_KEY` | Optional | `gsk_...` | Groq Cloud API Key for LLaMA-3.3 70B AI Assistant (`/api/ai/groq`). If omitted, deterministic live-data fallback is used. |
| `TELEGRAM_BOT_TOKEN` | Optional | `123456:ABC-DEF...` | Telegram Bot token for emergency broadcast dispatches |
| `TELEGRAM_CHANNEL_ID` | Optional | `@sevasathi_alerts` | Default channel or chat ID for broadcast alerts |
| `SMS_GATEWAY_API_KEY` | Optional | `sms_live_...` | SMS gateway provider API key (Twilio / Fast2SMS / MSG91) |
| `PORT` | Optional | `5173` | Local server port |

> **Security Note:** `GROQ_API_KEY`, `TELEGRAM_BOT_TOKEN`, and `SMS_GATEWAY_API_KEY` are server-side environment variables and are **never** prefixed with `VITE_`, preventing them from being bundled into client-side JavaScript.

---

## 3. Database Setup & Migrations

### A. Applying Migrations via Supabase CLI

If you use the Supabase CLI:

```bash
# Login to Supabase
supabase login

# Link your local project to your remote Supabase instance
supabase link --project-ref <your-project-ref>

# Apply pending migrations
supabase db push
```

### B. Applying Migrations via Supabase SQL Editor

In the Supabase Dashboard:
1. Navigate to **SQL Editor** -> **New Query**.
2. Run the existing base schema migrations if starting fresh (`supabase/migrations/` in order).
3. Execute the Seva Sathi feature migration:
   - File: `supabase/migrations/20261016_sevasathi_campaigns_and_radius.sql`
   - This migration creates:
     - `campaigns` table with GPS coordinates, slots, and live status.
     - `campaign_registrations` table with waitlist rankings and QR check-in status.
     - `campaign_announcements` audit table for multi-channel dispatches.
     - `scheduled_job_executions` idempotency control table.
     - `check_in_campaign_donor` atomic database RPC with row locking (`FOR UPDATE`) to prevent duplicate entry scans.
     - RLS policies and performance indices on geospatial coordinates and dates.

---

## 4. Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Development Server

```bash
npm run dev
```

The Vite dev server will launch at `http://localhost:5173` with the integrated `/api/ai/groq` server middleware active.

### 3. Role-Based Portals Access

Seva Sathi includes 5 integrated role portals accessible from the navigation or demo identity switcher:

- **System Admin**: `/admin/command-center`
- **Hospital Portal**: `/hospital/dashboard`, `/hospital/requests`, `/hospital/network`
- **Blood Bank Portal**: `/blood-bank/dashboard`
- **NGO / Campaign Portal**: `/ngo/campaigns`, `/campaigns`
- **Donor Hub**: `/donor/portal`

---

## 5. Background Scheduler Configuration

### 18-Hour Expiry Alert Engine

The Near-Expiry Alert Engine (`src/services/nearExpiryService.ts`) runs scheduled scans to identify inventory units expiring within 18 hours, suppressing duplicate alerts and calculating cold-chain transit feasibility.

#### Supabase `pg_cron` (Recommended for Cloud):

Enable the `pg_cron` extension in the Supabase Dashboard and configure the scheduled job:

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Run the expiry scan every 30 minutes
SELECT cron.schedule(
    'sevasathi-18h-expiry-scan',
    '*/30 * * * *',
    $$
    SELECT public.run_scheduled_expiry_scan();
    $$
);
```

#### GitHub Actions / Cloudflare Worker Cron (Alternative):

You can invoke the scheduler endpoint or run a background worker script every 30 minutes:

```yaml
# .github/workflows/expiry-scheduler.yml
name: Expiry Alert Scheduler
on:
  schedule:
    - cron: '*/30 * * * *'
jobs:
  run-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Scan
        run: |
          curl -X POST https://your-sevasathi-domain.com/api/scheduler/expiry-scan \
            -H "Authorization: Bearer ${{ secrets.SCHEDULER_SECRET }}"
```

---

## 6. Running Tests & Quality Verification

Run the comprehensive Vitest test suite covering all 15 scenarios (Blood compatibility, progressive radius 20/40/60km, 18h alert engine, QR check-in idempotency, Holt forecasting, Groq tool calls, etc.):

```bash
# Run unit & integration tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# TypeScript typecheck
npm run lint # or npx tsc -b
```

---

## 7. Production Deployment

### Option A: Vercel Deployment

1. **Connect Repository**: Import the project repository into [Vercel](https://vercel.com).
2. **Framework Preset**: Select **Vite**.
3. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. **Environment Variables**: Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GROQ_API_KEY`, etc.
5. **Serverless Functions**: For `/api/ai/groq` in production, deploy the server handler as a Vercel Serverless Function under `api/ai/groq.ts` or route to your Node backend.

### Option B: Docker Container Deployment

Create a production Docker image:

```dockerfile
# Multi-stage Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY vite.config.ts ./
EXPOSE 3000
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
```

Build and run:

```bash
docker build -t sevasathi:latest .
docker run -p 3000:3000 --env-file .env sevasathi:latest
```

---

## 8. Post-Deployment Verification Checklist

- [ ] Supabase connection is active (`VITE_SUPABASE_URL` responds).
- [ ] Database migration `20261016_sevasathi_campaigns_and_radius.sql` applied.
- [ ] Admin, Hospital, Blood Bank, NGO, and Donor demo credentials authenticate smoothly.
- [ ] Geospatial Facility Map displays hospitals and blood banks with accurate distance rings (20km/40km/60km).
- [ ] Emergency Request matching executes progressive radius fallback correctly.
- [ ] NGO Campaign RSVP generates unique QR codes, and QR scanning validates check-in idempotently.
- [ ] AI Assistant widget opens, accepts text/voice queries, and returns live inventory data.
- [ ] Near-Expiry engine flags inventory < 18 hours with cold-chain transit rankings.
