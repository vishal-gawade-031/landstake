import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'landstack-secret-key-mca-project-2026-super-secure';

app.use(cors());
app.use(express.json());

// Standard Response Formatter
const sendResponse = (res: Response, success: boolean, data: any, message: string, status = 200) => {
  return res.status(status).json({
    success,
    data,
    message,
    metadata: {
      source: 'DEMO — NOT AN OFFICIAL GOVERNMENT LAND RECORD',
      timestamp: new Date().toISOString(),
      engine: 'Express.js TypeScript Backend',
    },
  });
};

// Root Health & Metadata
app.get('/api', (req: Request, res: Response) => {
  sendResponse(res, true, {
    service: 'LANDSTACK GIS Integrated Land Governance Platform',
    version: '1.0.0-MCA-Production',
    districts: ['Belagavi', 'Mysuru', 'Dharwad'],
    architecture: 'Parcel-Centric ULPIN Land Stack',
  }, 'LANDSTACK Express REST API Online');
});

// Authentication
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendResponse(res, false, null, 'Email and password required', 400);

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return sendResponse(res, false, null, 'Invalid credentials', 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return sendResponse(res, false, null, 'Invalid credentials', 401);

    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name, role: user.role, department: user.department },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    sendResponse(res, true, {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department },
    }, 'Authentication successful');
  } catch (err: any) {
    sendResponse(res, false, null, err.message, 500);
  }
});

// GET /api/parcels
app.get('/api/parcels', async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;
    const district = req.query.district as string;
    const landUse = req.query.landUse as string;
    const riskLevel = req.query.riskLevel as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { ulpin: { contains: search } },
        { surveyNo: { contains: search } },
        { village: { contains: search } },
      ];
    }
    if (district && district !== 'ALL') where.district = district;
    if (landUse && landUse !== 'ALL') where.landUse = landUse;
    if (riskLevel && riskLevel !== 'ALL') where.riskLevel = riskLevel;

    const parcels = await prisma.parcel.findMany({
      where,
      take: 120,
      include: { ownershipRecords: { take: 1 } },
    });

    sendResponse(res, true, { parcels, total: parcels.length }, 'Parcels retrieved successfully');
  } catch (err: any) {
    sendResponse(res, false, null, err.message, 500);
  }
});

// GET /api/parcels/:ulpin
app.get('/api/parcels/:ulpin', async (req: Request, res: Response) => {
  try {
    const { ulpin } = req.params;
    const parcel = await prisma.parcel.findUnique({
      where: { ulpin },
      include: {
        ownershipRecords: true,
        rorRecords: true,
        registrations: true,
        encumbrances: true,
        mortgages: true,
        landUseRecords: true,
        buildingPermissions: true,
        propertyTaxes: true,
        restrictions: true,
        utilities: true,
        disputes: true,
        documents: true,
        fraudAlerts: true,
        auditLogs: { orderBy: { timestamp: 'desc' }, take: 10 },
      },
    });

    if (!parcel) return sendResponse(res, false, null, `Parcel ${ulpin} not found`, 404);
    sendResponse(res, true, parcel, 'Parcel retrieved successfully');
  } catch (err: any) {
    sendResponse(res, false, null, err.message, 500);
  }
});

// GET /api/parcels/:ulpin/ownership
app.get('/api/parcels/:ulpin/ownership', async (req: Request, res: Response) => {
  const records = await prisma.ownershipRecord.findMany({ where: { parcelUlpin: req.params.ulpin } });
  sendResponse(res, true, records, 'Ownership records retrieved');
});

// GET /api/parcels/:ulpin/ror
app.get('/api/parcels/:ulpin/ror', async (req: Request, res: Response) => {
  const records = await prisma.rorRecord.findMany({ where: { parcelUlpin: req.params.ulpin } });
  sendResponse(res, true, records, 'RoR records retrieved');
});

// GET /api/parcels/:ulpin/registration
app.get('/api/parcels/:ulpin/registration', async (req: Request, res: Response) => {
  const records = await prisma.registration.findMany({ where: { parcelUlpin: req.params.ulpin } });
  sendResponse(res, true, records, 'Registration records retrieved');
});

// GET /api/parcels/:ulpin/encumbrance
app.get('/api/parcels/:ulpin/encumbrance', async (req: Request, res: Response) => {
  const encumbrances = await prisma.encumbrance.findMany({ where: { parcelUlpin: req.params.ulpin } });
  sendResponse(res, true, encumbrances, 'Encumbrance records retrieved');
});

// GET /api/parcels/:ulpin/land-use
app.get('/api/parcels/:ulpin/land-use', async (req: Request, res: Response) => {
  const records = await prisma.landUse.findMany({ where: { parcelUlpin: req.params.ulpin } });
  sendResponse(res, true, records, 'Land use records retrieved');
});

// GET /api/parcels/:ulpin/building
app.get('/api/parcels/:ulpin/building', async (req: Request, res: Response) => {
  const records = await prisma.buildingPermission.findMany({ where: { parcelUlpin: req.params.ulpin } });
  sendResponse(res, true, records, 'Building permissions retrieved');
});

// GET /api/parcels/:ulpin/tax
app.get('/api/parcels/:ulpin/tax', async (req: Request, res: Response) => {
  const records = await prisma.propertyTax.findMany({ where: { parcelUlpin: req.params.ulpin } });
  sendResponse(res, true, records, 'Tax records retrieved');
});

// GET /api/parcels/:ulpin/restrictions
app.get('/api/parcels/:ulpin/restrictions', async (req: Request, res: Response) => {
  const records = await prisma.restriction.findMany({ where: { parcelUlpin: req.params.ulpin } });
  sendResponse(res, true, records, 'Restrictions retrieved');
});

// GET /api/parcels/:ulpin/utilities
app.get('/api/parcels/:ulpin/utilities', async (req: Request, res: Response) => {
  const records = await prisma.utility.findMany({ where: { parcelUlpin: req.params.ulpin } });
  sendResponse(res, true, records, 'Utilities retrieved');
});

// Service Requests
app.get('/api/service-requests', async (req: Request, res: Response) => {
  const requests = await prisma.serviceRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: { parcel: true },
  });
  sendResponse(res, true, requests, 'Service requests retrieved');
});

app.post('/api/service-requests', async (req: Request, res: Response) => {
  const { parcelUlpin, serviceType, citizenName, citizenEmail, citizenPhone, remarks } = req.body;
  const count = await prisma.serviceRequest.count();
  const requestNumber = `REQ-2026-${(count + 1).toString().padStart(6, '0')}`;

  const created = await prisma.serviceRequest.create({
    data: {
      requestNumber,
      parcelUlpin,
      citizenName,
      citizenEmail: citizenEmail || 'citizen@landstack.demo',
      citizenPhone: citizenPhone || '+91 98450 00000',
      serviceType,
      status: 'SUBMITTED',
      remarks,
    },
  });
  sendResponse(res, true, created, 'Service request registered', 201);
});

app.patch('/api/service-requests/:id/status', async (req: Request, res: Response) => {
  const { status, remarks } = req.body;
  const updated = await prisma.serviceRequest.update({
    where: { requestNumber: req.params.id },
    data: { status, remarks },
  });
  sendResponse(res, true, updated, `Status updated to ${status}`);
});

// Disputes
app.get('/api/disputes', async (req: Request, res: Response) => {
  const disputes = await prisma.dispute.findMany({ orderBy: { createdAt: 'desc' }, include: { parcel: true } });
  sendResponse(res, true, disputes, 'Disputes retrieved');
});

app.post('/api/disputes', async (req: Request, res: Response) => {
  const { parcelUlpin, disputeType, description, citizenName } = req.body;
  const count = await prisma.dispute.count();
  const disputeNumber = `DIS-2026-${(1001 + count).toString()}`;

  const created = await prisma.dispute.create({
    data: {
      disputeNumber,
      parcelUlpin,
      surveyNumber: '101/A',
      citizenName: citizenName || 'Citizen Applicant',
      disputeType,
      description,
      status: 'OPEN',
    },
  });
  sendResponse(res, true, created, 'Dispute filed successfully', 201);
});

// Fraud Alerts
app.get('/api/fraud-alerts', async (req: Request, res: Response) => {
  const alerts = await prisma.fraudAlert.findMany({ orderBy: { createdAt: 'desc' }, include: { parcel: true } });
  sendResponse(res, true, alerts, 'Potential conflicts retrieved');
});

app.patch('/api/fraud-alerts/:id', async (req: Request, res: Response) => {
  const { status, remarks } = req.body;
  const updated = await prisma.fraudAlert.update({
    where: { alertNumber: req.params.id },
    data: { status, remarks, ...(status === 'RESOLVED' ? { resolvedAt: new Date() } : {}) },
  });
  sendResponse(res, true, updated, `Conflict alert updated to ${status}`);
});

// Statistics
app.get('/api/dashboard/statistics', async (req: Request, res: Response) => {
  const [totalParcels, verifiedParcels, pendingParcels, disputedParcels, potentialConflicts, serviceRequestsCount] =
    await Promise.all([
      prisma.parcel.count(),
      prisma.parcel.count({ where: { status: 'VERIFIED' } }),
      prisma.parcel.count({ where: { status: 'PENDING_VERIFICATION' } }),
      prisma.parcel.count({ where: { status: 'DISPUTED' } }),
      prisma.fraudAlert.count({ where: { status: 'OPEN' } }),
      prisma.serviceRequest.count(),
    ]);

  sendResponse(res, true, {
    summary: { totalParcels, verifiedParcels, pendingParcels, disputedParcels, potentialConflicts, serviceRequestsCount },
  }, 'Dashboard statistics aggregated');
});

// GeoJSON API
app.get('/api/geojson', (req: Request, res: Response) => {
  const layer = (req.query.layer as string) || 'parcels';
  let filename = 'parcels.geojson';
  if (layer === 'restrictions') filename = 'restrictions.geojson';
  if (layer === 'infrastructure') filename = 'infrastructure.geojson';

  const filePath = path.join(__dirname, '..', 'data', 'geojson', filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Layer file not found' });

  const raw = fs.readFileSync(filePath, 'utf-8');
  res.setHeader('Content-Type', 'application/geo+json');
  res.send(raw);
});

// Audit Logs
app.get('/api/audit-logs', async (req: Request, res: Response) => {
  const logs = await prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 50 });
  sendResponse(res, true, logs, 'Audit logs retrieved');
});

// Start Express server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`LANDSTACK Express.js Backend Server running on port ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}/api`);
    console.log(`Database connected via Prisma ORM`);
    console.log(`====================================================`);
  });
}

export default app;
