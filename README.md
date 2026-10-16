# Seva-Sathi

> **AI-Powered Centralized Real-Time Blood Inventory & Donor Engagement Platform**

Seva-Sathi is a next-generation real-time platform designed to coordinate **hospitals, blood banks, and verified donor networks** during blood emergencies.

Instead of simply helping users find a blood donor or check blood availability, Seva-Sathi acts as an **intelligent orchestration layer** that determines how an emergency blood requirement can be fulfilled using available inventory first and donor mobilisation when a shortage remains.

---

## Problem Statement

Blood shortages can occur even when blood is available elsewhere because information about **inventory, location, expiry, emergency demand, and donor availability** is fragmented.

The PS-01 challenge requires a platform that connects blood banks, hospitals and donors, tracks blood-group inventory with expiry alerts, matches emergency requests based on compatibility and distance, handles competing requests for scarce units, and provides donor verification and fraud prevention. Hackathon_Problem_Statements_Pr…

### Existing challenges

- Hospitals may need to contact multiple sources during an emergency.
- Blood availability can be distributed across different locations.
- Expiring inventory needs to be prioritised appropriately.
- A single blood unit may be requested by multiple hospitals.
- Donor mobilisation is often separated from blood-inventory management.
- Emergency donor communication can become manual and inefficient.
- Decision-makers need to understand **why** a particular source was recommended.

---

# Our Solution

**BloodLink AI** connects the entire emergency fulfilment workflow:

```text
Hospital Emergency Request
          ↓
   AI Request Analysis
          ↓
Blood Compatibility Check
          ↓
Inventory + Donor Discovery
          ↓
Smart Allocation Engine
          ↓
 ┌────────┴────────┐
 │                 │
Sufficient       Shortage
Supply             │
 │                 ↓
 ↓          Donor Mobilisation
Allocate            │
 │                  ↓
 └────────┬─────────┘
          ↓
   Reservation Engine
          ↓
      Fulfilment
```

The system first evaluates available authorised blood-bank inventory. If the requirement cannot be completely fulfilled, it activates the donor mobilisation layer for the remaining shortage.

---

# Core USP

## **Intelligent Blood Fulfilment Orchestration**

BloodLink AI does not simply answer:

> "Where can I find blood?"

It answers:

> **"What is the most practical way to fulfil this emergency requirement using the available supply network?"**

The platform considers multiple factors such as:

- Blood-group compatibility
- Available quantity
- Distance
- Emergency priority
- Inventory expiry
- Ability to fulfil the complete requirement
- Donor availability
- Communication consent
- Donor response likelihood

The final recommendation is accompanied by an **explanation of why the source was selected**.

---

# Key Features

## 1. Hospital Emergency Request

Hospitals can create emergency requests containing:

- Hospital
- Blood group
- Required units
- Urgency
- Location
- Request status

Example:

```text
CRITICAL REQUEST

Blood Group: O+
Units Required: 3
Hospital: XYZ Hospital
Urgency: Critical

[Find Blood]
```

---

## 2. Real-Time Blood Inventory

Blood banks can manage:

- Blood groups
- Available units
- Location
- Expiry dates
- Low-stock status
- Critical-stock alerts
- Reserved units
- Available units

Example:

```text
Blood Group    Units    Status
--------------------------------
A+              18      Healthy
A-               3      Low
B+              24      Healthy
O+               2      Critical
O-               1      Critical
```

---

## 3. Intelligent Matching Engine

The matching engine evaluates multiple sources rather than simply selecting the nearest source.

```text
Match Score
    │
    ├── Compatibility
    ├── Availability
    ├── Distance
    ├── Urgency
    ├── Expiry
    └── Fulfilment Capacity
```

Example:

```text
Recommended: Blood Bank A

✓ Compatible requirement
✓ 2 units available
✓ 3.2 km away
✓ Can fulfil part of the request
✓ Units approaching expiry
✓ Critical request
```

> The platform is intended for coordination and decision support; clinical transfusion and donor-eligibility decisions remain with authorised medical professionals and institutions.

---

# 4. Inventory-to-Donor Cascade

One of the main differentiators of BloodLink AI.

Instead of immediately contacting a large number of donors:

```text
Emergency Request
       ↓
Check Blood Inventory
       ↓
Can inventory fulfil request?
     /       \
   YES        NO
    ↓          ↓
 Allocate   Calculate shortage
               ↓
       Activate donor network
               ↓
        Notify suitable donors
```

### Example

```text
Required: 3 O− units

Blood Bank A → 1 unit
Blood Bank B → 1 unit

Remaining shortage → 1 unit

        ↓

Activate verified donor network
        ↓
Find suitable nearby donors
```

This connects **blood inventory management and donor mobilisation** into one workflow.

---

# 5. Last-Unit Protection

BloodLink AI protects scarce inventory when multiple hospitals request the same unit.

```text
Available O+ = 1

Hospital A → Request
       ↓
     RESERVE
       ↓
Available = 0

Hospital B → Request
       ↓
UNIT UNAVAILABLE
```

This prevents the same physical inventory from being simultaneously allocated to multiple requests.

---

# 6. Donor Mobilisation

When available inventory is insufficient, BloodLink AI can identify suitable donors based on factors such as:

- Blood group
- Availability
- Distance
- Communication consent
- Previous response behaviour
- Urgency

Example:

```text
O− shortage: 2 units

Potential donors:

Donor A
2.4 km
Available
High response probability

Donor B
4.1 km
Available
Low response probability

Donor C
5.2 km
Available
High response probability
```

The system can prioritise outreach accordingly.

---

# 7. Personalised Emergency Communication

Instead of sending one generic message to everyone, the platform generates communication based on:

- Emergency severity
- Communication stage
- Preferred language
- Confirmation status
- Previous response
- Time remaining
- Consent

Example:

> **Critical Blood Requirement**  
> A nearby hospital urgently requires O− blood. If you are currently available and authorised to donate, please respond through the platform.

---

# 8. Consent-Aware Communication

The platform distinguishes between:

- Consent for the current emergency/drive
- Consent for future communication

A withdrawn consent should immediately prevent future non-permitted communication.

---

# 9. Explainable Recommendations

Every allocation recommendation provides a reason.

```text
WHY THIS SOURCE?

✓ Compatible requirement
✓ Sufficient available quantity
✓ Within operational distance
✓ Appropriate urgency priority
✓ Can fulfil complete requirement
✓ Inventory considered for expiry
```

This makes the decision process transparent rather than presenting an unexplained AI score.

---

# 10. Emergency Supply Dashboard

The central dashboard provides an overview of the blood network.

```text
┌─────────────────────────────────────┐
│        BLOODLINK COMMAND CENTRE     │
├─────────────────────────────────────┤
│ Active Emergencies             04   │
│ Critical Requests              02   │
│ Available Units               127   │
│ Low-Stock Groups                03   │
│ Available Donors               42   │
│ Requests Fulfilled              18   │
└─────────────────────────────────────┘
```

### Map view

The platform can visualise:

- Hospitals
- Blood banks
- Blood availability
- Emergency requests
- Donor availability
- Critical shortage zones

---

# 11. Shortage Prediction

An optional AI layer can analyse simulated/historical data to identify potential future shortages.

Example:

```text
O−

Current Supply: 7 units
Expected Demand: 14 units

⚠ SHORTAGE RISK

Potential shortage within 72 hours

Recommended Action:
Begin donor mobilisation
```

For the hackathon prototype, this can be demonstrated using a prepared dataset rather than claiming production-grade forecasting.

---

# Technology Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- MapLibre / Leaflet
- Responsive dashboard UI

### Backend

- Python
- FastAPI
- REST APIs

### Database

- PostgreSQL / Supabase

### AI

- Groq API
- Llama-based LLM
- AI-assisted request extraction
- Personalised communication
- Explainable recommendations
- Optional shortage prediction

### Maps & Location

- OpenStreetMap
- MapLibre / Leaflet
- Distance-based matching

### Authentication

- Role-based authentication
- Hospital
- Blood Bank
- Donor
- Administrator

---

# System Architecture

```text
                         BLOODLINK AI
                              │
                ┌─────────────┴─────────────┐
                │                           │
          HOSPITAL SIDE                SUPPLY SIDE
                │                           │
        Emergency Request          ┌────────┴────────┐
                │                  │                 │
                ▼              Blood Banks       Donors
        Request Extraction         │                 │
                │                  │                 │
                └────────────┬─────┴─────────────────┘
                             │
                             ▼
                    INTELLIGENCE LAYER
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        Compatibility     Distance        Urgency
              │              │              │
              └──────────────┼──────────────┘
                             │
                             ▼
                    ALLOCATION ENGINE
                             │
                             ▼
                  RESERVATION / LOCKING
                             │
                             ▼
                       FULFILMENT
                             │
                             ▼
                  DONOR MOBILISATION
```

---

# User Roles

## Hospital

- Create emergency request
- Track request status
- View recommended sources
- View fulfilment progress
- Receive updates

## Blood Bank

- Manage inventory
- Update availability
- Track expiry
- Accept/reserve requests
- View emergency demand

## Donor

- Create/manage profile
- Provide availability
- Manage communication consent
- Receive emergency requests
- Respond to requests

## Administrator

- Manage users
- Verify organisations/donors
- Monitor network
- View audit logs
- Detect suspicious activity

---

# Innovation Highlights

| Innovation | What it does |
|---|---|
| **Intelligent Blood Fulfilment** | Determines how an emergency requirement can be fulfilled |
| **Inventory-to-Donor Cascade** | Uses available inventory first, then activates donors for shortages |
| **Multi-Factor Allocation** | Considers distance, availability, urgency, expiry and fulfilment capacity |
| **Last-Unit Protection** | Prevents competing requests from allocating the same scarce unit |
| **Explainable AI** | Shows why a source or donor was recommended |
| **Predictive Mobilisation** | Identifies potential shortages and prepares donor outreach |
| **Personalised Communication** | Generates context-aware emergency messages |
| **Consent-Aware Outreach** | Respects communication permissions |
| **Network Command Centre** | Gives a unified view of demand, supply and donor availability |

---

# How BloodLink AI Differs

The goal is **not** to replace existing blood-bank systems.

Instead, BloodLink AI focuses on the **orchestration layer** between emergency demand and available supply.

```text
Existing ecosystem

Hospital ──→ Search ──→ Blood Bank
                         OR
Hospital ──→ Search ──→ Donor


BloodLink AI

                   ┌── Blood Bank
                   │
Hospital → AI → ───┼── Inventory
                   │
                   └── Donor Network
                         ↓
                   Smart Fulfilment
```

---

# Reuse of Previous Prototype

BloodLink AI builds upon an earlier **Intelligent Blood Donation Mobilisation & Turnout Platform**.

Existing concepts that can be extended include:

- Donor registration
- Personalised communication
- Turnout prediction
- Consent management
- Attendance tracking
- Role-based access
- Audit trails

These capabilities are now integrated into a broader emergency blood-supply workflow.

### Evolution

```text
Previous Prototype
        │
        ▼
Donor Mobilisation
        │
        ▼
Turnout Prediction
        │
        ▼
Personalised Communication
        │
        │
        ▼
      BLOODLINK AI
        │
        ├── Hospital Demand
        ├── Blood Inventory
        ├── Smart Allocation
        ├── Donor Mobilisation
        ├── Reservation
        └── Emergency Fulfilment
```

---

# Hackathon MVP

For the 8-hour prototype, the primary end-to-end flow is:

```text
1. Hospital creates emergency request
             ↓
2. System analyses requirement
             ↓
3. Search blood-bank inventory
             ↓
4. Calculate smart matches
             ↓
5. Recommend allocation
             ↓
6. Reserve available units
             ↓
7. Detect remaining shortage
             ↓
8. Activate donor network
             ↓
9. Send personalised outreach
             ↓
10. Fulfil / update request
```

### Priority Features

- [x] Hospital emergency request
- [x] Blood-bank inventory
- [x] Blood-group matching
- [x] Distance-based matching
- [x] Expiry awareness
- [x] Smart allocation
- [x] Last-unit reservation
- [x] Donor mobilisation
- [x] Personalised communication
- [x] Role-based dashboards
- [x] Explainable recommendations
- [ ] Advanced shortage prediction
- [ ] Advanced fraud/anomaly detection
- [ ] Production integrations

---

# Example Demo Scenario

### Emergency

```text
Hospital: City Hospital
Blood Group: O+
Required: 3 units
Urgency: CRITICAL
```

### Network status

```text
Blood Bank A
O+ → 1 unit
Distance → 2.4 km

Blood Bank B
O+ → 1 unit
Distance → 5.8 km

Nearby verified donors
O+ → 8 available
```

### AI decision

```text
1 unit → Blood Bank A
1 unit → Blood Bank B

Remaining requirement → 1 unit

Activate donor mobilisation
        ↓
Prioritise nearby available donors
        ↓
Send personalised requests
```

### Final status

```text
REQUEST #1042

Required:       3 units
Bank allocation: 2 units
Donor allocation: 1 unit

STATUS: FULFILMENT IN PROGRESS
```

---

# Product Boundary

BloodLink AI is a **coordination and decision-support platform**.

It does **not**:

- Diagnose patients
- Determine medical eligibility for donation
- Perform clinical screening
- Decide clinical transfusion compatibility
- Perform blood collection
- Replace authorised blood-bank personnel
- Maintain clinical medical records

Medical screening, donor eligibility and clinical decisions remain the responsibility of authorised medical professionals and institutions.

---

# Future Scope

- Integration with authorised blood-bank systems
- Real-time hospital/blood-bank APIs
- More advanced demand forecasting
- Regional shortage heatmaps
- Automated emergency escalation
- Verified institutional onboarding
- Advanced fraud/anomaly detection
- Multilingual donor communication
- SMS/WhatsApp communication integrations where authorised
- Mobile applications for donors and hospitals
- Analytics for regional supply-demand planning

---

# Impact

BloodLink AI aims to reduce the friction between:

**Emergency Demand → Available Blood → Donor Mobilisation → Fulfilment**

The central idea is simple:

> **When a hospital needs blood, don't just show a list of donors or blood banks. Orchestrate the available supply network to determine how the requirement can be fulfilled.**

---

## Built For

**Prarambh 2.0 — 8 Hour Hackathon**  
Engineering India Club | YCCE, Nagpur  
**Problem Statement: PS-01 — Centralized Real-Time Blood Inventory & Donor Engagement Platform** Hackathon_Problem_Statements_Pr…

---

## Team

**Team Name:** `[Your Team Name]`

**Members:**
- `[Member 1]`
- `[Member 2]`
- `[Member 3]`
- `[Member 4]`

---

## License

This project is a hackathon prototype intended for demonstration and evaluation purposes.
