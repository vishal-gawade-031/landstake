# LANDSTACK GIS & SPATIAL ENGINE SPECIFICATION

## 1. Overview & Principles

LANDSTACK provides an interactive, client-side Geographic Information System (GIS) designed specifically for cadastral land administration.

### Key Requirements Satisfied:
- **100% Free & Open-Source:** Uses Leaflet.js, OpenStreetMap raster tiles, and Turf.js.
- **Zero Paid API Keys:** Does NOT require Google Maps or proprietary map subscriptions.
- **Zero SSR Errors:** Implemented using dynamic client wrappers (`next/dynamic`, `{ ssr: false }`) and browser-only Leaflet instantiation.
- **Official Attribution:** Conforms to OpenStreetMap copyright licensing.

---

## 2. GIS Architecture

```
+-----------------------------------------------------------+
|                    Browser Viewport                       |
|           (Desktop Sidebar / Mobile Drawer)               |
+-----------------------------------------------------------+
                             |
                             v
+-----------------------------------------------------------+
|                     LandMap Component                     |
|           (Client-Side Leaflet Map Instance)              |
+-----------------------------------------------------------+
          |                  |                    |
          v                  v                    v
+------------------+ +------------------+ +-----------------+
|  OSM TileLayer   | | GeoJSON Layers   | | Turf.js Engine  |
|  (Standard Carto)| | - Parcels (110)  | | - Geodesic Area |
|                  | | - Restrictions   | | - Distance Line |
|                  | | - Infrastructure | | - Centroid Calc |
|                  | | - Risk Map Mode  | | - Overlap Check |
+------------------+ +------------------+ +-----------------+
```

---

## 3. Synthetic GeoJSON Datasets

All parcels and zones are strictly synthetic for demo purposes to protect citizen privacy:

1. **`data/geojson/parcels.geojson` (110 Features):**
   - **Belagavi District (45 Parcels):** Centers at `[15.8497, 74.4977]`. Includes simulated boundary overlap between `KA-BLG-001-000105` and `KA-BLG-001-000106` (~12.5 sq.m).
   - **Mysuru District (35 Parcels):** Centers at `[12.2958, 76.6394]`. Includes legal dispute parcels around Chamundi foothills.
   - **Dharwad District (30 Parcels):** Centers at `[15.4589, 75.0078]`. Includes unverified conversion and industrial corridor parcels.

2. **`data/geojson/restrictions.geojson`:**
   - Markandeya River 100m Flood Risk Buffer (Belagavi)
   - Chamundi Hills Eco-Sensitive Heritage Zone (Mysuru)
   - Unkal Lake Catchment Conservation Zone (Dharwad)
   - National Highway 48 Arterial Road Reservation

3. **`data/geojson/infrastructure.geojson`:**
   - 66kV High Tension Power Transmission Corridors
   - Major Arterial Road Networks
   - BRTS Transit Corridors

---

## 4. Land Use Styling Palette

| Land Use Category | Fill Color | Hex Code | Visual Style |
|:---|:---|:---|:---|
| **Residential** | Sky Blue | `#38bdf8` | Clean urban / suburban hue |
| **Agricultural** | Fresh Green | `#4ade80` | High-visibility cropland green |
| **Commercial** | Orange | `#fb923c` | Vibrant arterial commercial |
| **Industrial** | Purple | `#c084fc` | Distinct manufacturing zone |
| **Institutional** | Yellow | `#facc15` | Civic & educational zone |
| **Mixed Use** | Slate Gray | `#94a3b8` | Neutral multi-purpose zone |

---

## 5. Turf.js Geospatial Measurements

LANDSTACK implements mathematical analysis on cadastral geometries using **Turf.js**:

1. **Area Calculation:**
   $$\text{Acres} = \frac{\text{turf.area(polygon)}}{4046.8564224}$$
   The system displays both the Cadastral Recorded Extent and the computed GIS Extent. If difference exceeds $\pm 0.20$ Acres, the system flags **Potential Area Mismatch**.

2. **Distance Measurement:**
   Interactive two-point or multi-point geodesic measurement across map canvas using `turf.distance` in meters and kilometers.

3. **Boundary Overlap Detection:**
   Evaluates polygon intersections between contiguous parcels using `turf.intersect`. Overlaps $> 0.5\text{ sq.m}$ trigger a **Potential Boundary Conflict** record with severity rating.
