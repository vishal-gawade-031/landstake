import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { authorizeRole } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/apiResponse';

// GET /api/users - Admin only: List all registered accounts
export async function GET(req: NextRequest) {
  const auth = authorizeRole(req, ['ADMIN']);
  if (!auth.authorized) {
    return apiError(auth.error || 'Unauthorized', auth.status || 401);
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(users, 'User registry retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return apiError('Failed to fetch user accounts', 500);
  }
}

// POST /api/users - Admin only: Provision an Officer or User account
export async function POST(req: NextRequest) {
  const auth = authorizeRole(req, ['ADMIN']);
  if (!auth.authorized) {
    return apiError(auth.error || 'Unauthorized', auth.status || 401);
  }

  try {
    const body = await req.json();
    const { email, password, name, role, department, phone } = body;

    if (!email || !password || !name) {
      return apiError('Missing required fields: email, password, name', 400);
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return apiError(`User with email ${cleanEmail} already exists`, 409);
    }

    const validRoles = ['ADMIN', 'OFFICER', 'CITIZEN'];
    const assignedRole = validRoles.includes(role) ? role : 'OFFICER';

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        name: name.trim(),
        role: assignedRole,
        department: department || (assignedRole === 'OFFICER' ? 'Taluk Revenue & Cadastral Verification Cell' : 'Citizen Portal'),
        phone: phone || null,
      },
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

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_PROVISIONED',
        entityType: 'USER',
        entityId: newUser.id,
        performedBy: auth.user!.email,
        userRole: auth.user!.role,
        details: `Admin provisioned account ${newUser.email} with role ${newUser.role}`,
      },
    });

    return apiSuccess(newUser, `User account created successfully with role ${newUser.role}`, 201);
  } catch (error: any) {
    console.error('Error creating user:', error);
    return apiError('Failed to provision user', 500);
  }
}
