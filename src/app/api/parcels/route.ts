import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/apiResponse';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const district = searchParams.get('district')?.trim();
    const taluk = searchParams.get('taluk')?.trim();
    const landUse = searchParams.get('landUse')?.trim();
    const riskLevel = searchParams.get('riskLevel')?.trim();
    const status = searchParams.get('status')?.trim();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '120', 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { ulpin: { contains: search } },
        { surveyNo: { contains: search } },
        { village: { contains: search } },
        { taluk: { contains: search } },
        { district: { contains: search } },
        { ownershipRecords: { some: { ownerName: { contains: search } } } },
      ];
    }

    if (district && district !== 'ALL') where.district = district;
    if (taluk && taluk !== 'ALL') where.taluk = taluk;
    if (landUse && landUse !== 'ALL') where.landUse = landUse;
    if (riskLevel && riskLevel !== 'ALL') where.riskLevel = riskLevel;
    if (status && status !== 'ALL') where.status = status;

    const [total, parcels] = await Promise.all([
      prisma.parcel.count({ where }),
      prisma.parcel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ulpin: 'asc' },
        include: {
          ownershipRecords: { take: 1 },
          propertyTaxes: { take: 1 },
        },
      }),
    ]);

    return apiSuccess(
      {
        parcels,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      'Parcels retrieved successfully',
      200,
      { filterCount: parcels.length }
    );
  } catch (error: any) {
    console.error('Error fetching parcels:', error);
    return apiError('Failed to fetch parcels', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'OFFICER')) {
      return apiError('Unauthorized: Only Officers or Admins can register new parcels', 403);
    }

    const body = await req.json();
    const { ulpin, surveyNo, district, taluk, village, area, landUse, centroidLat, centroidLng } = body;

    if (!ulpin || !surveyNo || !district || !taluk || !village || !area) {
      return apiError('Missing required parcel fields', 400);
    }

    const existing = await prisma.parcel.findUnique({ where: { ulpin } });
    if (existing) {
      return apiError(`Parcel with ULPIN ${ulpin} already exists`, 409);
    }

    const newParcel = await prisma.parcel.create({
      data: {
        ulpin,
        surveyNo,
        district,
        taluk,
        village,
        area: parseFloat(area),
        gisArea: parseFloat(area),
        areaDifference: 0,
        landUse: landUse || 'Residential',
        centroidLat: parseFloat(centroidLat || '15.8497'),
        centroidLng: parseFloat(centroidLng || '74.4977'),
        status: 'PENDING_VERIFICATION',
        riskScore: 10,
        riskLevel: 'LOW',
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'PARCEL_CREATED',
        entityType: 'PARCEL',
        entityId: newParcel.ulpin,
        parcelUlpin: newParcel.ulpin,
        performedBy: user.email,
        userRole: user.role,
        details: `Created parcel ${newParcel.ulpin}`,
      },
    });

    return apiSuccess(newParcel, 'Parcel created successfully', 201);
  } catch (error: any) {
    console.error('Error creating parcel:', error);
    return apiError('Failed to create parcel', 500);
  }
}
