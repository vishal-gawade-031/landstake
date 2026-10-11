# LANDSTACK DATABASE SPECIFICATION

## 1. Overview

The LANDSTACK platform uses **Prisma ORM** as its data access layer.

For turnkey, zero-dependency academic evaluation, the repository is pre-configured with **SQLite** (`file:./dev.db`), allowing any evaluator, professor, or developer to run migrations and seeds instantly without installing or configuring external database servers.

The schema is completely standard and relational, and can be switched to **MySQL** in 10 seconds.

---

## 2. Relational Schema Architecture

All land-related records maintain foreign key relations referencing `Parcel.ulpin`:

```
                           +----------------------+
                           |        Parcel        |
                           |  ulpin (PK, String)  |
                           +----------+-----------+
                                      |
       +------------------------------+------------------------------+
       | 1:N                          | 1:N                          | 1:N
+------v-----------+           +------v-----------+           +------v-----------+
| OwnershipRecord  |           |    RorRecord     |           |   Registration   |
| parcelUlpin (FK) |           | parcelUlpin (FK) |           | parcelUlpin (FK) |
+------------------+           +------------------+           +------------------+
       | 1:N                          | 1:N                          | 1:N
+------v-----------+           +------v-----------+           +------v-----------+
|   Encumbrance    |           |     LandUse      |           |BuildingPermission|
| parcelUlpin (FK) |           | parcelUlpin (FK) |           | parcelUlpin (FK) |
+------------------+           +------------------+           +------------------+
       | 1:N                          | 1:N                          | 1:N
+------v-----------+           +------v-----------+           +------v-----------+
|   PropertyTax    |           |   Restriction    |           |     Utility      |
| parcelUlpin (FK) |           | parcelUlpin (FK) |           | parcelUlpin (FK) |
+------------------+           +------------------+           +------------------+
       | 1:N                          | 1:N                          | 1:N
+------v-----------+           +------v-----------+           +------v-----------+
|  ServiceRequest  |           |     Dispute      |           |    FraudAlert    |
| parcelUlpin (FK) |           | parcelUlpin (FK) |           | parcelUlpin (FK) |
+------------------+           +------------------+           +------------------+
```

---

## 3. Detailed Data Models

### 1. `Parcel` (Central Entity)
- `id` (UUID, String, PK)
- `ulpin` (String, Unique) — e.g. `KA-BLG-001-000101`
- `surveyNo` (String) — e.g. `101/A`
- `district` (String) — Belagavi, Mysuru, Dharwad
- `taluk` (String)
- `village` (String)
- `area` (Float) — Recorded cadastral area in Acres
- `gisArea` (Float) — Geodesic polygon area in Acres computed by Turf.js
- `areaDifference` (Float) — Absolute variance
- `landUse` (String) — Residential, Agricultural, Commercial, Industrial, Institutional, Mixed Use
- `status` (String) — VERIFIED, PENDING_VERIFICATION, DISPUTED, RESTRICTED
- `centroidLat` / `centroidLng` (Float)
- `riskScore` (Int: 0 - 100)
- `riskLevel` (String: LOW, MEDIUM, HIGH, CRITICAL)
- `hasBoundaryOverlap` (Boolean)
- `hasAreaMismatch` (Boolean)
- `hasOwnershipConflict` (Boolean)
- `hasRegistrationConflict` (Boolean)
- `hasEncumbrance` (Boolean)
- `hasTaxIssue` (Boolean)

### 2. `OwnershipRecord`
- `id` (UUID, PK)
- `parcelUlpin` (FK -> Parcel.ulpin)
- `ownerName` (String)
- `ownershipType` (String) — Individual, Joint, State Government, Ancestral
- `ownershipStatus` (String) — Verified, Disputed, Pending Mutation
- `rorReference` (String) — e.g. `ROR/KA/BLG/2024/1001`
- `mutationDate` (String)
- `mutationNumber` (String) — e.g. `MUT-MR-2024-10001`
- `sharePercentage` (Float)

### 3. `RorRecord` (Record of Rights, Tenancy & Crops)
- `khataNumber` (String)
- `ownerName` (String)
- `fatherHusbandName` (String)
- `cultivatorName` (String)
- `soilClassification` (String)
- `waterSource` (String)
- `dryWetGarden` (String)
- `liabilities` (String)

### 4. `Registration` (Sub-Registrar Deed)
- `registrationNumber` (String) — e.g. `REG-BLG-2023-5001`
- `documentType` (String) — Absolute Sale Deed, Partition Deed, Gift Deed
- `registrationDate` (String)
- `transactionStatus` (String) — COMPLETED, PENDING, UNDER_SCRUTINY
- `marketValue` / `considerationAmount` / `stampDutyPaid` (Float)
- `previousOwner` / `currentOwner` (String)

### 5. `Encumbrance` & `Mortgage`
- `status` (String) — NONE, ACTIVE, DISCHARGED
- `institution` (String) — Bank Name (SBI, Canara Bank, etc.)
- `amount` (Float)
- `startDate` / `endDate` (String)

### 6. `FraudAlert` (Potential Data Conflict)
- `alertNumber` (String, Unique) — e.g. `ALR-2026-1001`
- `conflictType` (String) — Boundary Overlap, Area Mismatch, Ownership Conflict, Registration Conflict
- `severity` (String) — LOW, MEDIUM, HIGH, CRITICAL
- `reason` (String)
- `status` (String) — OPEN, UNDER_REVIEW, RESOLVED, DISMISSED
- `assignedOfficer` / `remarks` (String)

### 7. `AuditLog`
- `action` (String) — LOGIN, PARCEL_CREATED, FRAUD_REVIEWED, etc.
- `entityType` / `entityId` / `parcelUlpin`
- `performedBy` / `userRole`
- `timestamp` (DateTime)

---

## 4. Switching to MySQL

To connect to a live MySQL instance:
1. Open `.env` and set:
   ```env
   DATABASE_URL="mysql://root:password@localhost:3306/landstack_db"
   ```
2. Open `prisma/schema.prisma` and change:
   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```
3. Run:
   ```bash
   npm run db
   ```
