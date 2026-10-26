import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/apiResponse';
import { getUserFromRequest, authorizeRole } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = authorizeRole(req, ['ADMIN', 'OFFICER']);
    if (!auth.authorized) {
      return apiError(auth.error || 'Unauthorized: Officer or Admin authorization required', auth.status);
    }
    const user = auth.user!;

    const { id } = await params;
    const body = await req.json();
    const { status, remarks, assignedOfficer } = body;

    const validStatuses = [
      'SUBMITTED',
      'UNDER_REVIEW',
      'DOCUMENT_VERIFICATION',
      'OFFICER_REVIEW',
      'VERIFIED',
      'APPROVED',
      'REJECTED',
      'COMPLETED',
    ];

    if (status && !validStatuses.includes(status)) {
      return apiError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Find request by id or requestNumber
    const existing = await prisma.serviceRequest.findFirst({
      where: {
        OR: [{ id }, { requestNumber: id }],
      },
    });

    if (!existing) {
      return apiError(`Service request ${id} not found`, 404);
    }

    const updated = await prisma.serviceRequest.update({
      where: { id: existing.id },
      data: {
        ...(status ? { status } : {}),
        ...(remarks ? { remarks } : {}),
        ...(assignedOfficer ? { assignedOfficer } : {}),
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        action: 'SERVICE_STATUS_CHANGED',
        entityType: 'SERVICE',
        entityId: updated.requestNumber,
        parcelUlpin: updated.parcelUlpin,
        performedBy: user?.email || 'OFFICER',
        userRole: user?.role || 'OFFICER',
        details: `Service status updated to ${updated.status}. Remarks: ${remarks || 'None'}`,
      },
    });

    return apiSuccess(updated, `Service request status updated to ${updated.status}`);
  } catch (error: any) {
    console.error('Error updating service request status:', error);
    return apiError('Failed to update service request status', 500);
  }
}
