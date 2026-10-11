# LANDSTACK SECURITY & GOVERNANCE POLICY

## 1. Authentication & Session Security
- **JWT (JSON Web Tokens):** Standard HS256 signatures with 7-day expiration for stateless authorization.
- **Bcrypt Password Hashing:** Salt rounds = 10. Passwords are never stored in plaintext.
- **Role-Based Access Control (RBAC):**
  * `CITIZEN`: Public searches, parcel verification, application filing, request tracking.
  * `OFFICER`: Processing assigned service requests, field inspections, dispute hearings, conflict resolution.
  * `ADMIN`: Full system administrative privileges, user management, audit surveillance, spatial schema maintenance.

---

## 2. Parameterized Queries & Injection Prevention
- **Prisma ORM Protection:** All database interactions utilize Prisma's strongly typed query compiler. Queries are parameterized at the driver level, eliminating SQL injection vulnerabilities.

---

## 3. Auditing & Non-Repudiation
Every state-mutating action is recorded in the `AuditLog` table with:
- Action type (`LOGIN`, `PARCEL_CREATED`, `SERVICE_STATUS_CHANGED`, `FRAUD_RESOLVED`, etc.)
- User identity and role
- Entity ID and affected ULPIN
- Timestamp and action narrative

---

## 4. Academic Demonstration Disclaimer & Privacy Protection
- All cadastral boundaries, owner names, aadhar numbers, and survey numbers are **100% synthetic**.
- No government servers are scraped or accessed.
- Prominent banners remind users: **"DEMO DATA — NOT AN OFFICIAL GOVERNMENT LAND RECORD"**.
