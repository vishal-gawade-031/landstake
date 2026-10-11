import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/apiResponse';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const ulpin = searchParams.get('ulpin');
    const type = searchParams.get('type');

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (ulpin) where.parcelUlpin = ulpin;
    if (type && type !== 'ALL') where.disputeType = type;

    const disputes = await prisma.dispute.findMany({
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
            riskScore: true,
            riskLevel: true,
          },
        },
      },
    });

    return apiSuccess(disputes, 'Disputes retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching disputes:', error);
    return apiError('Failed to fetch disputes', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();
    const { parcelUlpin, disputeType, description, citizenName } = body;

    if (!parcelUlpin || !disputeType || !description) {
      return apiError('Missing required fields: parcelUlpin, disputeType, description', 400);
    }

    const parcel = await prisma.parcel.findUnique({ where: { ulpin: parcelUlpin } });
    if (!parcel) {
      return apiError(`Parcel ${parcelUlpin} not found`, 404);
    }

    const count = await prisma.dispute.count();
    const disputeNumber = `DIS-2026-${(1001 + count).toString()}`;

    const newDispute = await prisma.dispute.create({
      data: {
        disputeNumber,
        parcelUlpin,
        surveyNumber: parcel.surveyNo,
        citizenName: citizenName || user?.name || 'Citizen Applicant',
        disputeType,
        description,
        assignedOfficer: 'Assistant Commissioner (Revenue Sub-Division)',
        status: 'OPEN',
        remarks: 'Preliminary complaint registered; summon notice pending dispatch',
      },
    });

    // Mark parcel as disputed
    await prisma.parcel.update({
      where: { ulpin: parcelUlpin },
      data: {
        status: 'DISPUTED',
        hasOwnershipConflict: disputeType === 'Ownership Dispute' ? true : parcel.hasOwnershipConflict,
        hasBoundaryOverlap: disputeType === 'Boundary Dispute' ? true : parcel.hasBoundaryOverlap,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'DISPUTE_CREATED',
        entityType: 'DISPUTE',
        entityId: newDispute.disputeNumber,
        parcelUlpin,
        performedBy: user?.email || 'CITIZEN',
        userRole: user?.role || 'CITIZEN',
        details: `Dispute filed for parcel ${parcelUlpin}: ${disputeType}`,
      },
    });

    return apiSuccess(newDispute, 'Dispute registered successfully', 201);
  } catch (error: any) {
    console.error('Error creating dispute:', error);
    return apiError('Failed to register dispute', 500);
  }
}
