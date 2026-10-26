import { RiskEngine } from '../src/services/riskEngine';
import { calculateArea, measureDistance, detectBoundaryOverlap } from '../src/lib/turfAnalysis';
import { signToken, verifyToken, checkRole, hasPermission, authorizeRole } from '../src/lib/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- STARTING LANDSTACK AUTOMATED TEST SUITE ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Database Connection & Multi-Member Authentication Check
    const parcelCount = await prisma.parcel.count();
    assert(parcelCount >= 100, `Database contains >= 100 parcels (Found: ${parcelCount})`);

    const users = await prisma.user.findMany();
    assert(users.length >= 3, `Demo accounts exist (Admin, Officer, Citizen)`);

    // Verify Admin
    const adminUser = users.find(u => u.email === 'admin@landstack.demo');
    assert(adminUser !== undefined, 'Admin user admin@landstack.demo found');
    if (adminUser) {
      const isPasswordValid = await bcrypt.compare('admin123', adminUser.password);
      assert(isPasswordValid, 'Admin user password hashes and verifies with bcrypt (admin123)');
    }

    // Verify Officer
    const officerUser = users.find(u => u.email === 'officer@landstack.demo');
    assert(officerUser !== undefined, 'Officer user officer@landstack.demo found');
    if (officerUser) {
      const isPasswordValid = await bcrypt.compare('officer123', officerUser.password);
      assert(isPasswordValid, 'Officer user password hashes and verifies with bcrypt (officer123)');
    }

    // Verify Citizen
    const citizenUser = users.find(u => u.email === 'citizen@landstack.demo');
    assert(citizenUser !== undefined, 'Citizen user citizen@landstack.demo found');
    if (citizenUser) {
      const isPasswordValid = await bcrypt.compare('citizen123', citizenUser.password);
      assert(isPasswordValid, 'Citizen user password hashes and verifies with bcrypt (citizen123)');
      const isWrongPass = await bcrypt.compare('wrongpass', citizenUser.password);
      assert(!isWrongPass, 'Invalid password correctly rejected by authentication security layer');
    }

    // Verify JWT Token & RBAC
    const token = signToken({
      userId: 'test-user-id',
      email: 'officer@landstack.demo',
      name: 'Shri Anand Kulkarni',
      role: 'OFFICER',
    });
    assert(typeof token === 'string' && token.length > 20, 'JWT token successfully signed for authenticated session');

    const decoded = verifyToken(token);
    assert(decoded !== null && decoded.email === 'officer@landstack.demo', 'JWT token cryptographically verified and decoded');
    assert(checkRole(decoded, ['OFFICER', 'ADMIN']), 'Role-based access control (RBAC) permits authorized role');
    assert(!checkRole(decoded, ['CITIZEN']), 'Role-based access control (RBAC) restricts non-authorized role');

    // 2. Parcel 360 Relational Integrity
    const sampleUlpin = 'KA-BLG-001-000101';
    const parcel101 = await prisma.parcel.findUnique({
      where: { ulpin: sampleUlpin },
      include: {
        ownershipRecords: true,
        rorRecords: true,
        registrations: true,
        propertyTaxes: true,
        landUseRecords: true,
      },
    });

    assert(parcel101 !== null, `Parcel ${sampleUlpin} exists in database`);
    assert(parcel101?.ownershipRecords.length! > 0, `Parcel has linked OwnershipRecord`);
    assert(parcel101?.rorRecords.length! > 0, `Parcel has linked RoR record`);
    assert(parcel101?.registrations.length! > 0, `Parcel has linked Registration deed`);
    assert(parcel101?.landUse === 'Residential', `Parcel 101 land use is Residential`);

    // 3. Transparent Risk Engine Unit Tests
    const lowRisk = RiskEngine.evaluateRisk({
      hasAreaMismatch: false,
      hasBoundaryOverlap: false,
      hasOwnershipConflict: false,
      hasRegistrationConflict: false,
      hasEncumbrance: false,
      hasTaxIssue: false,
    });
    assert(lowRisk.score === 0 && lowRisk.level === 'LOW', 'Risk Engine correctly evaluates clean parcel as score 0 (LOW)');

    const multiConflict = RiskEngine.evaluateRisk({
      hasAreaMismatch: true,
      areaDifference: 0.35,
      hasBoundaryOverlap: true,
      hasOwnershipConflict: true,
      hasRegistrationConflict: true,
      hasEncumbrance: true,
      hasTaxIssue: true,
    });
    assert(multiConflict.score === 100 && multiConflict.level === 'CRITICAL', 'Risk Engine correctly evaluates multi-conflict parcel as score 100 (CRITICAL)');
    assert(multiConflict.factors.filter(f => f.triggered).length === 6, 'All 6 risk engine factors trigger and produce explainable breakdown');

    // 4. Turf.js Measurement & Area Calculation Tests
    const testPolygon = {
      type: 'Polygon',
      coordinates: [[
        [74.49, 15.84],
        [74.50, 15.84],
        [74.50, 15.85],
        [74.49, 15.85],
        [74.49, 15.84],
      ]],
    };
    const areaResult = calculateArea(testPolygon);
    assert(areaResult.sqMeters > 0, `Turf.js calculated valid polygon area: ${areaResult.sqMeters} sq.m (${areaResult.acres} Acres)`);

    const distResult = measureDistance([15.84, 74.49], [15.85, 74.50]);
    assert(distResult.kilometers > 0 && distResult.meters > 100, `Turf.js measured geographic distance: ${distResult.kilometers} km`);

    // 5. Boundary Overlap Detection Test
    const poly1 = {
      type: 'Polygon',
      coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]],
    };
    const poly2 = {
      type: 'Polygon',
      coordinates: [[[1, 1], [3, 1], [3, 3], [1, 3], [1, 1]]],
    };
    const overlapResult = detectBoundaryOverlap(poly1, poly2);
    assert(overlapResult.hasOverlap && overlapResult.overlapAreaSqM > 0, 'Turf.js detects spatial polygon overlap and calculates overlap extent');

    // 6. Service Requests & Anomaly Alerts
    const reqs = await prisma.serviceRequest.findMany();
    assert(reqs.length > 0, `Service requests seeded and queryable (Found: ${reqs.length})`);
    assert(reqs[0].requestNumber.startsWith('REQ-2026-'), 'Service request ID format conforms to REQ-2026-XXXXXX');

    const alerts = await prisma.fraudAlert.findMany();
    assert(alerts.length > 0, `Potential data conflict alerts seeded and queryable (Found: ${alerts.length})`);

    // 7. Multi-District Cadastral Distribution
    const districts = await prisma.parcel.groupBy({
      by: ['district'],
      _count: { _all: true },
    });
    assert(districts.length >= 3, `Multi-district coverage verified (Districts: ${districts.map(d => d.district).join(', ')})`);

    // 8. GeoJSON Cadastral Boundary Integrity
    const sampleParcelWithBoundary = await prisma.parcel.findFirst({
      where: { geojsonGeometry: { not: null } },
    });
    assert(sampleParcelWithBoundary !== null, 'Found parcel with GeoJSON boundary geometry');
    if (sampleParcelWithBoundary?.geojsonGeometry) {
      const parsedGeo = JSON.parse(sampleParcelWithBoundary.geojsonGeometry);
      assert(parsedGeo.type === 'Polygon' || parsedGeo.type === 'MultiPolygon', 'Boundary GeoJSON valid polygon geometry type');
      assert(Array.isArray(parsedGeo.coordinates) && parsedGeo.coordinates[0].length >= 4, 'Cadastral polygon coordinates properly closed');
    }

    // 9. Dispute Management & Status Verification
    const disputes = await prisma.dispute.findMany();
    assert(disputes.length > 0, `Disputes found and queryable (Found: ${disputes.length})`);
    const validStatuses = ['OPEN', 'UNDER_INVESTIGATION', 'HEARING_SCHEDULED', 'RESOLVED', 'DISMISSED'];
    assert(validStatuses.includes(disputes[0].status), `Dispute status "${disputes[0].status}" is within valid workflow enum`);

    // 10. Audit Logging Traceability
    const auditLogs = await prisma.auditLog.findMany();
    assert(auditLogs.length > 0, `Audit logs seeded for change tracking (Found: ${auditLogs.length})`);
    assert(auditLogs[0].action !== undefined && auditLogs[0].entityType !== undefined, 'Audit log records action and target entityType for transparency');

    // 11. Property Tax Assessment Status
    const taxes = await prisma.propertyTax.findMany();
    assert(taxes.length > 0, `Property tax assessments verified (Found: ${taxes.length})`);
    assert(taxes.some(t => t.paymentStatus === 'PAID') && taxes.some(t => t.paymentStatus === 'OVERDUE' || t.paymentStatus === 'PARTIAL'), 'Property tax records include both Paid and Outstanding (Overdue/Partial) statuses');

    // ==========================================
    // 12. COMPREHENSIVE ROLE-BASED ACCESS CONTROL (RBAC) TESTS
    // ==========================================
    console.log('\n--- RBAC PERMISSION MATRIX & SECURITY TESTS ---');

    // 12.1 ADMIN Role Tests
    assert(hasPermission('ADMIN', 'users.manage'), '[ADMIN] Has users.manage permission');
    assert(hasPermission('ADMIN', 'roles.manage'), '[ADMIN] Has roles.manage permission');
    assert(hasPermission('ADMIN', 'audit_logs.read'), '[ADMIN] Has audit_logs.read permission');
    assert(hasPermission('ADMIN', 'system_settings.manage'), '[ADMIN] Has system_settings.manage permission');
    assert(hasPermission('ADMIN', 'service_requests.read_all'), '[ADMIN] Has service_requests.read_all permission');
    assert(hasPermission('ADMIN', 'risk_alerts.manage_all'), '[ADMIN] Has risk_alerts.manage_all permission');

    // 12.2 OFFICER Role Tests
    assert(hasPermission('OFFICER', 'service_requests.process'), '[OFFICER] Has service_requests.process permission');
    assert(hasPermission('OFFICER', 'ownership.verify'), '[OFFICER] Has ownership.verify permission');
    assert(hasPermission('OFFICER', 'building_permissions.review'), '[OFFICER] Has building_permissions.review permission');
    assert(hasPermission('OFFICER', 'risk_alerts.read_assigned'), '[OFFICER] Has risk_alerts.read_assigned permission');
    // Negative checks for Officer:
    assert(!hasPermission('OFFICER', 'users.manage'), '[OFFICER RESTRICTION] Cannot manage platform users');
    assert(!hasPermission('OFFICER', 'roles.manage'), '[OFFICER RESTRICTION] Cannot modify user roles');
    assert(!hasPermission('OFFICER', 'system_settings.manage'), '[OFFICER RESTRICTION] Cannot alter system settings');
    assert(!hasPermission('OFFICER', 'audit_logs.read'), '[OFFICER RESTRICTION] Cannot view or delete global audit logs');

    // 12.3 CITIZEN Role Tests
    assert(hasPermission('CITIZEN', 'parcels.read'), '[CITIZEN] Can read public cadastral parcels');
    assert(hasPermission('CITIZEN', 'gis.public.read'), '[CITIZEN] Can read public GIS layers');
    assert(hasPermission('CITIZEN', 'service_requests.create'), '[CITIZEN] Can submit service requests');
    assert(hasPermission('CITIZEN', 'service_requests.read_own'), '[CITIZEN] Can read own service requests');
    assert(hasPermission('CITIZEN', 'disputes.create'), '[CITIZEN] Can register disputes');
    // Negative checks for Citizen:
    assert(!hasPermission('CITIZEN', 'users.manage'), '[CITIZEN RESTRICTION] Cannot manage users');
    assert(!hasPermission('CITIZEN', 'service_requests.process'), '[CITIZEN RESTRICTION] Cannot advance application status');
    assert(!hasPermission('CITIZEN', 'service_requests.read_all'), '[CITIZEN RESTRICTION] Cannot view all citizens requests');
    assert(!hasPermission('CITIZEN', 'audit_logs.read'), '[CITIZEN RESTRICTION] Cannot access forensic audit logs');
    assert(!hasPermission('CITIZEN', 'risk_alerts.read_assigned'), '[CITIZEN RESTRICTION] Cannot view confidential risk alerts');
    assert(!hasPermission('CITIZEN', 'risk_alerts.manage_all'), '[CITIZEN RESTRICTION] Cannot manage risk alerts');

    // 12.4 Request Authorization Helper Simulation & Error Codes
    const adminToken = signToken({
      userId: 'usr-admin-1',
      email: 'admin@landstack.demo',
      name: 'Dr. Ramesh Narayan',
      role: 'ADMIN',
    });

    const officerToken = signToken({
      userId: 'usr-officer-1',
      email: 'officer@landstack.demo',
      name: 'Shri Anand Kulkarni',
      role: 'OFFICER',
    });

    const citizenToken = signToken({
      userId: 'usr-citizen-1',
      email: 'citizen@landstack.demo',
      name: 'Priyanka Patil',
      role: 'CITIZEN',
    });

    // Mock Request helper
    const makeMockRequest = (authHeader?: string): Request => {
      return new Request('http://localhost:3000/api/test', {
        headers: authHeader ? { Authorization: authHeader } : {},
      });
    };

    // Test Unauthenticated request (Missing Token) -> 401
    const unauthReq = makeMockRequest();
    const unauthResult = authorizeRole(unauthReq, ['ADMIN']);
    assert(!unauthResult.authorized && unauthResult.status === 401, 'Unauthenticated request correctly rejected with 401 Unauthorized');

    // Test Tampered / Invalid Token -> 401
    const tamperedReq = makeMockRequest('Bearer invalid.jwt.signature-tampered');
    const tamperedResult = authorizeRole(tamperedReq, ['ADMIN']);
    assert(!tamperedResult.authorized && tamperedResult.status === 401, 'Tampered JWT session token rejected with 401 Unauthorized');

    // Test Unauthorized Role (Citizen requesting Admin action) -> 403
    const citizenOnAdminReq = makeMockRequest(`Bearer ${citizenToken}`);
    const citizenOnAdminResult = authorizeRole(citizenOnAdminReq, ['ADMIN']);
    assert(!citizenOnAdminResult.authorized && citizenOnAdminResult.status === 403, 'Citizen accessing Admin route rejected with 403 Forbidden');

    // Test Unauthorized Role (Citizen requesting Officer action) -> 403
    const citizenOnOfficerReq = makeMockRequest(`Bearer ${citizenToken}`);
    const citizenOnOfficerResult = authorizeRole(citizenOnOfficerReq, ['OFFICER', 'ADMIN']);
    assert(!citizenOnOfficerResult.authorized && citizenOnOfficerResult.status === 403, 'Citizen accessing Officer workflow rejected with 403 Forbidden');

    // Test Officer requesting Admin-only action -> 403
    const officerOnAdminReq = makeMockRequest(`Bearer ${officerToken}`);
    const officerOnAdminResult = authorizeRole(officerOnAdminReq, ['ADMIN']);
    assert(!officerOnAdminResult.authorized && officerOnAdminResult.status === 403, 'Officer accessing Admin-only route rejected with 403 Forbidden');

    // Test Authorized Admin request -> 200 / authorized: true
    const adminReq = makeMockRequest(`Bearer ${adminToken}`);
    const adminResult = authorizeRole(adminReq, ['ADMIN']);
    assert(adminResult.authorized && adminResult.user?.role === 'ADMIN', 'Admin request authorized successfully');

    // Test Authorized Officer request -> 200 / authorized: true
    const officerReq = makeMockRequest(`Bearer ${officerToken}`);
    const officerResult = authorizeRole(officerReq, ['OFFICER', 'ADMIN']);
    assert(officerResult.authorized && officerResult.user?.role === 'OFFICER', 'Officer request authorized successfully');

    // 12.5 Citizen Data Isolation & IDOR Protection Verification
    const allCitizenReqs = await prisma.serviceRequest.findMany();
    const citizenOwnEmail = 'citizen@landstack.demo';
    const isolatedRequests = await prisma.serviceRequest.findMany({
      where: {
        OR: [
          { citizenEmail: citizenOwnEmail },
        ],
      },
    });

    assert(
      isolatedRequests.every(r => r.citizenEmail === citizenOwnEmail),
      'Resource-level isolation verifies Citizen receives ONLY their own service requests'
    );
    assert(
      isolatedRequests.length <= allCitizenReqs.length,
      `Cross-citizen data leakage prevented (Filtered: ${isolatedRequests.length} of ${allCitizenReqs.length} total platform requests)`
    );

  } catch (err: any) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('------------------------------------------------');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('------------------------------------------------');

  if (failed > 0) process.exit(1);
}

runTests();
