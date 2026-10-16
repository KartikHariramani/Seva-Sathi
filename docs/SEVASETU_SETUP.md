# SevaSetu Environment Configuration & Operational Setup Guide

**Application:** SevaSetu Healthcare Coordination Network  
**Target Environment:** Local Development, Docker Staging, or Cloud Production  
**Document Version:** 2.0 (Updated October 2026)  

---

## 1. Prerequisites

- **Node.js:** v18.18.0 or later (Node 20+ LTS recommended)
- **Package Manager:** `npm` v9+
- **Modern Browser:** Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari (Web Audio API & Web Speech API support enabled)
- **Telegram Account & Bot Token:** (Optional for live Telegram alerts; an automated outbox simulator operates if unconfigured)

---

## 2. Environment Variables Configuration

Create a `.env` file in the project root:

```env
# Application Host & Port
PORT=5174
HOST=0.0.0.0

# Telegram Bot Integration
VITE_TELEGRAM_BOT_TOKEN=8801821912:AAFmoPrvKD6AfpoWigNpBsqZCb5F1KBR8Pw
VITE_TELEGRAM_BOT_USERNAME=sevasathibot
TELEGRAM_BOT_TOKEN=8801821912:AAFmoPrvKD6AfpoWigNpBsqZCb5F1KBR8Pw
TELEGRAM_BOT_USERNAME=sevasathibot

# AI Assistant (Groq Cloud LLaMA-3.3-70B)
VITE_GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_API_KEY=gsk_your_groq_api_key_here

# OpenStreetMap & Map Tiles
VITE_MAP_TILE_PROVIDER=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_MAP_ATTRIBUTION=&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors
```

---

## 3. Telegram BotFather Configuration

To ensure your Telegram Bot is aligned with the **SevaSetu** platform:

1. Open Telegram and search for `@BotFather`.
2. Send `/mybots` and select your bot (`@sevasathibot` or your custom bot handle).
3. **Change Name:** Select **Edit Bot** $\rightarrow$ **Edit Name** $\rightarrow$ Enter `SevaSetu Blood Network Bot`.
4. **Change Description:** Select **Edit Description** $\rightarrow$ Enter:
   > "Official SevaSetu notification spine for urgent blood shortage broadcasts, donation campaign passes, and 18-hour near-expiry alerts."
5. **Set Bot Commands:** Select **Edit Commands** $\rightarrow$ Enter:
   ```text
   start - Connect your SevaSetu account with link token
   status - View your active blood drive registrations & QR passes
   help - Show clinical support and usage instructions
   ```
6. **Webhook vs Polling:** The Vite dev server middleware runs in autonomous long-polling mode. It automatically checks and clears any lingering webhooks to prevent HTTP 409 conflicts.

---

## 4. Running the Application

### Development Mode
```bash
# Install dependencies
npm install

# Start Vite server with autonomous Telegram & AI middlewares
npm run dev
```
The application will launch at:  
👉 **http://localhost:5174/**

### Automated Test Suite
```bash
# Run all 77 automated test scenarios
npx vitest run
```

### Production Build
```bash
# Type-check and compile optimized bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 5. Five Role Credentials & Demo Walkthrough

The login screen (`/login`) provides pre-configured credentials for testing all five roles:

| Role Panel | Demo Email | Target Portal Route | Core Features to Inspect |
|---|---|---|---|
| **Hospital** | `hospital.admin@raktsetu.org` | `/hospital/dashboard` | Emergency requisition (1h deadline), critical shortage buzzer banner, stock table |
| **Blood Bank** | `bloodbank@raktsetu.org` | `/blood-bank/near-expiry` | Near-expiry unit rescue (<18h), batch transfer locks, apheresis records |
| **Admin** | `admin@raktsetu.org` | `/admin/dashboard` | Regional telemetry, facility approvals, audit log ledger, emergency alert governance |
| **NSS Organization**| `nss.coordinator@raktsetu.org` | `/ngo/campaigns` | Donation drive creation, announcement broadcaster, camera QR attendance scanner |
| **Donor** | `donor.rahul@raktsetu.org` | `/donor/portal` | Browse drives, slot booking, cryptographic QR check-in pass, Telegram linking |

---

## 6. Verifying Critical Workflows

### 1. Emergency Blood Request (1-Hour Automatic Deadline)
1. Log in as **Hospital** (`/hospital/dashboard`).
2. Click **Create Blood Request**.
3. Confirm Section 03 ("When & why do you need it?") is omitted from the UI.
4. Select **Emergency** urgency.
5. Verify the banner displays: *"Emergency request: required within 1 hour"*.
6. Submit the form $\rightarrow$ Verify request appears in the active requisitions table with the 1-hour calculated deadline.

### 2. Website Audio Buzzer & Shortage Banner
1. On the Hospital Dashboard, click anywhere or click **Enable Audio** to unlock browser audio.
2. Select any blood group with available units $<15.0$ L or trigger a test alert from `/admin/settings`.
3. Hear the dual-tone synthesizer beep and observe the red floating alert banner.
4. Click **Mute** to silence the audio; verify the state persists.

### 3. Donor Campaign QR Pass & Volunteer Scanner
1. Log in as **Donor** (`/donor/portal`).
2. Click **Register** on an active drive.
3. Open the **Digital Pass** modal $\rightarrow$ View human-readable ticket code and cryptographic QR code.
4. Log in as **NSS Organization** (`/ngo/attendance`) in another window or tab.
5. Enter the ticket code or scan the QR code.
6. Observe instant check-in confirmation; scan again to verify duplicate rejection.
