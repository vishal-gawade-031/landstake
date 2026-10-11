# LANDSTACK ARCHITECTURE DOCUMENTATION

## 1. System Overview & The Land Stack Concept

LANDSTACK is a parcel-centric integrated land governance platform inspired by the national **Land Stack** open digital public infrastructure architecture.

In traditional land administration, land records are fragmented across siloed departmental applications:
- **Survey Department:** Cadastral Tippani maps and physical field sketches
- **Revenue Department:** Record of Rights, Tenancy and Crops (RTC / Bhoomi) and mutation registers
- **Registration Department:** Deeds of sale, gift, and mortgage (Kaveri / Sub-Registrar)
- **Urban Local Bodies & Town Planning:** Master plans, zoning, building permits, and property tax
- **Banks & Financial Institutions:** Agricultural hypothecation and registered mortgages
- **Judiciary / Revenue Courts:** Title and boundary dispute dockets

**The Land Stack Solution:** Every spatial and administrative asset connects through a single universal primary key: the **Unique Land Parcel Identification Number (ULPIN)**.

```
                         +-----------------------------+
                         |      PARCEL (ULPIN)         |
                         |  e.g. KA-BLG-001-000101     |
                         +--------------+--------------+
                                        |
       +--------------------+-----------+-----------+--------------------+
       |                    |                       |                    |
+------v-------+     +------v-------+        +------v-------+     +------v-------+
| GIS BOUNDARY |     |  OWNERSHIP   |        | REGISTRATION |     |  ENCUMBRANCE |
|   POLYGON    |     |  & RTC / RoR |        | SUB-REGISTRAR|     | BANK MORTGAGE|
+--------------+     +--------------+        +--------------+     +--------------+
       |                    |                       |                    |
+------v-------+     +------v-------+        +------v-------+     +------v-------+
|   LAND USE   |     |   BUILDING   |        | PROPERTY TAX |     | RESTRICTIONS |
| ZONING (CDP) |     |  PERMISSIONS |        | MUNICIPAL DUE|     | BUFFER ZONES |
+--------------+     +--------------+        +--------------+     +--------------+
```

---

## 2. Multi-Tier Technology Stack

```
+-----------------------------------------------------------------------------------+
|                            CITIZEN & OFFICER CLIENTS                              |
|                       Desktop, Tablet, and Mobile Viewports                       |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                               NEXT.JS FRONTEND                                    |
|   - App Router (React 19)                                                         |
|   - Tailwind CSS & Glassmorphism                                                  |
|   - Framer Motion Transitions                                                     |
|   - Lucide React Iconography                                                      |
|   - Client-Side Role-Based Persona Switching (Admin / Officer / Citizen)          |
+-----------------------------------------------------------------------------------+
             |                                                  |
             | Leaflet GIS & GeoJSON                            | REST API Calls
             v                                                  v
+-----------------------------+        +--------------------------------------------+
|        GIS ENGINE           |        |           BACKEND & API LAYER              |
|  - Leaflet.js Dynamic Engine|        |  1. Next.js App Router API Routes (/api/*) |
|  - OpenStreetMap Tile Server|        |  2. Standalone Express.js (Port 5000)      |
|  - GeoJSON Vector Polygons  |        |  - JWT Authentication & Bcrypt             |
|  - Turf.js Geodesic Math    |        |  - Input Validation & Audit Logging        |
|    * Area Measurement       |        +--------------------------------------------+
|    * Geodesic Distance      |                                 |
|    * Centroid Calculation   |                                 v
|    * Boundary Overlap Inter |        +--------------------------------------------+
+-----------------------------+        |        TRANSPARENT RISK ENGINE             |
                                       |  - Deterministic 100-Point Rule Weighting  |
                                       |  - Anomaly & Conflict Explanation Breakdown|
                                       |  - Future Python ML Microservice Bridge    |
                                       +--------------------------------------------+
                                                                |
                                                                v
                                       +--------------------------------------------+
                                       |                 PRISMA ORM                 |
                                       |  - Relational Schema Mapping               |
                                       |  - Type-Safe Parameterized Queries         |
                                       |  - Turnkey SQLite (dev.db) / MySQL Ready   |
                                       +--------------------------------------------+
                                                                |
                                                                v
                                       +--------------------------------------------+
                                       |             RELATIONAL DATABASE            |
                                       |   110 Synthetic Parcels across 3 Districts |
                                       |   (Belagavi, Mysuru, Dharwad)              |
                                       +--------------------------------------------+
```

---

## 3. Spatial GIS Engine

The spatial stack is 100% free and open-source, requiring **zero paid API keys**:
1. **Base Layer:** OpenStreetMap (OSM) standard tiles rendered with proper legal attribution.
2. **Cadastral Vector Layer:** 110 synthetic cadastral polygons stored in GeoJSON format.
3. **Turf.js Spatial Math:**
   - `turf.area`: Calculates real-world geodesic area in square meters, converting to Acres and Guntas.
   - `turf.distance`: Computes geodesic point-to-point distances for measurement tools.
   - `turf.centroid`: Locates the geometric center of irregular survey polygons.
   - `turf.intersect`: Detects overlapping polygon coordinates between contiguous parcels to flag potential spatial boundary conflicts.

---

## 4. AI/ML-Ready Architecture (Future Scope)

The system is designed with an extensible microservices architecture for prospective machine learning extensions:

```
+--------------------+        +--------------------+        +---------------------+
| Next.js Frontend   | -----> | Backend API Layer  | -----> | RiskEngine.ts       |
+--------------------+        +--------------------+        +----------+----------+
                                                                       |
                                                                       v
                                                            +---------------------+
                                                            | Python ML Service   |
                                                            | (FastAPI / PyTorch) |
                                                            +----------+----------+
                                                                       |
                                                                       v
                                                            +---------------------+
                                                            | IsolationForest /   |
                                                            | XGBoost Prediction  |
                                                            +---------------------+
```

In Phase 1 (current), `RiskEngine.ts` uses transparent, explainable deterministic scoring. The hook `queryPythonMlAnomalyService` is structured to seamlessly dispatch payloads to an external ML inference server when `ML_SERVICE_URL` is configured.
