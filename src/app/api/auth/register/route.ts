import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/apiResponse';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, phone } = body;

    if (!email || !password || !name) {
      return apiError('Name, email, and password are required', 400);
    }

    if (password.length < 6) {
      return apiError('Password must be at least 6 characters long', 400);
    }

    const cleanEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return apiError('An account with this email address already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // SECURITY: Public registration ALWAYS defaults strictly to CITIZEN.
    // Roles ADMIN and OFFICER cannot be registered publicly.
    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        name: name.trim(),
        phone: phone || null,
        role: 'CITIZEN',
        department: 'Citizen Public Portal',
      },
    });

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: 'CITIZEN',
      department: newUser.department,
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_REGISTERED',
        entityType: 'AUTH',
        entityId: newUser.id,
        performedBy: newUser.email,
        userRole: 'CITIZEN',
        details: `Public citizen registration for ${newUser.email}`,
      },
    });

    return apiSuccess(
      {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          phone: newUser.phone,
          department: newUser.department,
        },
      },
      'Registration successful. Welcome to LANDSTACK Citizen Portal.',
      201
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return apiError('Failed to register account', 500);
  }
}
