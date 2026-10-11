# LANDSTACK REST API SPECIFICATION

## 1. Standard Response Envelope

Every endpoint in LANDSTACK responds with a structured JSON envelope:

```json
{
  "success": true,
  "data": {},
  "message": "Parcel retrieved successfully",
  "metadata": {
    "source": "DEMO — NOT AN OFFICIAL GOVERNMENT LAND RECORD",
    "timestamp": "2026-10-03T09:45:00.000Z"
  }
}
```

---

## 2. API Endpoints Reference

### Parcels
- `GET /api/parcels` — List parcels with filtering by district, landUse, riskLevel, status, and text search.
- `POST /api/parcels` — Register a new parcel (Officer/Admin only).
- `GET /api/parcels/:ulpin` — Complete Parcel 360 record with all relational datasets.
- `GET /api/parcels/:ulpin/ownership` — Historical and current ownership records.
- `GET /api/parcels/:ulpin/ror` — RTC Record of Rights, cultivator and soil details.
- `GET /api/parcels/:ulpin/registration` — Sub-Registrar deed transaction history.
- `GET /api/parcels/:ulpin/encumbrance` — Financial charges and mortgage details.
- `GET /api/parcels/:ulpin/land-use` — CDP Master plan zoning and conversions.
- `GET /api/parcels/:ulpin/building` — Building permits and floor sanctions.
- `GET /api/parcels/:ulpin/tax` — Municipal property tax assessments and dues.
- `GET /api/parcels/:ulpin/restrictions` — Intersecting environmental/heritage buffer zones.
- `GET /api/parcels/:ulpin/utilities` — Power RR numbers, water, sewerage, and road access.

### Citizen Services
- `GET /api/service-requests` — List service requests with filter by status or applicant.
- `POST /api/service-requests` — Submit a new service application (generates `REQ-2026-XXXXXX`).
- `PATCH /api/service-requests/:id/status` — Advance request workflow status.

### Disputes & Potential Conflicts
- `GET /api/disputes` — List revenue court disputes.
- `POST /api/disputes` — Register a new dispute appeal.
- `GET /api/fraud-alerts` — List potential data conflict alerts.
- `PATCH /api/fraud-alerts/:id` — Review, update, or resolve anomaly alert.

### Analytics & Audit
- `GET /api/dashboard/statistics` — Summary metrics and Recharts visualization datasets.
- `GET /api/audit-logs` — Immutable audit trail of system events.
- `GET /api/geojson?layer=parcels|restrictions|infrastructure` — Vector spatial layers.

### Authentication
- `POST /api/auth/login` — Login with email/password; returns JWT token.
- `GET /api/auth/me` — Get profile of currently authenticated user.
