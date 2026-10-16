# Seva Sathi — Map Repair, Telegram Integration & Event Mobilisation Report

**Document Version:** 1.0.0  
**Audit & Integration Date:** 2026-10-15  
**Author:** Principal Software Architect, Senior Full-Stack Engineer & AI/ML Systems Lead  
**Repository:** `ps1-gencoders` (Seva Sathi: Intelligent Healthcare Coordination Network)

---

## 1. Executive Summary & Root Cause Diagnoses

This integration report addresses the three critical imperatives identified in the Seva Sathi platform:
1. **Diagnosis & Repair of the Black Map:** Root cause identified, diagnosed, and resolved using Leaflet with real geographic raster tiles (OpenStreetMap / CartoDB), interactive pins for hospitals and blood banks, zoom/pan controls, and fallback states.
2. **End-to-End Telegram Bot & Two-Way Interaction:** Replacement of disconnected frontend mock strings with a resilient, server-side Telegram Bot framework supporting cryptographic account linking (`/start <token>`), two-way inline callbacks (`Confirm Attendance`, `Cancel Slot`), transactional outbox delivery, and dual-mode operation (Webhook and Polling).
3. **Intelligent Event Mobilisation & Turnout Management System:** Complete capacity-aware campaign and slot scheduling, 6-stage registration lifecycle, ML-driven turnout prediction with evaluated heuristic fallback, dynamic waitlist rebalancing (FIFO and predictive), single-use QR digital passes with atomic check-in verification, live organizer telemetry, and append-only audit logging.

---

## 2. Root Cause Analysis: The "Black Map"

### 2.1 The Symptom
Users navigating to the network map observed a black/dark rectangle rather than a recognizable geographic map of Maharashtra with streets, cities, and topography.

### 2.2 Root Cause Diagnosis
1. **Absence of a Real Tile Mapping Provider:** Inspection of `package.json` revealed that neither `leaflet`, `maplibre-gl`, nor `mapbox-gl` was installed. The previous component (`InteractiveFacilityMap.tsx`) was an SVG canvas rendered over a dark CSS gradient background:
   ```tsx
   <div className="relative w-full h-[480px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ...">
   ```
2. **Missing Raster/Vector Map Tiles:** The SVG drew grid lines (`stroke="rgba(255,255,255,0.05)"`) and static range circles without loading OpenStreetMap or CartoDB tile imagery (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
3. **Dark-Mode CSS Precedence:** The container styles enforced near-pitch-black dark tones without geographic ground context, leaving users with the impression of an unrendered or broken black box.

### 2.3 The Architectural Repair
- **Library Selection:** Installed `leaflet` (v1.9.4) and `@types/leaflet`.
- **Tile Providers:** Configured OpenStreetMap standard tiles (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`) with graceful fallback to CartoDB Voyager / Positron.
- **Visual Presentation:** Clean light/dark adaptive container, real street and topographical labels, customizable facility markers (crimson for blood banks, azure for hospitals), interactive popups showing authorized stock, verification badges, distance, and timestamps.
- **Error Handling & Network Fallback:** Includes tile loading spinners, network timeout detection, offline notice, and fallback to vector/card view if external tile CDNs are unreachable.

---

## 3. Root Cause Analysis: Telegram Notifications

### 3.1 The Symptom
Telegram notifications were completely non-functional. Users who opted into Telegram received no messages, and attempting to link accounts did not work.

### 3.2 Root Cause Diagnosis
1. **No Backend Bot Implementation:** Telegram was only present as a type literal (`CommunicationChannel = 'IN_APP' | 'TELEGRAM' | 'SMS'`) and static text in `DonorPortalPage.tsx` ("Send /start to @RaktSetuBot on Telegram to verify").
2. **Zero Server Endpoints:** No server-side webhook endpoint (`/api/telegram/webhook`) or polling engine existed in the Node/Vite backend.
3. **No Cryptographic Account Linking:** There was no mechanism to associate an authenticated user profile with a specific Telegram `chat_id`.
4. **No Two-Way Callback Handling:** Telegram inline keyboards require a webhook or polling server to receive `callback_query` events and acknowledge them via `answerCallbackQuery`.

### 3.3 The Architectural Repair
- **Server Middleware & API:** Implemented server-side Telegram routes in `src/server/telegramServerMiddleware.ts`:
  - `POST /api/telegram/webhook`: Inbound webhook handler validating Telegram secret token.
  - `POST /api/telegram/link-token`: Generates cryptographically secure, 15-minute, single-use linking tokens (`TGLINK_<hex>`).
  - `POST /api/telegram/send`: Idempotent outbox message dispatcher with retry logic.
  - `GET /api/telegram/status`: Sanitized bot health and configuration diagnostic endpoint.
- **Two-Way Bot Commands & Callbacks:**
  - `/start <linking_token>`: Verifies token, establishes one-to-one user mapping, updates donor profile, and sends welcome message.
  - `/status`: Returns live registration pass, slot details, and QR verification state.
  - `/help`: Displays clinical event navigation instructions.
  - Inline Callbacks: `CONFIRM:<regId>` and `CANCEL:<regId>` with database transaction protection and waitlist promotion triggers.
- **Dual-Mode Engine:** Supports both Webhook mode (production HTTPS) and Long-Polling mode (local dev/preview) with mutual exclusion guards preventing dual-polling conflicts.

---

## 4. Intelligent Event Mobilisation & Turnout System

### 4.1 Schema & Data Integrity
Extended the database schema (`supabase/migrations/20261017_sevasathi_event_mobilisation.sql`):
- `campaign_slots`: Granular 30-minute intervals with explicit capacity targets and registered counts.
- `campaign_registrations`: Comprehensive lifecycle states (`registered`, `confirmed`, `waitlisted`, `cancelled`, `attended`, `no_show`), waitlist rankings, and single-use QR pass tokens.
- `telegram_account_links`: User-to-chat associations with verification timestamps and single-use link tokens.
- `audit_logs`: Append-only immutable log tracking campaign modifications, cancellations, promotions, and check-ins.

### 4.2 ML Turnout Engine
- **Predictive Model:** Calibrated logistic estimator factoring:
  1. Lead time between registration and event start.
  2. Historical registration count & prior attendance percentage.
  3. Days since prior donation (enforcing clinical eligibility window).
  4. Confirmation status (explicit Telegram/in-app RSVP).
  5. Distance between donor location and campaign venue.
- **Evaluation Baseline:** Compared against a Moving Average and Naive baseline. Documented heuristic bounds (`0.0` to `1.0`) ensuring transparency and zero silent cancellations.

### 4.3 Single-Use QR Attendance & Atomic Scanning
- **Token Generation:** Cryptographically unguessable UUIDv4 tokens.
- **Atomic Validation:** Enforced via `check_in_campaign_donor` database transaction. If scanned twice, returns `ALREADY_CHECKED_IN` with the exact previous check-in timestamp.
- **Volunteer Interface:** Web camera live video stream with automatic barcode decode, combined with manual Ticket ID lookup fallback.

---

## 5. Summary of Files Changed & Created

| File | Scope | Description |
|---|---|---|
| `package.json` | Dependencies | Added `leaflet` and `@types/leaflet`. |
| `docs/SEVA_SATHI_INTEGRATION_REPORT.md` | Documentation | This root-cause analysis and integration blueprint. |
| `docs/SEVA_SATHI_FEATURE_AUDIT.md` | Documentation | Updated feature audit including black map and Telegram gaps. |
| `docs/SEVA_SATHI_IMPLEMENTATION_PLAN.md` | Documentation | 10-phase master implementation plan. |
| `src/components/network/LeafletFacilityMap.tsx` | Frontend (Map) | Production Leaflet geographic map with OSM tiles, facility pins, popups, and light/dark theme compatibility. |
| `src/server/telegramServerMiddleware.ts` | Backend (Telegram) | Server-side Telegram Bot handler, webhook/polling, linking token generator, and callback processor. |
| `src/services/telegramService.ts` | Client Service | Frontend interface for account linking deep links, status checks, and notification preferences. |
| `src/services/eventMobilisationService.ts` | Core Domain | Capacity-aware slot scheduling, dynamic waitlist rebalancing, QR pass generation, and audit logging. |
| `src/components/campaign/VolunteerQRScannerModal.tsx` | Frontend (Scanner) | Camera-enabled QR scanner and manual entry check-in triage desk. |
| `src/pages/organizer/OrganizerTelemetryPage.tsx` | Frontend (Telemetry)| Real-time telemetry dashboard showing predicted vs actual turnout, arrival density, and live activity feed. |
| `src/services/__tests__/sevasathi_event_mobilisation.test.ts`| Testing | Vitest suite validating all 33 required scenarios. |
