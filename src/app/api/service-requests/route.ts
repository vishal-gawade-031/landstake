import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/apiResponse';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return apiError('Unauthorized: Authentication required to view service requests', 401);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const ulpin = searchParams.get('ulpin');

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (ulpin) where.parcelUlpin = ulpin;

    // Strict Role Separation:
    // CITIZEN can only view their own requests (by citizenId or authenticated email)
    if (user.role === 'CITIZEN') {
      where.OR = [
        { citizenId: user.userId },
        { citizenEmail: user.email },
      ];
    }
    // OFFICER and ADMIN can view all or filter by search parameters

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
    if (!user) {
      return apiError('Authentication required to submit service request', 401);
    }

    const body = await req.json();
    const { parcelUlpin, serviceType, citizenName, citizenPhone, remarks } = body;

    if (!parcelUlpin || !serviceType) {
      return apiError('Missing required fields: parcelUlpin, serviceType', 400);
    }

    // Verify parcel exists
    const parcel = await prisma.parcel.findUnique({ where: { ulpin: parcelUlpin } });
    if (!parcel) {
      return apiError(`Parcel ${parcelUlpin} not found`, 404);
    }

    // Generate unique request ID format: REQ-2026-000001
    const count = await prisma.serviceRequest.count();
    const reqNumber = `REQ-2026-${(count + 1).toString().padStart(6, '0')}`;

    const finalCitizenName = user.role === 'CITIZEN' ? user.email.split('@')[0] : (citizenName || 'Citizen Applicant');
    const finalCitizenEmail = user.role === 'CITIZEN' ? user.email : (body.citizenEmail || user.email);

    const newRequest = await prisma.serviceRequest.create({
      data: {
        requestNumber: reqNumber,
        parcelUlpin,
        citizenId: user.userId,
        citizenName: citizenName || finalCitizenName,
        citizenEmail: finalCitizenEmail,
        citizenPhone: citizenPhone || '+91 98450 00000',
        serviceType,
        status: 'SUBMITTED',
        remarks: remarks || 'Citizen application submitted through authenticated portal',
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
        performedBy: user.email,
        userRole: user.role,
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
