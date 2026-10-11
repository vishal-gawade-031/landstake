import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/apiResponse';
import { RiskEngine } from '@/services/riskEngine';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ulpin: string }> }
) {
  try {
    const { ulpin } = await params;

    const parcel = await prisma.parcel.findUnique({
      where: { ulpin },
      include: {
        ownershipRecords: true,
        rorRecords: true,
        registrations: true,
        encumbrances: true,
        mortgages: true,
        landUseRecords: true,
        buildingPermissions: true,
        propertyTaxes: true,
        restrictions: true,
        utilities: true,
        disputes: true,
        documents: true,
        fraudAlerts: true,
        auditLogs: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });

    if (!parcel) {
      return apiError(`No parcel found for ULPIN: ${ulpin}`, 404);
    }

    // Dynamic risk assessment computation
    const riskAssessment = RiskEngine.evaluateRisk({
      hasAreaMismatch: parcel.hasAreaMismatch,
      areaDifference: parcel.areaDifference,
      hasBoundaryOverlap: parcel.hasBoundaryOverlap,
      hasOwnershipConflict: parcel.hasOwnershipConflict,
      hasRegistrationConflict: parcel.hasRegistrationConflict,
      hasEncumbrance: parcel.hasEncumbrance,
      hasTaxIssue: parcel.hasTaxIssue,
    });

    return apiSuccess(
      {
        ...parcel,
        evaluatedRisk: riskAssessment,
      },
      'Parcel retrieved successfully'
    );
  } catch (error: any) {
    console.error('Error retrieving parcel:', error);
    return apiError('Failed to fetch parcel', 500);
  }
}
