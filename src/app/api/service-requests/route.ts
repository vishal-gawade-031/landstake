import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/apiResponse';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const ulpin = searchParams.get('ulpin');
    const citizenEmail = searchParams.get('citizenEmail');

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (ulpin) where.parcelUlpin = ulpin;
    if (citizenEmail) where.citizenEmail = citizenEmail;

    const requests = await prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        parcel: {
          select: {
            ulpin: true,
            surveyNo: true,
            district: true,
            taluk: true,
            village: true,
            area: true,
            landUse: true,
          },
        },
      },
    });

    return apiSuccess(requests, 'Service requests retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching service requests:', error);
    return apiError('Failed to fetch service requests', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();
    const { parcelUlpin, serviceType, citizenName, citizenEmail, citizenPhone, remarks } = body;

    if (!parcelUlpin || !serviceType || !citizenName) {
      return apiError('Missing required fields: parcelUlpin, serviceType, citizenName', 400);
    }

    // Verify parcel exists
    const parcel = await prisma.parcel.findUnique({ where: { ulpin: parcelUlpin } });
    if (!parcel) {
      return apiError(`Parcel ${parcelUlpin} not found`, 404);
    }

    // Generate unique request ID format: REQ-2026-000001
    const count = await prisma.serviceRequest.count();
    const reqNumber = `REQ-2026-${(count + 1).toString().padStart(6, '0')}`;

    const newRequest = await prisma.serviceRequest.create({
      data: {
        requestNumber: reqNumber,
        parcelUlpin,
        citizenId: user?.userId || null,
        citizenName,
        citizenEmail: citizenEmail || user?.email || 'citizen@landstack.demo',
        citizenPhone: citizenPhone || '+91 98450 00000',
        serviceType,
        status: 'SUBMITTED',
        remarks: remarks || 'Citizen application submitted through portal',
        assignedOfficer: 'Shri Anand Kulkarni (KAS)',
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        action: 'SERVICE_CREATED',
        entityType: 'SERVICE',
        entityId: newRequest.requestNumber,
        parcelUlpin,
        performedBy: citizenEmail || user?.email || 'CITIZEN',
        userRole: user?.role || 'CITIZEN',
        details: `Created service request ${newRequest.requestNumber} for ${serviceType}`,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user?.userId || null,
        title: `Service Request ${newRequest.requestNumber} Created`,
        message: `Your request for ${serviceType} has been assigned tracking ID ${newRequest.requestNumber}.`,
        type: 'SUCCESS',
      },
    });

    return apiSuccess(newRequest, 'Service request submitted successfully', 201);
  } catch (error: any) {
    console.error('Error creating service request:', error);
    return apiError('Failed to submit service request', 500);
  }
}
