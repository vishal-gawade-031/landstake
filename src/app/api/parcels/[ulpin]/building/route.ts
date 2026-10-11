import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/apiResponse';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ulpin: string }> }
) {
  try {
    const { ulpin } = await params;
    const records = await prisma.buildingPermission.findMany({
      where: { parcelUlpin: ulpin },
      orderBy: { applicationDate: 'desc' },
    });
    return apiSuccess(records, 'Building permission records retrieved successfully');
  } catch (error) {
    return apiError('Failed to fetch building permission records', 500);
  }
}
