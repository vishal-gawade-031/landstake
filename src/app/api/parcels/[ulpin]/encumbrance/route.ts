import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/apiResponse';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ulpin: string }> }
) {
  try {
    const { ulpin } = await params;
    const [encumbrances, mortgages] = await Promise.all([
      prisma.encumbrance.findMany({ where: { parcelUlpin: ulpin } }),
      prisma.mortgage.findMany({ where: { parcelUlpin: ulpin } }),
    ]);
    return apiSuccess({ encumbrances, mortgages }, 'Encumbrance details retrieved successfully');
  } catch (error) {
    return apiError('Failed to fetch encumbrance records', 500);
  }
}
