import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { generateAllParcels } from '../scripts/generate-data';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding LANDSTACK Database...');

  // 1. Clean existing records in correct order
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.fraudAlert.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.document.deleteMany();
  await prisma.utility.deleteMany();
  await prisma.restriction.deleteMany();
  await prisma.propertyTax.deleteMany();
  await prisma.buildingPermission.deleteMany();
  await prisma.landUse.deleteMany();
  await prisma.mortgage.deleteMany();
  await prisma.encumbrance.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.rorRecord.deleteMany();
  await prisma.ownershipRecord.deleteMany();
  await prisma.parcel.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Roles
  await prisma.role.createMany({
    data: [
      { name: 'ADMIN', description: 'System Administrator with full access to land records, audit logs, and fraud alerts' },
      { name: 'OFFICER', description: 'Revenue Officer / Tahasildar who verifies records, reviews disputes, and resolves conflicts' },
      { name: 'CITIZEN', description: 'Registered Citizen who can search parcels, request services, and track applications' },
    ],
  });

  // 3. Seed Users
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const hashedPasswordOfficer = await bcrypt.hash('officer123', 10);
  const hashedPasswordCitizen = await bcrypt.hash('citizen123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@landstack.demo',
      password: hashedPasswordAdmin,
      name: 'Dr. Ramesh Narayan (IAS)',
      phone: '+91 98450 00101',
      role: 'ADMIN',
      department: 'Revenue & Land Records Secretariat, Govt. of Karnataka',
    },
  });

  const officer = await prisma.user.create({
    data: {
      email: 'officer@landstack.demo',
      password: hashedPasswordOfficer,
      name: 'Shri Anand Kulkarni (KAS)',
      phone: '+91 98450 00202',
      role: 'OFFICER',
      department: 'Taluk Revenue Office & Cadastral Verification Cell',
    },
  });

  const citizen = await prisma.user.create({
    data: {
      email: 'citizen@landstack.demo',
      password: hashedPasswordCitizen,
      name: 'Priyanka Patil',
      phone: '+91 98450 00303',
      role: 'CITIZEN',
      department: 'General Public (Citizen Portal)',
    },
  });

  console.log('Created Demo Accounts:');
  console.log('  Admin:   admin@landstack.demo   (password: admin123)');
  console.log('  Officer: officer@landstack.demo (password: officer123)');
  console.log('  Citizen: citizen@landstack.demo (password: citizen123)');

  // 4. Generate & Seed Parcels
  const { parcels } = generateAllParcels();
  console.log(`Seeding ${parcels.length} parcels and their related records...`);

  for (let i = 0; i < parcels.length; i++) {
    const p = parcels[i];

    await prisma.parcel.create({
      data: {
        ulpin: p.ulpin,
        surveyNo: p.surveyNo,
        subDivision: p.subDivision,
        district: p.district,
        taluk: p.taluk,
        village: p.village,
        hobli: p.hobli,
        area: p.area,
        gisArea: p.gisArea,
        areaDifference: p.areaDifference,
        landUse: p.landUse,
        status: p.status,
        centroidLat: p.centroidLat,
        centroidLng: p.centroidLng,
        boundsJson: p.boundsJson,
        geojsonGeometry: JSON.stringify(p.geojsonGeometry),
        riskScore: p.riskScore,
        riskLevel: p.riskLevel,
        riskReasons: JSON.stringify(p.riskReasons),
        hasBoundaryOverlap: p.hasBoundaryOverlap,
        hasAreaMismatch: p.hasAreaMismatch,
        hasOwnershipConflict: p.hasOwnershipConflict,
        hasRegistrationConflict: p.hasRegistrationConflict,
        hasEncumbrance: p.hasEncumbrance,
        hasTaxIssue: p.hasTaxIssue,
      },
    });

    // Ownership Record
    await prisma.ownershipRecord.create({
      data: {
        parcelUlpin: p.ulpin,
        ownerName: p.ownerName,
        ownershipType: i % 5 === 0 ? 'Joint Family Holding' : (i % 7 === 0 ? 'State Government' : 'Individual Freehold'),
        ownershipStatus: p.hasOwnershipConflict ? 'Disputed in Revenue Court' : 'Verified',
        rorReference: `ROR/KA/${p.district.substring(0, 3).toUpperCase()}/${2023 + (i % 3)}/${1000 + i}`,
        mutationDate: `202${2 + (i % 4)}-0${(i % 9) + 1}-15`,
        mutationNumber: `MUT-MR-${2022 + (i % 4)}-${10000 + i}`,
        sharePercentage: 100.0,
        aadharMasked: `XXXX-XXXX-${3200 + (i % 6000)}`,
        contactNumber: `+91 9845${(100000 + i * 17).toString().substring(0, 6)}`,
      },
    });

    // RoR Record
    await prisma.rorRecord.create({
      data: {
        parcelUlpin: p.ulpin,
        khataNumber: `KHT-${p.village.substring(0, 3).toUpperCase()}-${300 + i}`,
        ownerName: p.ownerName,
        fatherHusbandName: `Sri ${['Mallappa', 'Shankarappa', 'Ningappa', 'Basappa', 'Hanumanthappa'][i % 5]}`,
        cultivatorName: p.landUse === 'Agricultural' ? p.ownerName : 'Non-Agricultural Use',
        tenancyType: p.landUse === 'Agricultural' ? 'Owner Cultivated (Khadim)' : 'Converted Urban Land',
        soilClassification: p.district === 'Belagavi' ? 'Deep Black Cotton Soil' : (p.district === 'Mysuru' ? 'Red Loamy Fertile Soil' : 'Medium Black Sandy Soil'),
        waterSource: p.landUse === 'Agricultural' ? (i % 2 === 0 ? 'Malaprabha / Kabini Canal' : 'Borewell 280ft') : 'KUWSDB Municipal Pipeline',
        dryWetGarden: p.landUse === 'Agricultural' ? (i % 2 === 0 ? 'Wet Land (Tari)' : 'Dry Land (Kushki)') : 'Commercial / Residential Converted',
        treeDetails: p.landUse === 'Agricultural' ? 'Teak: 4, Coconut: 18, Mango: 6' : 'Avenue Plantation: 6',
        liabilities: p.hasEncumbrance ? 'Active Bank Hypothecation registered' : 'Nil',
      },
    });

    // Registration Record
    const consideration = +(2500000 + (p.area * 1800000)).toFixed(0);
    await prisma.registration.create({
      data: {
        parcelUlpin: p.ulpin,
        registrationNumber: `REG-${p.district.substring(0, 3).toUpperCase()}-${2023 - (i % 5)}-${5000 + i}`,
        documentType: i % 4 === 0 ? 'Absolute Sale Deed' : (i % 6 === 0 ? 'Family Partition Deed' : 'Gift Deed with Settlement'),
        registrationDate: `202${1 + (i % 4)}-0${(i % 8) + 1}-2${i % 8}`,
        transactionStatus: p.hasRegistrationConflict ? 'UNDER_SCRUTINY' : 'COMPLETED',
        subRegistrarOffice: `Sub-Registrar Office, ${p.taluk}`,
        marketValue: +(consideration * 0.85).toFixed(0),
        considerationAmount: consideration,
        stampDutyPaid: +(consideration * 0.056).toFixed(0),
        previousOwner: `Sri ${['Gopal Rao', 'Vithalrao Joshi', 'Narayanaswamy', 'Chandrashekhar'][i % 4]}`,
        currentOwner: p.ownerName,
      },
    });

    // Encumbrance & Mortgage
    if (p.hasEncumbrance) {
      const bank = ['State Bank of India', 'Canara Bank', 'Union Bank of India', 'Bank of Baroda', 'Karnataka Bank'][i % 5];
      const loanAmount = +(1500000 + (i * 200000)).toFixed(0);
      await prisma.encumbrance.create({
        data: {
          parcelUlpin: p.ulpin,
          status: 'ACTIVE',
          encumbranceType: 'Simple Registered Mortgage',
          institution: bank,
          amount: loanAmount,
          startDate: `2022-0${(i % 9) + 1}-10`,
          endDate: `2032-0${(i % 9) + 1}-10`,
          documentReference: `ENC-MORT-${bank.substring(0, 3).toUpperCase()}-${9000 + i}`,
          remarks: `Charge created for term financing with pari-passu rights`,
        },
      });

      await prisma.mortgage.create({
        data: {
          parcelUlpin: p.ulpin,
          bankName: bank,
          loanAccountNumber: `LON-${50000000 + i * 137}`,
          sanctionedAmount: loanAmount,
          outstandingAmount: +(loanAmount * 0.78).toFixed(0),
          mortgageType: 'Equitable Mortgage by Deposit of Title Deeds',
          status: 'ACTIVE',
        },
      });
    } else {
      await prisma.encumbrance.create({
        data: {
          parcelUlpin: p.ulpin,
          status: 'NONE',
          encumbranceType: 'None',
          institution: 'Nil',
          amount: 0,
          remarks: 'No active encumbrance or lien reported as per Sub-Registrar Form 15 search',
        },
      });
    }

    // Land Use Record
    await prisma.landUse.create({
      data: {
        parcelUlpin: p.ulpin,
        currentLandUse: p.landUse,
        masterPlanZone: p.landUse === 'Residential' ? 'Comprehensive Master Plan - Residential High Density (R-HD)' :
          (p.landUse === 'Commercial' ? 'Commercial Arterial Corridor (C-2)' :
          (p.landUse === 'Industrial' ? 'KIADB Industrial Zone (I-3)' : 'Agriculture & Rural Green Belt')),
        conversionRequirement: p.landUse === 'Agricultural' ? 'Required for Non-Agri Development' : 'Approved under Sec 95 KLR Act',
        conversionOrderNumber: p.landUse !== 'Agricultural' ? `DC/LND/CONV/${2021 + (i % 3)}/${400 + i}` : null,
        permittedUses: p.landUse === 'Residential' ? 'Individual dwelling, Group housing, Community clinic' :
          (p.landUse === 'Commercial' ? 'Commercial complex, IT tech office, Retail shopping' : 'Organic farming, Horticulture, Agro-processing'),
        violationDetected: p.hasAreaMismatch || p.hasBoundaryOverlap,
      },
    });

    // Building Permission Record
    const bpStatus = i % 5 === 0 ? 'UNDER_REVIEW' : (i % 9 === 0 ? 'REJECTED' : 'APPROVED');
    await prisma.buildingPermission.create({
      data: {
        parcelUlpin: p.ulpin,
        applicationId: `BP-APP-${p.district.substring(0, 3).toUpperCase()}-${2024}-${800 + i}`,
        buildingType: p.landUse === 'Residential' ? 'Ground + 2 Floor Residential Villa' :
          (p.landUse === 'Commercial' ? 'Multi-storied Retail & Commercial Hub' : 'Agro-storage warehouse'),
        floors: p.landUse === 'Residential' ? 'G+2' : (p.landUse === 'Commercial' ? 'G+4' : 'G'),
        approvedBuiltupArea: +(p.area * 3200).toFixed(0),
        applicationDate: `2024-0${(i % 8) + 1}-08`,
        approvalDate: bpStatus === 'APPROVED' ? `2024-0${(i % 8) + 2}-20` : null,
        status: bpStatus,
        issuingAuthority: p.district === 'Belagavi' ? 'Belagavi Urban Development Authority (BUDA)' :
          (p.district === 'Mysuru' ? 'Mysuru Urban Development Authority (MUDA)' : 'Hubballi-Dharwad Urban Development Authority (HDUDA)'),
        completionCertificateNumber: bpStatus === 'APPROVED' ? `CC/UDA/${2024}/${1200 + i}` : null,
      },
    });

    // Property Tax
    const annualTax = p.annualTax;
    const paidAmount = p.taxStatus === 'PAID' ? annualTax : (p.taxStatus === 'PARTIAL' ? +(annualTax * 0.5).toFixed(0) : 0);
    const outstanding = +(annualTax - paidAmount).toFixed(0);
    await prisma.propertyTax.create({
      data: {
        parcelUlpin: p.ulpin,
        assessmentYear: '2025-2026',
        annualTax,
        paidAmount,
        outstandingAmount: outstanding,
        paymentStatus: p.taxStatus,
        lastPaymentDate: p.taxStatus !== 'OVERDUE' ? `2025-06-${10 + (i % 15)}` : null,
        receiptNumber: p.taxStatus !== 'OVERDUE' ? `TX-RCP-${p.district.substring(0, 3).toUpperCase()}-2025-${7000 + i}` : null,
      },
    });

    // Restrictions
    const hasRestriction = p.riskReasons.some(r => r.includes('River') || r.includes('Heritage') || r.includes('Catchment')) || i % 6 === 0;
    await prisma.restriction.create({
      data: {
        parcelUlpin: p.ulpin,
        zoneType: i % 3 === 0 ? 'Flood Zone' : (i % 3 === 1 ? 'Heritage Buffer Zone' : 'Road Reservation'),
        severity: hasRestriction ? 'HIGH' : 'LOW',
        description: hasRestriction
          ? 'Parcel boundary partially lies within buffer zone reservation under Urban Town Planning Bylaws'
          : 'Standard building setback norms apply; no statutory preservation easement',
        bufferDistanceMeters: hasRestriction ? 30.0 : 0.0,
        status: hasRestriction ? 'REVIEW_REQUIRED' : 'CLEARED',
        legalActReference: 'Karnataka Town and Country Planning Act, 1961 Section 14-A',
      },
    });

    // Utility Record
    await prisma.utility.create({
      data: {
        parcelUlpin: p.ulpin,
        electricityStatus: i % 8 === 0 ? 'Available' : 'Connected',
        electricityRrNumber: `HESCOM-${p.district.substring(0, 3).toUpperCase()}-${45000 + i}`,
        waterStatus: i % 4 === 0 ? 'Borewell' : 'Connected',
        sewerageStatus: p.landUse === 'Agricultural' ? 'Not Applicable' : (i % 3 === 0 ? 'Septic Tank' : 'Connected'),
        roadAccessStatus: i % 9 === 0 ? 'Landlocked (Cart Track Access)' : (i % 2 === 0 ? 'Paved 40ft Main Road' : 'Bitumen 30ft Road'),
        internetFiberStatus: i % 5 === 0 ? 'Underway' : 'Fiber Ready (BSNL/Jio)',
      },
    });

    // Sample Document
    await prisma.document.create({
      data: {
        parcelUlpin: p.ulpin,
        title: `Cadastral Tippani & RTC Extract - Survey ${p.surveyNo}`,
        documentType: 'RoR Extract',
        fileUrl: `/documents/rtc-extract-${p.ulpin}.pdf`,
        verificationHash: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`,
      },
    });
  }

  // 5. Seed Disputes (at least 6 realistic disputes)
  const disputedParcels = parcels.filter(p => p.hasOwnershipConflict || p.status === 'DISPUTED').slice(0, 8);
  for (let idx = 0; idx < disputedParcels.length; idx++) {
    const dp = disputedParcels[idx];
    await prisma.dispute.create({
      data: {
        disputeNumber: `DIS-2026-${(1001 + idx).toString()}`,
        parcelUlpin: dp.ulpin,
        surveyNumber: dp.surveyNo,
        citizenName: idx % 2 === 0 ? 'Shri Manjunath K. Gowda' : 'Smt. Shailaja B. Patil',
        disputeType: idx % 3 === 0 ? 'Boundary Dispute' : (idx % 3 === 1 ? 'Ownership Dispute' : 'Registration Dispute'),
        description: `Dispute filed regarding survey boundary demarcation and encroachment allegation on parcel ${dp.ulpin}.`,
        assignedOfficer: 'Assistant Commissioner (Revenue Sub-Division)',
        status: idx % 2 === 0 ? 'OPEN' : 'UNDER_INVESTIGATION',
        remarks: 'Physical total station resurvey ordered by Tahasildar.',
      },
    });
  }

  // 6. Seed Service Requests (8 realistic citizen requests)
  const serviceTypes = [
    'Ownership Verification',
    'Land Record Information',
    'Mutation Request',
    'Encumbrance Information',
    'Land Use Information',
    'Building Permission Information',
    'Property Tax Information',
    'Dispute Submission',
  ];
  for (let s = 0; s < 8; s++) {
    const sp = parcels[s * 3];
    await prisma.serviceRequest.create({
      data: {
        requestNumber: `REQ-2026-00000${s + 1}`,
        parcelUlpin: sp.ulpin,
        citizenId: citizen.id,
        citizenName: 'Priyanka Patil',
        citizenEmail: 'citizen@landstack.demo',
        citizenPhone: '+91 98450 00303',
        serviceType: serviceTypes[s % serviceTypes.length],
        status: s === 0 ? 'SUBMITTED' : (s === 1 ? 'UNDER_REVIEW' : (s === 2 ? 'DOCUMENT_VERIFICATION' : (s === 3 ? 'OFFICER_REVIEW' : 'COMPLETED'))),
        remarks: s === 4 ? 'Verified against digital cadastral index and signed with DSC.' : 'Documents uploaded by applicant pending inspection.',
        assignedOfficer: 'Shri Anand Kulkarni (KAS)',
      },
    });
  }

  // 7. Seed Fraud Alerts / Potential Data Conflicts
  const conflictParcels = parcels.filter(p => p.riskScore > 40).slice(0, 10);
  for (let f = 0; f < conflictParcels.length; f++) {
    const cp = conflictParcels[f];
    await prisma.fraudAlert.create({
      data: {
        alertNumber: `ALR-2026-${(1001 + f).toString()}`,
        parcelUlpin: cp.ulpin,
        conflictType: cp.hasBoundaryOverlap ? 'Boundary Overlap' : (cp.hasAreaMismatch ? 'Area Mismatch' : (cp.hasOwnershipConflict ? 'Ownership Conflict' : 'Registration Conflict')),
        severity: cp.riskLevel,
        reason: cp.riskReasons[0] || 'Anomaly detected during automated spatial-cadastral consistency check.',
        detectedDate: '2026-02-14',
        status: f === 0 ? 'OPEN' : (f === 1 ? 'UNDER_REVIEW' : (f === 2 ? 'RESOLVED' : 'OPEN')),
        assignedOfficer: 'District Vigilance Officer',
        remarks: f === 2 ? 'Physical resurvey cleared the discrepancy; records reconciled.' : 'Verification notice dispatched to registered owner.',
      },
    });
  }

  // 8. Seed Audit Logs
  const auditActions = [
    { action: 'LOGIN', type: 'AUTH', by: 'admin@landstack.demo', role: 'ADMIN', details: 'Administrator logged into GIS Governance Portal' },
    { action: 'PARCEL_CREATED', type: 'PARCEL', by: 'admin@landstack.demo', role: 'ADMIN', details: 'Batch ingested 110 cadastral polygons into GeoJSON index' },
    { action: 'OWNERSHIP_UPDATED', type: 'OWNERSHIP', by: 'officer@landstack.demo', role: 'OFFICER', details: 'Updated mutation index for Belagavi Taluk' },
    { action: 'SERVICE_CREATED', type: 'SERVICE', by: 'citizen@landstack.demo', role: 'CITIZEN', details: 'Submitted service request REQ-2026-000001' },
    { action: 'FRAUD_REVIEWED', type: 'ALERT', by: 'officer@landstack.demo', role: 'OFFICER', details: 'Reviewed potential boundary conflict ALR-2026-1001' },
    { action: 'DOCUMENT_GENERATED', type: 'REPORT', by: 'citizen@landstack.demo', role: 'CITIZEN', details: 'Downloaded PDF Land Card for KA-BLG-001-000101' },
  ];

  for (let a = 0; a < auditActions.length; a++) {
    const act = auditActions[a];
    await prisma.auditLog.create({
      data: {
        action: act.action,
        entityType: act.type,
        entityId: parcels[a]?.ulpin || 'SYSTEM',
        parcelUlpin: parcels[a]?.ulpin,
        performedBy: act.by,
        userRole: act.role,
        details: act.details,
      },
    });
  }

  // 9. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: citizen.id,
        title: 'Application REQ-2026-000001 Received',
        message: 'Your request for Ownership Verification on parcel KA-BLG-001-000101 has been logged and assigned to Tahasildar.',
        type: 'SUCCESS',
      },
      {
        userId: officer.id,
        title: 'New Spatial Conflict Detected',
        message: 'Potential boundary conflict detected between parcels KA-BLG-001-000105 and KA-BLG-001-000106.',
        type: 'ALERT',
      },
      {
        userId: admin.id,
        title: 'System Health & GIS Audit Check',
        message: 'Spatial index synchronization completed for Belagavi, Mysuru, and Dharwad districts.',
        type: 'INFO',
      },
    ],
  });

  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
