import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/apiResponse';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ulpin: string }> }
) {
  try {
    const { ulpin } = await params;
    const records = await prisma.propertyTax.findMany({
      where: { parcelUlpin: ulpin },
      orderBy: { assessmentYear: 'desc' },
    });
    return apiSuccess(records, 'Property tax records retrieved successfully');
  } catch (error) {
    return apiError('Failed to fetch tax records', 500);
  }
}
