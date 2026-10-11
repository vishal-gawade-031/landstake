import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/apiResponse';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ulpin: string }> }
) {
  try {
    const { ulpin } = await params;
    const records = await prisma.utility.findMany({ where: { parcelUlpin: ulpin } });
    return apiSuccess(records, 'Utility records retrieved successfully');
  } catch (error) {
    return apiError('Failed to fetch utility records', 500);
  }
}
