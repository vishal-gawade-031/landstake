import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRole } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/apiResponse';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authorizeRole(req, ['ADMIN']);
  if (!auth.authorized) {
    return apiError(auth.error || 'Unauthorized', auth.status || 401);
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { role, department, name, phone } = body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return apiError(`User ${id} not found`, 404);
    }

    // Guard: Prevent demoting the last Admin
    if (existing.role === 'ADMIN' && role && role !== 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return apiError('Cannot demote the only remaining Administrator account', 400);
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(role ? { role } : {}),
        ...(department !== undefined ? { department } : {}),
        ...(name ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
        updatedAt: true,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        action: 'ROLE_MODIFIED',
        entityType: 'USER',
        entityId: updated.id,
        performedBy: auth.user!.email,
        userRole: auth.user!.role,
        details: `Updated user ${updated.email} - role: ${updated.role}, dept: ${updated.department}`,
      },
    });

    return apiSuccess(updated, `User account updated successfully`);
  } catch (error: any) {
    console.error('Error updating user:', error);
    return apiError('Failed to update user', 500);
  }
}
