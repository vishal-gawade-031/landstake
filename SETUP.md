# LANDSTACK QUICK SETUP & EVALUATION GUIDE

## 1. Prerequisites
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **NPM:** v9.0.0 or higher

---

## 2. Quick Start in 3 Commands

### Step 1: Install Dependencies
```bash
npm install --legacy-peer-deps
```

### Step 2: Push Database Schema & Seed Synthetic Datasets
```bash
npm run db
```
*This initializes the database (`dev.db`), generates the Prisma Client, and seeds 110 parcels across Belagavi, Mysuru, and Dharwad districts along with all relational records.*

### Step 3: Start the Application
To start the Next.js frontend application (with embedded full API routes):
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 3. Running Standalone Express.js Backend Server

If you wish to demonstrate the separate Express.js TypeScript backend server on port 5000:
```bash
npm run backend
```
*Express REST API will be active at [http://localhost:5000/api](http://localhost:5000/api).*

To run both Next.js and Express concurrently in a single terminal:
```bash
npm run dev:all
```

---

## 4. Run Automated Test Suite

To run all unit and relational integration tests:
```bash
npm run test
```

---

## 5. Demo Accounts

| Persona | Email | Password | Department / Role |
|:---|:---|:---|:---|
| **Administrator** | `admin@landstack.demo` | `admin123` | Revenue & Land Records Secretariat (IAS) |
| **Revenue Officer** | `officer@landstack.demo` | `officer123` | Taluk Revenue Officer & Cadastral Cell (KAS) |
| **Citizen** | `citizen@landstack.demo` | `citizen123` | Registered Citizen (Priyanka Patil) |

*You can also switch personas dynamically using the active profile dropdown in the top navigation bar.*
