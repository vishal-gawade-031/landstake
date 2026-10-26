import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'landstack-secret-key-mca-project-2026-super-secure';

export type UserRole = 'CITIZEN' | 'OFFICER' | 'ADMIN';

export type Permission =
  | 'users.manage'
  | 'roles.manage'
  | 'parcels.read'
  | 'parcels.read_confidential'
  | 'parcels.manage'
  | 'gis.public.read'
  | 'gis.layers.manage'
  | 'ownership.read'
  | 'ownership.verify'
  | 'registration.read'
  | 'registration.manage'
  | 'encumbrance.read'
  | 'land_use.read'
  | 'building_permissions.review'
  | 'property_tax.read'
  | 'service_requests.create'
  | 'service_requests.read_own'
  | 'service_requests.read_assigned'
  | 'service_requests.read_all'
  | 'service_requests.process'
  | 'service_requests.assign'
  | 'disputes.create'
  | 'disputes.read_own'
  | 'disputes.read_assigned'
  | 'disputes.manage_all'
  | 'risk_alerts.read_assigned'
  | 'risk_alerts.manage_all'
  | 'analytics.read_assigned'
  | 'analytics.read_all'
  | 'audit_logs.read'
  | 'system_settings.manage';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  CITIZEN: [
    'parcels.read',
    'gis.public.read',
    'ownership.read',
    'registration.read',
    'encumbrance.read',
    'land_use.read',
    'property_tax.read',
    'service_requests.create',
    'service_requests.read_own',
    'disputes.create',
    'disputes.read_own',
  ],
  OFFICER: [
    'parcels.read',
    'parcels.read_confidential',
    'gis.public.read',
    'ownership.read',
    'ownership.verify',
    'registration.read',
    'encumbrance.read',
    'land_use.read',
    'building_permissions.review',
    'property_tax.read',
    'service_requests.read_assigned',
    'service_requests.process',
    'disputes.read_assigned',
    'risk_alerts.read_assigned',
    'analytics.read_assigned',
  ],
  ADMIN: [
    'users.manage',
    'roles.manage',
    'parcels.read',
    'parcels.read_confidential',
    'parcels.manage',
    'gis.public.read',
    'gis.layers.manage',
    'ownership.read',
    'ownership.verify',
    'registration.read',
    'registration.manage',
    'encumbrance.read',
    'land_use.read',
    'building_permissions.review',
    'property_tax.read',
    'service_requests.read_all',
    'service_requests.process',
    'service_requests.assign',
    'disputes.manage_all',
    'risk_alerts.manage_all',
    'analytics.read_all',
    'audit_logs.read',
    'system_settings.manage',
  ],
};

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string | null;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function getUserFromRequest(req: NextRequest | Request): TokenPayload | null {
  // Check Authorization header
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const verified = verifyToken(parts[1]);
      if (verified) return verified;
    }
  }

  // Fallback check for NextRequest cookies if present
  if ('cookies' in req && typeof (req as any).cookies?.get === 'function') {
    const cookie = (req as any).cookies.get('landstack_token');
    if (cookie?.value) {
      const verified = verifyToken(cookie.value);
      if (verified) return verified;
    }
  }

  return null;
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function checkRole(user: TokenPayload | null, allowedRoles: UserRole[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

export function authorizeRole(
  req: NextRequest | Request,
  allowedRoles: UserRole[]
): { authorized: boolean; user: TokenPayload | null; error?: string; status?: number } {
  const user = getUserFromRequest(req);
  if (!user) {
    return { authorized: false, user: null, error: 'Unauthorized: Missing or invalid authentication token', status: 401 };
  }
  if (!allowedRoles.includes(user.role)) {
    return { authorized: false, user, error: `Forbidden: Requires role [${allowedRoles.join(', ')}]`, status: 403 };
  }
  return { authorized: true, user };
}

export function authorizePermission(
  req: NextRequest | Request,
  permission: Permission
): { authorized: boolean; user: TokenPayload | null; error?: string; status?: number } {
  const user = getUserFromRequest(req);
  if (!user) {
    return { authorized: false, user: null, error: 'Unauthorized: Missing or invalid authentication token', status: 401 };
  }
  if (!hasPermission(user.role, permission)) {
    return { authorized: false, user, error: `Forbidden: Missing required permission [${permission}]`, status: 403 };
  }
  return { authorized: true, user };
}

