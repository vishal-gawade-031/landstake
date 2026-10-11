# LANDSTACK — GIS-BASED INTEGRATED LAND GOVERNANCE PLATFORM

> **ACADEMIC PROTOTYPE NOTICE:**  
> This project is an academic Master of Computer Applications (MCA) final-year demonstration prototype.  
> **DEMO DATA — NOT AN OFFICIAL GOVERNMENT LAND RECORD.**  
> All cadastral polygons, ULPIN identifiers, citizen identities, and mutation logs are synthetic. No government servers or private cadastral repositories are accessed or scraped.

---

## 1. Project Objective & Problem Statement

### Problem Statement
In traditional land record management, critical datasets are disconnected across independent government silos:
- Cadastral survey maps (Tippani / Cadastre) exist in isolated GIS formats.
- Revenue records (RTC / RoR / Mutation) are managed in separate databases.
- Deeds of sale and encumbrances exist in registration registry software.
- Urban development authorities (BUDA, MUDA) issue building permits without automated boundary conflict checks.

This lack of interoperability leads to fraudulent multi-party registrations, encroachment into statutory environmental buffers, and unrecorded mortgages.

### The Land Stack Solution
**LANDSTACK** establishes a **parcel-centric unified architecture** centered around the **Unique Land Parcel Identification Number (ULPIN)**. Every cadastral polygon, ownership succession, bank lien, urban zoning constraint, and revenue dispute binds directly to the ULPIN as the universal single source of truth.

---

## 2. Core Features

1. **Interactive GIS Map Explorer:**
   - 100% Free & Open-Source: Leaflet.js, OpenStreetMap standard tiles, GeoJSON, and Turf.js.
   - Zero paid API keys required.
   - Dynamic vector layer toggles: Parcels, Boundaries, Land Use, Roads, Utilities, Restrictions, and Risk Map Mode.
   - Land use styling: Residential (Sky Blue), Agricultural (Light Green), Commercial (Orange), Industrial (Purple), Institutional (Yellow), Mixed Use (Slate).
   - Instant search by ULPIN, Survey Number, Village, or Owner.
   - Geolocation "My Location" centering.
   - Turf.js spatial analysis tools: Geodesic distance measurement, real-world area calculation (Acres & Guntas), centroid calculation, and polygon overlap detection.

2. **Parcel 360 Master View (`/parcels/[ulpin]`):**
   - 12 comprehensive relational tabs:
     1. Overview (Geometry, coordinates, extent, risk gauge)
     2. Ownership (Registered holders, mutation order numbers, pedigree)
     3. RoR (Record of Rights, cultivators, soil, irrigation source)
     4. Registration (Sub-Registrar deeds, market value, stamp duty)
     5. Encumbrance (Active bank charges, Form 15 non-encumbrance status)
     6. Land Use (Comprehensive Master Plan zoning, Section 95 conversion)
     7. Building Permission (Sanctioned built-up area, floors, authority)
     8. Property Tax (Assessment cycle, paid amounts, outstanding arrears)
     9. Restrictions (Intersecting flood zones, ASI heritage buffers, road reservations)
     10. Utilities (Electricity RR numbers, municipal water, fiber access)
     11. Digitized Documents (RTC extract, survey tippani, deeds)
     12. Audit History (Immutable event timeline)

3. **Public QR Code Verification (`/verify/[ulpin]`):**
   - High-contrast verification certificate with dynamic QR code.
   - Formatted with official academic prototype attestation and print features.

4. **Official Land Card PDF Generator:**
   - Built using `jsPDF` and `QRCode`.
   - Generates downloadable parcel certificates with QR code, survey specs, coordinates, and governance footer.

5. **Potential Data Conflicts & Anomaly Detection (`/admin/fraud-alerts`):**
   - Flags boundary overlaps, cadastral vs GIS area mismatches, ownership conflicts, and registration anomalies.
   - Status tracking: Open -> Under Review -> Resolved -> Dismissed.

6. **Transparent Weighted Risk Engine:**
   - 100-point deterministic weighting system:
     * Area Mismatch: +20 pts
     * Boundary Overlap: +20 pts
     * Ownership Dispute: +25 pts
     * Registration Anomaly: +20 pts
     * Financial Encumbrance: +10 pts
     * Property Tax Arrears: +5 pts
   - Categorized as **LOW (0-25)**, **MEDIUM (26-50)**, **HIGH (51-75)**, or **CRITICAL (76-100)**.
   - Transparently displays "WHY?" breakdown checklist to citizens and officers.
   - AI/ML ready hook structure for prospective Python FastAPI anomaly prediction microservices.

7. **Executive Analytics Dashboard (`/dashboard`):**
   - 8 live summary metric cards.
   - 6 Recharts data visualizations powered by actual database seed records.

8. **Citizen Portal (`/citizen`):**
   - Land search, active application tracking, and self-service requests.

9. **Service Request Pipeline (`/services`):**
   - 8 public service categories with automated ID generation (`REQ-2026-XXXXXX`).
   - 6-stage lifecycle stepper: `SUBMITTED -> UNDER_REVIEW -> DOCUMENT_VERIFICATION -> OFFICER_REVIEW -> APPROVED -> COMPLETED`.

10. **Revenue Dispute Management (`/disputes`):**
    - File appeals regarding boundary encroachment, inheritance, or tax assessments.

11. **Future Satellite Change Detection Demo (`/satellite-ai`):**
    - Interactive before/after optical imagery slider demonstrating automated detection of unauthorized conversion.

12. **Administration Console (`/admin`):**
    - 10 management sections covering parcels, users, GIS layers, departments, and audit logs.

---

## 3. Technology Stack

| Layer | Technologies |
|:---|:---|
| **Frontend Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling & UI** | Tailwind CSS v4, Glassmorphism, Lucide React, Framer Motion |
| **GIS & Geospatial** | Leaflet.js, OpenStreetMap, GeoJSON, Turf.js |
| **Backend API** | Next.js App Router API Routes + Standalone Express.js (TypeScript) |
| **Database & ORM** | Prisma ORM 5.22 (Pre-configured SQLite `dev.db`, MySQL compatible) |
| **Authentication** | JSON Web Tokens (JWT), Bcrypt password hashing, RBAC |
| **PDF & QR Engine** | jsPDF, QRCode |
| **Analytics & Charts** | Recharts Data Visualization Library |

---

## 4. Quick Start & Application Execution

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### Step 1: Install Dependencies
```bash
npm install --legacy-peer-deps
```

### Step 2: Initialize Database & Seed Synthetic Records
```bash
npm run db
```
*Creates the SQLite database (`prisma/dev.db`), pushes the schema, and seeds:*
- 110 Cadastral land parcels across Belagavi, Mysuru, and Dharwad districts
- 3 Demo user accounts with bcrypt hashed credentials
- Linked Ownership records, RoR extracts, Deeds, Encumbrances, Land Use, Building Permits, Taxes, and Utilities
- 8 Service requests, 5 Disputes, 10 Fraud/Conflict alerts, and 6 Audit logs

### Step 3: Run the Application

#### Option A: Full Development Stack (Recommended)
Runs both Next.js frontend (Port 3000) and Express REST API backend (Port 5000) concurrently:
```bash
npm run dev:all
```

#### Option B: Next.js Frontend & API Routes Only
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

#### Option C: Production Build & Start
```bash
npm run build
npm run start
```

#### Option D: Standalone Express.js Backend Server
```bash
npm run backend
```
*Runs standalone Express API on [http://localhost:5000/api](http://localhost:5000/api).*

---

## 5. Recommended IDE / Editor Extensions

For the optimal developer experience in Visual Studio Code or Cursor, install the following extensions:

| Extension Name | Extension ID | Purpose |
|:---|:---|:---|
| **Prisma** | `Prisma.prisma` | Syntax highlighting, formatting, and auto-completion for `schema.prisma` |
| **Tailwind CSS IntelliSense** | `bradlc.vscode-tailwindcss` | Autocomplete for Tailwind CSS classes |
| **ESLint** | `dbaeumer.vscode-eslint` | Integrates ESLint for JavaScript/TypeScript code quality |
| **Prettier - Code formatter** | `esbenp.prettier-vscode` | Consistent code styling and formatting |
| **GeoJSON Viewer** | `jumpinjackie.vscode-geojson` | Preview cadastral GeoJSON polygon geometries directly in the editor |
| **Thunder Client / Postman** | `rangav.vscode-thunder-client` | Lightweight REST API testing client inside the IDE |
| **SQLite Viewer** | `qwtel.sqlite-viewer` | Inspect and query `prisma/dev.db` directly inside VS Code |

To install all recommended extensions via VS Code command line:
```bash
code --install-extension Prisma.prisma
code --install-extension bradlc.vscode-tailwindcss
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension qwtel.sqlite-viewer
```

---

## 6. Automated Testing Suite

The project includes an automated test runner (`test/api.test.ts`) validating end-to-end relational data integrity, multi-member authentication, spatial analytics, risk scoring calculations, and workflow lifecycles.

### Run Tests:
```bash
npm test
```

### Test Coverage (37 Passed, 0 Failed):
1. **Database Connection & Multi-Member Population**: Verifies $\ge$ 100 seeded parcels exist.
2. **Multi-Member Authentication & Bcrypt Verification**:
   - Administrator account (`admin@landstack.demo` / `admin123`) bcrypt hash validation.
   - Revenue Officer account (`officer@landstack.demo` / `officer123`) bcrypt hash validation.
   - Citizen account (`citizen@landstack.demo` / `citizen123`) bcrypt hash validation.
   - Negative test: Rejection of invalid passcodes (`wrongpass`).
3. **JWT Session & RBAC**:
   - Cryptographic signing and decoding of JSON Web Tokens.
   - Role-Based Access Control permitting authorized roles and restricting unauthorized roles.
4. **Parcel 360 Relational Integrity**: Confirms 1-to-many relationship mapping (Ownership, RoR, Registration deed, Land Use, Taxes) for sample parcel `KA-BLG-001-000101`.
5. **Transparent Risk Engine**:
   - Clean parcel returns `Score: 0 (LOW)`.
   - Multi-conflict parcel returns `Score: 100 (CRITICAL)` with complete explainable factor breakdown.
6. **Turf.js Geospatial Analysis**:
   - Real-world polygon geodesic area calculation ($m^2$ and Acres).
   - Centroid calculation and distance measurement ($km$ and meters).
   - Spatial polygon boundary overlap detection.
7. **Service Requests Workflow**: Validates request numbering format (`REQ-2026-XXXXXX`) and database queryability.
8. **Potential Data Conflict Detection**: Verifies detection registry queryability.
9. **Multi-District Cadastre**: Validates coverage across Belagavi, Dharwad, and Mysuru.
10. **GeoJSON Boundary Geometry**: Validates polygon coordinate closure and GeoJSON structure.
11. **Dispute Resolution Pipeline**: Validates dispute statuses within defined workflow enums (`OPEN`, `UNDER_INVESTIGATION`, `RESOLVED`, etc.).
12. **Tamper-Evident Audit Logging**: Validates action and entity change tracking.
13. **Property Tax Assessment**: Validates both Paid and Outstanding (Overdue/Partial) tax states.

---

## 7. Verified Browser Walkthrough

The entire application has been validated via automated browser testing across all primary pages:

| Route | Page | Verified Functionality |
|:---|:---|:---|
| `/login` | **Member Authentication Portal** | 3 member cards (Admin, Revenue Officer, Citizen), 1-click preset sign in, manual login with validation, and secure session generation. |
| Top Navbar | **Global Navigation & Auth** | Real-time user persona indicator, role switcher dropdown, and instant **Log Out** button returning to guest state. |
| `/` | **Interactive GIS Map** | OpenStreetMap tiles, parcel polygons, popups, layer toggles, ULPIN search, and district filter. |
| `/parcels/[ulpin]` | **Parcel 360 Master View** | 12 unified Land Stack tabs, 100-point risk score gauge, dynamic QR generation, and **Tab 11: Digitized Document Downloads** with 5 official PDF extracts (Land Card, RTC Form 16, Cadastral Tippani Map, Registered Sale Deed, Form 15 Non-Encumbrance). |
| `/verify/[ulpin]` | **Public QR Verification** | Cryptographically signed digital land card with public verification badge and **Download Verified Land Card (PDF)** button. |
| `/services` | **Citizen Services & Mutation** | Online application filing for 5 service types, 6-stage lifecycle progress tracker (`REQ-2026-000008`), and **Download Acknowledgment Receipt (PDF)**. |
| `/dashboard` | **Analytics Dashboard** | 8 real-time indicators (110 parcels, 89 verified), land use distribution and district charts. |
| `/disputes` | **Dispute Management** | Dispute submission, hearing schedules, and status tracking. |
| `/admin/fraud-alerts` | **Potential Conflicts** | 10 anomaly alerts, severity badges, and interactive discrepancy review modal. |
| `/satellite-ai` | **Satellite Temporal AI** | 6-stage remote sensing pipeline and interactive 2022 vs 2026 change detection slider. |
| Global Footer | **Unified Sitemaps & Disclaimers** | Complete directory of spatial, administrative, and AI modules with official academic disclaimers. |

---

## 8. Demonstration Accounts & Credentials

| Role | Email | Password | Persona & Authority | Default Workspace |
|:---|:---|:---|:---|:---|
| **Administrator** | `admin@landstack.demo` | `admin123` | Dr. Ramesh Narayan (IAS) — District Collector & Land Settlement Officer | `/admin` |
| **Revenue Officer** | `officer@landstack.demo` | `officer123` | Shri Anand Kulkarni (KAS) — Tahasildar & Executive Magistrate | `/services` |
| **Citizen** | `citizen@landstack.demo` | `citizen123` | Priyanka Patil — Registered Landholder / Khatadar | `/citizen` |

*(Each role can be authenticated via the `/login` portal with 1-click or credentials, or switched seamlessly using the top navigation role switcher).*

---

## 9. Project Documentation Index

- [ARCHITECTURE.md](file:///c:/Users/user/Desktop/Jain_college/anushari_gis/ARCHITECTURE.md) — Comprehensive architectural diagrams & Land Stack concept
- [DATABASE.md](file:///c:/Users/user/Desktop/Jain_college/anushari_gis/DATABASE.md) — Relational schema, Prisma models & MySQL setup
- [GIS.md](file:///c:/Users/user/Desktop/Jain_college/anushari_gis/GIS.md) — GIS layers, Turf.js measurements & OpenStreetMap integration
- [API.md](file:///c:/Users/user/Desktop/Jain_college/anushari_gis/API.md) — Complete REST API reference and payload specifications
- [SECURITY.md](file:///c:/Users/user/Desktop/Jain_college/anushari_gis/SECURITY.md) — RBAC, JWT, Bcrypt, and audit log policies
- [SETUP.md](file:///c:/Users/user/Desktop/Jain_college/anushari_gis/SETUP.md) — Step-by-step developer deployment guide
