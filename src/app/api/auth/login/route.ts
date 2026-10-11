import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken, getUserFromRequest } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/apiResponse';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return apiError('Email and password are required', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return apiError('Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return apiError('Invalid credentials', 401);
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      department: user.department,
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        action: 'LOGIN',
        entityType: 'AUTH',
        entityId: user.id,
        performedBy: user.email,
        userRole: user.role,
        details: `User logged in with role ${user.role}`,
      },
    });

    return apiSuccess(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          phone: user.phone,
        },
      },
      'Authentication successful'
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return apiError('Internal server error during authentication', 500);
  }
}
