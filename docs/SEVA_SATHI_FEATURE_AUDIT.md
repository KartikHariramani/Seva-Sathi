# Seva Sathi — Complete Feature Audit & Codebase Inventory
## Map Repair, Telegram Integration & Event Mobilisation Audit

**Document Version:** 2.0.0  
**Audit Date:** 2026-10-15  
**Auditor:** Principal Software Architect & Full-Stack Systems Engineer  
**Repository:** `ps1-gencoders` (Seva Sathi: Intelligent Healthcare Coordination Network)

---

## 1. Executive Summary

A thorough architectural and codebase inspection was conducted across the Seva Sathi repository to diagnose the **black map anomaly**, evaluate **broken Telegram notifications**, and analyze current capabilities for **Intelligent Event Mobilisation**.

The application is built with **React 19, TypeScript 6, Vite 8, and Tailwind CSS 3.4**, with **Supabase (PostgreSQL 15)** as the backend.

### Key Audit Findings:
1. **The "Black Map" Root Cause:** No geographic map tile engine (such as Leaflet or MapLibre) was installed. The previous component (`InteractiveFacilityMap.tsx`) was an SVG coordinate plot on a dark-slate gradient container (`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900`), which rendered as a black rectangle without real OpenStreetMap or CartoDB street/topographical tiles.
2. **The Telegram Integration Failure:** Telegram was only present as a type literal (`'TELEGRAM'`) and mock text string in `DonorPortalPage.tsx`. There was no server-side bot instance, no webhook endpoint, no long-polling process, no cryptographic account linking flow (`/start <token>`), and no callback query processing for two-way interactions.
3. **Event Mobilisation Gaps:** Campaign scheduling lacked granular 30-minute slot capacity enforcement in the database; registrations lacked an end-to-end 6-stage lifecycle (`registered`, `confirmed`, `waitlisted`, `cancelled`, `attended`, `no_show`); no camera-based volunteer QR scanner existed; and live organizer telemetry was partially disconnected from real check-in streams.

---

## 2. Detailed Feature & Gap Inventory

| Feature Area | Current Codebase Implementation | Status | Key Deficiencies / Gaps | Action Required |
|---|---|---|---|---|
| **Geographic Facility Map** | `InteractiveFacilityMap.tsx` | **Broken** (Renders Black) | No tile mapping library; SVG plot on dark gradient; no street/city raster tiles | Replace with `LeafletFacilityMap.tsx` using Leaflet + OpenStreetMap/CartoDB tiles, popups, and light/dark theme support. |
| **Telegram Bot Backend** | Mock strings in `donorService.ts` & `DonorPortalPage.tsx` | **Broken / Missing** | No server endpoints, no token linking (`/start <token>`), no callback query handler, no outbox retry | Implement server middleware `/api/telegram/*`, dual webhook/polling engine, cryptographic tokens, and two-way inline callbacks. |
| **Campaign & Slot Capacity** | `campaignService.ts` (Basic total capacity target) | **Partially Working** | Lacks 30-min slot intervals with individual capacity limits and transactional concurrency locks | Implement `campaign_slots` table, granular slot reservations, and database overbooking prevention. |
| **Registration Lifecycle** | Basic RSVP (`REGISTERED` / `WAITLISTED`) | **Partially Working** | Missing `confirmed`, `cancelled`, `attended`, `no_show` formal state transitions | Implement strict state machine with idempotent transition validation. |
| **Dynamic Waitlist Rebalancing** | Waitlist status assignment in `campaignService.ts` | **Partially Working** | Cancellation does not atomically promote the next candidate or trigger immediate Telegram alert | Build atomic waitlist rebalancing service supporting FIFO and predictive ranking. |
| **Single-Use QR Attendance** | Simulated token check-in in `campaignService.ts` | **Partially Working** | No web camera scanner; manual input only; lacks rich duplicate detection feedback | Implement `VolunteerQRScannerModal.tsx` with camera video decode, atomic single-use lock, and `ALREADY_CHECKED_IN` error. |
| **ML Turnout Prediction** | Basic heuristic formula in `donorTurnoutModel.ts` | **Partially Working** | Not benchmarked against Naive/MA baselines; lacking evaluation on held-out test data | Implement calibrated logistic model + transparently labelled heuristic fallback evaluated against baselines. |
| **Real-Time Organizer Telemetry** | Summary stats in `NGOCampaignsPage.tsx` | **Partially Working** | Predicted turnout not clearly distinguished from actual check-in counts; no hourly arrival density | Build `OrganizerTelemetryPage.tsx` with live telemetry stream, arrival density chart, and activity feed. |
| **Consent & Audit Logging** | Basic boolean toggles in `DonorPortalPage.tsx` | **Partially Working** | Transactional vs promotional consent not segregated; audit records not captured for event mutations | Add segregated consent checks and append-only immutable audit trail in database. |
