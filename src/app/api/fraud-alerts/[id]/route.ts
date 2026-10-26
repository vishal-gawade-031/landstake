import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/apiResponse';
import { authorizeRole } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = authorizeRole(req, ['ADMIN', 'OFFICER']);
    if (!auth.authorized) {
      return apiError(auth.error || 'Forbidden: Officer or Admin authorization required', auth.status);
    }
    const user = auth.user!;
    const { id } = await params;
    const body = await req.json();
    const { status, remarks, assignedOfficer } = body;

    const existing = await prisma.fraudAlert.findFirst({
      where: {
        OR: [{ id }, { alertNumber: id }],
      },
    });

    if (!existing) {
      return apiError(`Data conflict alert ${id} not found`, 404);
    }

    const updated = await prisma.fraudAlert.update({
      where: { id: existing.id },
      data: {
        ...(status ? { status } : {}),
        ...(remarks ? { remarks } : {}),
        ...(assignedOfficer ? { assignedOfficer } : {}),
        ...(status === 'RESOLVED' || status === 'DISMISSED' ? { resolvedAt: new Date() } : {}),
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        action: status === 'RESOLVED' ? 'FRAUD_RESOLVED' : 'FRAUD_REVIEWED',
        entityType: 'ALERT',
        entityId: updated.alertNumber,
        parcelUlpin: updated.parcelUlpin,
        performedBy: user?.email || 'OFFICER',
        userRole: user?.role || 'OFFICER',
        details: `Updated conflict status to ${updated.status}. Remarks: ${remarks || 'None'}`,
      },
    });

    return apiSuccess(updated, `Potential conflict status updated to ${updated.status}`);
  } catch (error: any) {
    console.error('Error updating conflict alert:', error);
    return apiError('Failed to update conflict alert', 500);
  }
}
