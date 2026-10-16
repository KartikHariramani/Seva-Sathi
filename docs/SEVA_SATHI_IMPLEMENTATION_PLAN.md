# Seva Sathi — 10-Phase Master Implementation Plan
## Map Repair, Telegram Integration & Intelligent Event Mobilisation

**Document Version:** 2.0.0  
**Date:** 2026-10-15  
**Author:** Principal Software Architect, Senior Full-Stack Engineer & AI/ML Systems Lead  
**Project:** Seva Sathi — Intelligent Healthcare & Blood Emergency Coordination Network

---

## 1. Executive Implementation Overview

This plan operationalizes the 10 sequential phases mandated in the Master Implementation Prompt, establishing clear acceptance criteria, affected files, database entities, and test suites for each phase.

---

## 2. The 10 Implementation Phases

### Phase 1: Repository Audit & Gap Verification
- **Objective:** Complete full inspection of current map, Telegram, event scheduling, and turnout models. Record findings in `docs/SEVA_SATHI_FEATURE_AUDIT.md` and `docs/SEVA_SATHI_INTEGRATION_REPORT.md`.
- **Target Files:**
  - `docs/SEVA_SATHI_FEATURE_AUDIT.md`
  - `docs/SEVA_SATHI_IMPLEMENTATION_PLAN.md`
  - `docs/SEVA_SATHI_INTEGRATION_REPORT.md`
- **Acceptance Criteria:**
  - Root cause of black map documented (missing tile library & dark container).
  - Root cause of broken Telegram documented (missing backend endpoints, bot logic & webhooks).

---

### Phase 2: Black Map Repair & Leaflet Integration
- **Objective:** Implement `LeafletFacilityMap.tsx` using `leaflet` with OpenStreetMap & CartoDB tiles, zoom/pan controls, hospital & blood bank markers, popups, and light/dark theme adaptation.
- **Target Files:**
  - `src/components/network/LeafletFacilityMap.tsx`
  - `src/pages/network/LiveInventoryNetworkPage.tsx`
  - `src/pages/NetworkPage.tsx`
  - `index.html` & `src/index.css` (Leaflet CSS bundle & marker assets)
- **Acceptance Criteria:**
  - Renders genuine geographic map tiles (streets, cities, roads).
  - Markers placed at verified facility coordinates with inventory summary.
  - Interactive popup with last-updated timestamp and details link.
  - Graceful fallback on network/tile failure.

---

### Phase 3: Telegram Integration End-to-End
- **Objective:** Deploy server-side Telegram routes (`/api/telegram/*`), dual-mode engine (webhook in production, long-polling in development), cryptographic linking (`/start <token>`), and outbox delivery.
- **Target Files:**
  - `src/server/telegramServerMiddleware.ts`
  - `src/services/telegramService.ts`
  - `src/pages/donor/DonorPortalPage.tsx`
  - `vite.config.ts`
  - `.env.example`
- **Acceptance Criteria:**
  - `/api/telegram/status` validates bot configuration safely.
  - `/start <token>` performs single-use cryptographic account association.
  - Inline buttons for attendance confirmation and cancellation.
  - Outbox retry with exponential backoff and idempotency keys.

---

### Phase 4: Campaign and Slot Capacity Model
- **Objective:** Introduce structured time-slot capacity (30-minute intervals), transactional overbooking protection, and 6-stage registration lifecycle (`registered`, `confirmed`, `waitlisted`, `cancelled`, `attended`, `no_show`).
- **Target Files:**
  - `supabase/migrations/20261017_sevasathi_event_mobilisation.sql`
  - `src/types/campaign.ts`
  - `src/services/eventMobilisationService.ts`
  - `src/pages/ngo/NGOCampaignsPage.tsx`
- **Acceptance Criteria:**
  - Database enforces slot capacity limits.
  - Concurrency checks prevent overbooking under race conditions.
  - Valid registration state transitions strictly enforced.

---

### Phase 5: Messaging, Reminders & Dynamic Waitlist Rebalancing
- **Objective:** Automated T-3 and T-1 reminders, two-way callback processing, and dynamic waitlist rebalancing under cancellation with FIFO and predictive ranking.
- **Target Files:**
  - `src/services/eventMobilisationService.ts`
  - `src/server/telegramServerMiddleware.ts`
  - `src/components/campaign/CampaignAnnouncementModal.tsx`
- **Acceptance Criteria:**
  - Cancellations trigger atomic slot release and waitlist promotion.
  - Promoted candidates receive immediate Telegram alert.
  - Repeated callback clicks are idempotent.

---

### Phase 6: Single-Use QR Digital Pass & Volunteer Scanner
- **Objective:** Generate cryptographically secure UUIDv4 digital passes; implement camera QR scanner modal and manual lookup desk; enforce atomic single-use check-in.
- **Target Files:**
  - `src/components/campaign/VolunteerQRScannerModal.tsx`
  - `src/pages/donor/DonorPortalPage.tsx`
  - `src/services/eventMobilisationService.ts`
- **Acceptance Criteria:**
  - Valid pass records check-in atomically.
  - Rescanning returns `ALREADY_CHECKED_IN` with previous timestamp.
  - Camera scanner decodes QR in real time with fallback manual ticket input.

---

### Phase 7: ML Turnout Probability Engine
- **Objective:** Calibrated turnout model using lead time, prior attendance, days since last donation, confirmation status, and distance; benchmarked against Naive and Moving Average baselines.
- **Target Files:**
  - `src/intelligence/prediction/donorTurnoutModel.ts`
  - `src/services/__tests__/sevasathi_event_mobilisation.test.ts`
- **Acceptance Criteria:**
  - Turnout probability bounded between `0.0` and `1.0`.
  - Heuristic fallback explicitly labelled.
  - Model evaluated on held-out test data against baseline.

---

### Phase 8: Real-Time Organizer Telemetry
- **Objective:** Real-time organizer dashboard tracking registrations, confirmations, waitlists, predicted vs actual attendance, remaining slot capacity, and recent check-in activity.
- **Target Files:**
  - `src/pages/organizer/OrganizerTelemetryPage.tsx`
  - `src/components/campaign/CampaignTelemetryCard.tsx`
  - `src/sync/localEventBus.ts`
- **Acceptance Criteria:**
  - Clearly distinguishes predicted turnout from actual verified attendees.
  - Updates in real-time when QR check-ins occur.

---

### Phase 9: Consent, Privacy & Append-Only Audit Trail
- **Objective:** Granular consent categories (transactional vs promotional communications), audit log capturing all mutations (cancellations, promotions, check-ins, config changes).
- **Target Files:**
  - `src/services/eventMobilisationService.ts`
  - `src/pages/donor/DonorPortalPage.tsx`
  - `src/pages/admin/AdminAuditLogsPage.tsx`
- **Acceptance Criteria:**
  - Users without promotional consent are omitted from broadcast lists.
  - Immutable audit logs record actor, timestamp, event type, entity ID, and metadata.

---

### Phase 10: Full Integration & 33-Scenario Verification
- **Objective:** Execute comprehensive Vitest test suite validating all 33 scenarios from Section 14, run end-to-end demonstration workflow, and build production bundle.
- **Target Files:**
  - `src/services/__tests__/sevasathi_event_mobilisation.test.ts`
  - `docs/SEVA_SATHI_INTEGRATION_REPORT.md`
- **Acceptance Criteria:**
  - All 33 test scenarios pass.
  - Clean production build (`tsc -b && vite build`).
  - Zero console errors in browser.
