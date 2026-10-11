import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/apiResponse';

export async function GET(req: NextRequest) {
  const tokenUser = getUserFromRequest(req);
  if (!tokenUser) {
    return apiError('Unauthorized: Missing or invalid token', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: tokenUser.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      phone: true,
      createdAt: true,
    },
  });

  if (!user) {
    return apiError('User not found', 404);
  }

  return apiSuccess(user, 'User profile retrieved');
}
