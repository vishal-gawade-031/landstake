import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/apiResponse';
import { authorizeRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = authorizeRole(req, ['ADMIN']);
    if (!auth.authorized) {
      return apiError(auth.error || 'Forbidden: System audit logs are restricted exclusively to Administrators', auth.status);
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const role = searchParams.get('role');
    const ulpin = searchParams.get('ulpin');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {};
    if (action && action !== 'ALL') where.action = action;
    if (role && role !== 'ALL') where.userRole = role;
    if (ulpin) where.parcelUlpin = ulpin;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return apiSuccess(logs, 'Audit logs retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return apiError('Failed to fetch audit logs', 500);
  }
}
