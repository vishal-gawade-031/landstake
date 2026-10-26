import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/apiResponse';
import { authorizeRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = authorizeRole(req, ['ADMIN', 'OFFICER']);
    if (!auth.authorized) {
      return apiError(auth.error || 'Forbidden: Confidential fraud alerts are restricted to departmental officers', auth.status);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');
    const ulpin = searchParams.get('ulpin');

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (severity && severity !== 'ALL') where.severity = severity;
    if (type && type !== 'ALL') where.conflictType = type;
    if (ulpin) where.parcelUlpin = ulpin;

    const alerts = await prisma.fraudAlert.findMany({
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
            gisArea: true,
            areaDifference: true,
            riskScore: true,
            riskLevel: true,
          },
        },
      },
    });

    return apiSuccess(alerts, 'Potential data conflicts retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching fraud alerts:', error);
    return apiError('Failed to fetch fraud alerts', 500);
  }
}
