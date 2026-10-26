import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { saveOrOpenPdf } from './pdfHelper';

export interface DocumentParcelData {
  ulpin: string;
  surveyNo: string;
  subDivision?: string | null;
  district?: string;
  taluk?: string;
  village?: string;
  hobli?: string | null;
  area: number;
  gisArea?: number | null;
  landUse?: string;
  status?: string;
  centroidLat?: number;
  centroidLng?: number;
  ownershipRecords?: any[];
  rorRecords?: any[];
  registrations?: any[];
  encumbrances?: any[];
  landUseRecords?: any[];
  buildingPermissions?: any[];
  propertyTaxes?: any[];
  restrictions?: any[];
  utilities?: any[];
  serviceRequests?: any[];
  disputes?: any[];
}

// Helper to draw standard government header & footer
async function drawGovHeaderAndFooter(
  doc: jsPDF,
  title: string,
  subTitle: string,
  formRef: string,
  ulpin: string
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top Government Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 34, 'F');

  // Emblem and Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('GOVERNMENT OF KARNATAKA — REVENUE DEPARTMENT', pageWidth / 2, 11, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(191, 219, 254); // blue-200
  doc.text('KADASTRA INTEGRATED DIGITAL LAND CADASTRE (LANDSTACK)', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(253, 224, 71); // yellow-300
  doc.text(title.toUpperCase(), pageWidth / 2, 26, { align: 'center' });

  // Form reference on top right
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(`REF: ${formRef}`, pageWidth - 14, 11, { align: 'right' });
  doc.text(`ULPIN: ${ulpin}`, pageWidth - 14, 17, { align: 'right' });

  // Verification QR Code
  try {
    const verifyUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/verify/${ulpin}`
      : `https://landstack.gov.demo/verify/${ulpin}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 100,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
    doc.addImage(qrDataUrl, 'PNG', pageWidth - 36, 38, 24, 24);
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Scan to Verify Online', pageWidth - 24, 65, { align: 'center' });
  } catch (err) {
    console.warn('QR code generation skipped:', err);
  }

  // Bottom Disclaimer Footer
  doc.setFillColor(254, 242, 242);
  doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');
  doc.setDrawColor(239, 68, 68);
  doc.line(0, pageHeight - 14, pageWidth, pageHeight - 14);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text(
    'DEMO DOCUMENT — NOT AN OFFICIAL GOVERNMENT LAND RECORD',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Generated for MCA Academic Project Demonstration. Cryptographically simulated digital extract.',
    pageWidth / 2,
    pageHeight - 4,
    { align: 'center' }
  );
}

// 1. RTC EXTRACT (Form 16 / Bhoomi Style)
export async function downloadRtcExtractPdf(parcel: DocumentParcelData, openInNewTab = false) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const district = parcel.district || 'Belagavi';
  const taluk = parcel.taluk || 'Belagavi';
  const village = parcel.village || 'Demo Village';
  const surveyNo = parcel.surveyNo || '101';
  const area = typeof parcel.area === 'number' ? parcel.area : 1.0;
  const gisArea = typeof parcel.gisArea === 'number' ? parcel.gisArea : area;

  await drawGovHeaderAndFooter(
    doc,
    'RECORD OF RIGHTS, TENANCY AND CROPS (RTC / FORM 16)',
    'Rule 58 of Karnataka Land Revenue Rules, 1966',
    'RTC-F16-2026',
    parcel.ulpin
  );

  let y = 42;
  const owner = parcel.ownershipRecords?.[0];
  const ror = parcel.rorRecords?.[0];

  // Administrative Location Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 54, 28, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('I. ADMINISTRATIVE & CADASTRAL LOCATION', 18, y + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`District: ${district}`, 18, y + 13);
  doc.text(`Taluk: ${taluk}`, 70, y + 13);
  doc.text(`Hobli: ${parcel.hobli || 'Central Hobli'}`, 115, y + 13);
  doc.text(`Village: ${village}`, 18, y + 20);
  doc.text(`Survey No: ${surveyNo}`, 70, y + 20);
  doc.text(`Hissa / Sub-Division: ${parcel.subDivision || '1'}`, 115, y + 20);

  y += 34;

  // Extent & Assessment
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('II. LAND EXTENT & LAND REVENUE ASSESSMENT', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Legal Extent: ${area} Acres`, 18, y + 13);
  doc.text(`GIS Survey Extent: ${gisArea} Acres`, 70, y + 13);
  doc.text(`Cultivable Area: ${(area * 0.95).toFixed(2)} Acres`, 130, y + 13);
  doc.text(`Kharab (Uncultivable): ${(area * 0.05).toFixed(2)} Acres`, 18, y + 19);
  doc.text(`Soil Classification: ${ror?.soilClassification || ror?.soilType || 'Black Cotton / Medium Clay'}`, 70, y + 19);
  doc.text(`Annual Assessment: Rs. ${(area * 145).toFixed(2)}`, 130, y + 19);

  y += 30;

  // Ownership Details
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('III. KHATADAR & OWNERSHIP PARTICULARS (COL 9 & 10)', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Khatadar / Owner Name:', 18, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${owner?.ownerName || 'Sri Basavaraj Patil'} (Khata No: ${owner?.khataNumber || ror?.khataNumber || 'KT-8821'})`, 60, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text("Relationship / Father's Name:", 18, y + 19);
  doc.text(`${owner?.fatherOrHusbandName || ror?.fatherHusbandName || 'Sri Mallappa Patil'}`, 60, y + 19);

  doc.text('Ownership Share / Right:', 18, y + 25);
  doc.text(`${owner?.share || '100% (Single Ownership)'} — Mode: ${owner?.acquisitionMode || 'Inheritance / Succession'}`, 60, y + 25);

  y += 38;

  // Tenancy & Cultivation Details
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('IV. CULTIVATION DETAILS & CROPS (PAHANI / COL 12)', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Cultivator Name: ${ror?.cultivatorName || owner?.ownerName || 'Self (Owner Cultivated)'}`, 18, y + 13);
  doc.text('Season: Kharif & Rabi 2025-26', 115, y + 13);
  doc.text(`Primary Crop: ${ror?.cropName || (parcel.landUse === 'Agricultural' ? 'Sugarcane / Jowar' : 'Built-up / Converted')}`, 18, y + 20);
  doc.text(`Irrigation Source: ${ror?.waterSource || 'Borewell / Municipal Pipeline'}`, 115, y + 20);

  y += 34;

  // Mutation & Liabilities / Encumbrances
  const enc = parcel.encumbrances?.[0];
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('V. MUTATION REGISTER (MR) & LIABILITIES / LIENS (COL 11)', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Last Certified Mutation: ${owner?.mutationNumber || 'MR-T12/2021-22'} (Dated: ${owner?.mutationDate || '2021-09-14'})`, 18, y + 13);
  doc.text('Encumbrance Status:', 18, y + 20);
  if (enc && enc.status === 'ACTIVE') {
    doc.setTextColor(185, 28, 28);
    doc.setFont('helvetica', 'bold');
    doc.text(`ACTIVE LIEN: ${enc.institution} (Loan: Rs. ${enc.amount?.toLocaleString('en-IN')})`, 50, y + 20);
  } else {
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.text('NIL (No registered encumbrances or bank hypothecation)', 50, y + 20);
  }

  y += 34;

  // Digital Signature Seal
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('SHA-256 DIGITAL HASH: e4b29c9a8f103b4481029c7882aa911b302847291a0c71a39f', 14, y);
  doc.text(`ISSUED BY: KADASTRA Bhoomi-GIS Digital Engine | Timestamp: ${new Date().toISOString()}`, 14, y + 4);

  return saveOrOpenPdf(doc, `RTC_Extract_${parcel.ulpin}.pdf`, openInNewTab);
}

// 2. CADASTRAL SURVEY TIPPANI MAP
export async function downloadTippaniMapPdf(parcel: DocumentParcelData, openInNewTab = false) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const district = parcel.district || 'Belagavi';
  const taluk = parcel.taluk || 'Belagavi';
  const village = parcel.village || 'Demo Village';
  const surveyNo = parcel.surveyNo || '101';
  const area = typeof parcel.area === 'number' ? parcel.area : 1.0;
  const gisArea = typeof parcel.gisArea === 'number' ? parcel.gisArea : area;

  // Top Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DEPARTMENT OF SURVEY, SETTLEMENT AND LAND RECORDS', pageWidth / 2, 10, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(147, 197, 253);
  doc.text(`CADASTRAL SURVEY TIPPANI EXTRACT — ULPIN: ${parcel.ulpin}`, pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(253, 224, 71);
  doc.text(`SURVEY NO: ${surveyNo} | VILLAGE: ${village.toUpperCase()} | TALUK: ${taluk.toUpperCase()}`, pageWidth / 2, 24, { align: 'center' });

  // Cadastral Map Canvas Box
  doc.setDrawColor(30, 41, 59);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 34, 180, 130, 2, 2, 'FD');

  // Simulated Polygon Drawing using native doc.lines
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.8);
  doc.setFillColor(239, 246, 255);
  doc.lines(
    [
      [120, -5],
      [15, 75],
      [-55, 30],
      [-70, -15],
      [-10, -85],
    ],
    40,
    50,
    [1, 1],
    'FD',
    true
  );

  // Survey Stations / Boundary Nodes
  const nodes = [
    { label: 'A (Station 1)', x: 40, y: 50 },
    { label: 'B (Station 2)', x: 160, y: 45 },
    { label: 'C (Station 3)', x: 175, y: 120 },
    { label: 'D (Station 4)', x: 120, y: 150 },
    { label: 'E (Station 5)', x: 50, y: 135 },
  ];

  nodes.forEach((n) => {
    doc.setFillColor(239, 68, 68);
    doc.circle(n.x, n.y, 2, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(n.label, n.x + 3, n.y - 2);
  });

  // Centroid Label
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(`SY NO: ${surveyNo}`, 100, 95, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Area: ${area} Acres (${gisArea} Acres GIS)`, 100, 102, { align: 'center' });
  doc.text(`Centroid: [${parcel.centroidLat?.toFixed(4) || '15.8497'}, ${parcel.centroidLng?.toFixed(4) || '74.4977'}]`, 100, 108, { align: 'center' });

  // North Arrow
  doc.setFillColor(15, 23, 42);
  doc.triangle(180, 50, 177, 65, 183, 65, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('N', 180, 46, { align: 'center' });

  // Right Hand Measurement & Coordinate Data Table
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(200, 34, 84, 130, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('BOUNDARIES & TRAVERSE', 205, 42);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('North Boundary: Adjacent to Sy No. 102 (124.5 m)', 205, 52);
  doc.text('South Boundary: Paved 40ft Village Road (118.2 m)', 205, 60);
  doc.text('East Boundary: Sy No. 105/A (96.8 m)', 205, 68);
  doc.text('West Boundary: Canal Buffer / Sy No. 99 (88.4 m)', 205, 76);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('SURVEY SPECIFICATIONS', 205, 90);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Coordinate System: EPSG:4326 (WGS84)', 205, 98);
  doc.text('Survey Method: DGPS + ETS Cadastral Resurvey', 205, 106);
  doc.text('Survey Date: 2024-03-15', 205, 114);
  doc.text('Surveyor: Shri M. N. Gasti (Licensed ADLR)', 205, 122);
  doc.text('Status: Digitally Geo-referenced & Verified', 205, 130);

  // Bottom Disclaimer
  doc.setFillColor(254, 242, 242);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text('DEMO CADASTRAL MAP — NOT AN OFFICIAL SURVEY DEPARTMENT TIPPANI', pageWidth / 2, pageHeight - 5, { align: 'center' });

  return saveOrOpenPdf(doc, `Cadastral_Tippani_${parcel.ulpin}.pdf`, openInNewTab);
}

// 3. REGISTERED SALE DEED EXTRACT
export async function downloadSaleDeedPdf(parcel: DocumentParcelData, openInNewTab = false) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const district = parcel.district || 'Belagavi';
  const taluk = parcel.taluk || 'Belagavi';
  const village = parcel.village || 'Demo Village';
  const surveyNo = parcel.surveyNo || '101';
  const area = typeof parcel.area === 'number' ? parcel.area : 1.0;

  await drawGovHeaderAndFooter(
    doc,
    'CERTIFIED COPY OF REGISTERED TITLE DEED',
    'Department of Stamps & Registration (Kaveri Integrated Platform)',
    'DEED-REG-2026',
    parcel.ulpin
  );

  let y = 42;
  const reg = parcel.registrations?.[0];
  const owner = parcel.ownershipRecords?.[0];

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 54, 24, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('I. REGISTRATION DOCKET & SUB-REGISTRAR DETAILS', 18, y + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Document No: ${reg?.registrationNumber || reg?.deedNumber || 'BK-1-8842/2021'}`, 18, y + 13);
  doc.text(`Sub-Registrar Office: ${reg?.subRegistrarOffice || taluk + ' SRO'}`, 80, y + 13);
  doc.text(`Registration Date: ${reg?.registrationDate || '2021-08-20'}`, 18, y + 19);
  doc.text('Book / Volume: Book 1, Volume 412, Pages 102-118', 80, y + 19);

  y += 30;

  // Parties Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('II. CONTRACTING PARTIES', 18, y + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Purchaser / Present Owner:', 18, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${owner?.ownerName || reg?.currentOwner || 'Sri Basavaraj Patil'} (Aadhaar / PAN Verified)`, 60, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Vendor / Transferor:', 18, y + 20);
  doc.text(`${reg?.previousOwner || 'Sri Chandrashekhar K. Hugar & Co-parceners'}`, 60, y + 20);

  doc.text('Nature of Conveyance:', 18, y + 26);
  doc.text('Absolute Deed of Sale (Free from prior encumbrances)', 60, y + 26);

  y += 36;

  // Financial Consideration & Stamp Duty
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('III. CONSIDERATION & STAMP REVENUE', 18, y + 6);

  const consideration = reg?.considerationAmount || area * 1850000;
  const stampDuty = reg?.stampDutyPaid || area * 1850000 * 0.055;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Sale Consideration: Rs. ${consideration.toLocaleString('en-IN')}`, 18, y + 13);
  doc.text(`Govt Guidance Value: Rs. ${(area * 1620000).toLocaleString('en-IN')}`, 90, y + 13);
  doc.text(`Stamp Duty Paid (5.5%): Rs. ${stampDuty.toLocaleString('en-IN')}`, 18, y + 20);
  doc.text(`Registration Fee Paid (2%): Rs. ${(consideration * 0.02).toLocaleString('en-IN')}`, 90, y + 20);

  y += 34;

  // Property Schedule
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('IV. SCHEDULE OF THE PROPERTY CONVEYED', 18, y + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`All that piece and parcel of land bearing Survey No: ${surveyNo}, measuring ${area} Acres`, 18, y + 13);
  doc.text(`situated in ${village} Village, ${parcel.hobli || 'Central'} Hobli, ${taluk} Taluk, ${district} District.`, 18, y + 19);
  doc.text('Bounded on East by: Sy No 105 | West by: Canal buffer | North by: Sy No 102 | South by: 40ft Road.', 18, y + 25);

  y += 36;
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('ATTESTATION: Certified true electronic copy extracted from Kaveri Sub-Registry Central Server.', 14, y);
  doc.text(`DIGITAL SIGNATURE ID: KAV-DEED-${parcel.ulpin}-2026-X89`, 14, y + 4);

  return saveOrOpenPdf(doc, `Sale_Deed_Copy_${parcel.ulpin}.pdf`, openInNewTab);
}

// 4. FORM 15 NON-ENCUMBRANCE CERTIFICATE
export async function downloadEncumbranceCertPdf(parcel: DocumentParcelData, openInNewTab = false) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const district = parcel.district || 'Belagavi';
  const taluk = parcel.taluk || 'Belagavi';
  const village = parcel.village || 'Demo Village';
  const surveyNo = parcel.surveyNo || '101';

  await drawGovHeaderAndFooter(
    doc,
    'CERTIFICATE OF ENCUMBRANCE ON PROPERTY (FORM NO. 15 / 16)',
    'Issued under Rule 148 of Karnataka Registration Rules, 1965',
    'ENC-F15-2026',
    parcel.ulpin
  );

  let y = 42;
  const enc = parcel.encumbrances?.[0];
  const hasLien = enc && enc.status === 'ACTIVE';

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 54, 26, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('I. SEARCH CRITERIA & PERIOD OF SEARCH', 18, y + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Search Period: 01-04-1995 to ${new Date().toLocaleDateString('en-GB')} (30 Years Search)`, 18, y + 13);
  doc.text(`Target Property: Sy No. ${surveyNo}, ${village} Village, ${taluk} Taluk`, 18, y + 19);

  y += 32;

  // Search Results Table Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, pageWidth - 28, 48, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('II. STATEMENT OF TRANSACTIONS / CHARGES REGISTERED', 18, y + 6);

  if (hasLien) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text('FORM 15: ENCUMBRANCES DETECTED', 18, y + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Registered Financial Institution: ${enc.institution || 'State Bank of India'}`, 18, y + 21);
    doc.text('Nature of Charge: Equitable Mortgage by Deposit of Title Deeds', 18, y + 27);
    doc.text(`Sanctioned Amount: Rs. ${enc.amount?.toLocaleString('en-IN')}`, 18, y + 33);
    doc.text('Registered Date: 2023-04-12 | Registered Volume: Book 1, Vol 512, P. 88', 18, y + 39);
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('FORM 16: NIL ENCUMBRANCE CERTIFICATE', 18, y + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      'It is hereby certified that on a diligent search made in the Books of this Office for the specified period,',
      18,
      y + 24
    );
    doc.text(
      'no acts, encumbrances, registered mortgages, liens, or court attachments affecting the property have been found.',
      18,
      y + 30
    );
    doc.text('The property is clear of registered financial encumbrances as per Sub-Registrar books.', 18, y + 36);
  }

  y += 56;

  // Disclaimer & Seal
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('OFFICIAL CERTIFICATION & DIGITAL ATTESTATION', 18, y + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Issuing Sub-Registrar: Sub-Registrar, ${taluk} Taluk Central Office`, 18, y + 13);
  doc.text(`Certificate Tracking Ref: EC-SR-${(district.substring(0, 3) || 'BEL').toUpperCase()}-2026-9021`, 18, y + 19);

  return saveOrOpenPdf(doc, `Encumbrance_Certificate_Form15_${parcel.ulpin}.pdf`, openInNewTab);
}

// 5. SERVICE REQUEST ACKNOWLEDGMENT RECEIPT
export async function downloadServiceReceiptPdf(request: {
  requestNumber: string;
  parcelUlpin: string;
  serviceType: string;
  citizenName: string;
  citizenEmail: string;
  citizenPhone: string;
  status: string;
  assignedOfficer?: string | null;
  createdAt: string;
}, openInNewTab = false) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  await drawGovHeaderAndFooter(
    doc,
    'CITIZEN SERVICE REQUEST ACKNOWLEDGMENT',
    'Sakala Services & Revenue Administration Online Portal',
    request.requestNumber,
    request.parcelUlpin
  );

  let y = 42;

  // Application Details Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 54, 30, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('APPLICATION TRACKING SPECIFICATIONS', 18, y + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Application Number:', 18, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(request.requestNumber, 55, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Target Parcel (ULPIN):', 18, y + 19);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(request.parcelUlpin, 55, y + 19);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Service Category:', 18, y + 25);
  doc.text(request.serviceType, 55, y + 25);

  y += 36;

  // Applicant Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('APPLICANT PARTICULARS', 18, y + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Applicant Name: ${request.citizenName}`, 18, y + 13);
  doc.text(`Contact Phone: ${request.citizenPhone}`, 110, y + 13);
  doc.text(`Registered Email: ${request.citizenEmail}`, 18, y + 19);
  doc.text(`Filing Date: ${new Date(request.createdAt).toLocaleString()}`, 110, y + 19);

  y += 32;

  // Processing SLA & Status
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('WORKFLOW & SAKALA SLA GUARANTEE', 18, y + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Current Processing State: ${request.status}`, 18, y + 13);
  doc.text(`Assigned Scrutiny Officer: ${request.assignedOfficer || 'Shri R. K. Patil (Tahasildar)'}`, 18, y + 19);
  doc.text('Statutory Sakala Resolution Timeline: 21 Working Days from Scrutiny', 18, y + 25);

  y += 38;
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('DIGITAL RECEIPT: Authenticated submission record generated by LANDSTACK Portal.', 14, y);

  return saveOrOpenPdf(doc, `Acknowledgment_Receipt_${request.requestNumber}.pdf`, openInNewTab);
}

// 6. OFFICIAL CITIZEN APPLICATION VERIFICATION CERTIFICATE
export async function downloadApprovalCertificatePdf(request: {
  requestNumber: string;
  parcelUlpin: string;
  serviceType: string;
  citizenName: string;
  citizenEmail: string;
  citizenPhone: string;
  status: string;
  assignedOfficer?: string | null;
  createdAt: string;
  updatedAt?: string;
  remarks?: string | null;
}, openInNewTab = false) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  await drawGovHeaderAndFooter(
    doc,
    'OFFICIAL APPLICATION VERIFICATION CERTIFICATE',
    'Department of Revenue & Cadastral Administration — Endorsed Order',
    `CERT-APP-${request.requestNumber.slice(-6)}`,
    request.parcelUlpin
  );

  let y = 42;

  // Verified Status Banner Box
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(34, 197, 94); // emerald-500
  doc.roundedRect(14, y, pageWidth - 54, 30, 2, 2, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(21, 128, 61); // emerald-700
  doc.text('✓ APPLICATION OFFICIALLY VERIFIED & ENDORSED', 18, y + 7);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Application Number:', 18, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(request.requestNumber, 55, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Target Parcel (ULPIN):', 18, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(request.parcelUlpin, 55, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Service Type:', 18, y + 26);
  doc.text(request.serviceType, 55, y + 26);

  y += 36;

  // Applicant Particulars Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('I. APPLICANT PARTICULARS & IDENTITY ATTESTATION', 18, y + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Applicant Name: ${request.citizenName}`, 18, y + 13);
  doc.text(`Contact Phone: ${request.citizenPhone}`, 110, y + 13);
  doc.text(`Registered Email: ${request.citizenEmail}`, 18, y + 20);
  doc.text(`Application Date: ${new Date(request.createdAt).toLocaleDateString('en-GB')}`, 110, y + 20);

  y += 34;

  // Official Scrutiny & Verification Findings
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, pageWidth - 28, 42, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('II. STATUTORY REVENUE OFFICER SCRUTINY & FINDINGS', 18, y + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Adjudicating Authority: ${request.assignedOfficer || 'Shri R. K. Patil (Tahasildar)'}`, 18, y + 13);
  doc.text(`Official Endorsement Status: ${request.status || 'VERIFIED'}`, 18, y + 19);
  doc.text('Verification Findings / Order Remarks:', 18, y + 25);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    request.remarks || 'Cadastral records, ownership chain, and encumbrance certificates verified and found in order.',
    18,
    y + 31,
    { maxWidth: pageWidth - 36 }
  );

  y += 48;

  // Official Seal & Attestation Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('III. ELECTRONIC SEAL & ATTESTATION', 18, y + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Issuing Cell: Taluk Revenue & Cadastral Verification Bench', 18, y + 12);
  doc.text(`Digital Order Verification ID: CERT-VER-${request.parcelUlpin.slice(-6)}-2026`, 18, y + 17);
  doc.text(`Generated Timestamp: ${new Date().toUTCString()}`, 18, y + 22);

  y += 36;
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('AUTHENTICATED ORDER: Generated digitally by Integrated GIS Land Governance Platform.', 14, y);

  return saveOrOpenPdf(doc, `Verification_Certificate_${request.requestNumber}.pdf`, openInNewTab);
}

// 7. COMPREHENSIVE CADASTRAL DOSSIER (ALL 5 DOCUMENTS IN ONE MULTI-PAGE PDF)
export async function downloadCompleteDossierPdf(parcel: DocumentParcelData, openInNewTab = false) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const ulpin = parcel.ulpin || 'KA-BLG-001-000101';
  const district = parcel.district || 'Belagavi';
  const taluk = parcel.taluk || 'Belagavi';
  const village = parcel.village || 'Demo Village';
  const surveyNo = parcel.surveyNo || '101';
  const area = typeof parcel.area === 'number' ? parcel.area : 1.0;
  const gisArea = typeof parcel.gisArea === 'number' ? parcel.gisArea : area;
  const owner = parcel.ownershipRecords?.[0];
  const ror = parcel.rorRecords?.[0];
  const reg = parcel.registrations?.[0];
  const enc = parcel.encumbrances?.[0];

  // PAGE 1: MASTER LAND CARD & OVERVIEW
  await drawGovHeaderAndFooter(
    doc,
    'OFFICIAL CADASTRAL DOSSIER — SECTION 1: MASTER SUMMARY',
    'Integrated Cadastral Cadre',
    `DOSSIER-${ulpin.slice(-4)}`,
    ulpin
  );

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 42, pageWidth - 28, 48, 2, 2, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('MASTER CADASTRAL RECORD OVERVIEW', 18, 50);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`ULPIN: ${ulpin}`, 18, 58);
  doc.text(`Survey Number: ${surveyNo}`, 80, 58);
  doc.text(`Village / Taluk: ${village}, ${taluk}`, 18, 65);
  doc.text(`District: ${district}`, 80, 65);
  doc.text(`Total Legal Extent: ${area} Acres`, 18, 72);
  doc.text(`GIS Survey Area: ${gisArea} Acres`, 80, 72);
  doc.text(`Land Classification: ${parcel.landUse || 'Agricultural'}`, 18, 79);
  doc.text(`Cadastral Status: ${parcel.status || 'VERIFIED'}`, 80, 79);

  // Section 2 on Page 1: Ownership
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 96, pageWidth - 28, 40, 2, 2, 'FD');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('REGISTERED KHATADAR & TITLE HOLDER', 18, 104);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Owner Name: ${owner?.ownerName || 'Sri Basavaraj Patil'}`, 18, 112);
  doc.text(`Khata Reference: ${owner?.khataNumber || ror?.khataNumber || 'KT-104'}`, 100, 112);
  doc.text(`Father / Husband Name: ${owner?.fatherOrHusbandName || ror?.fatherHusbandName || 'Sri Mallappa Patil'}`, 18, 119);
  doc.text(`Share Extent: ${owner?.share || '100%'} Freehold`, 100, 119);
  doc.text(`Acquisition Mode: ${owner?.acquisitionMode || 'Registered Conveyance Deed'}`, 18, 126);

  // Section 3 on Page 1: Encumbrance & Status
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 142, pageWidth - 28, 40, 2, 2, 'FD');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TITLE CLEARANCE & RISK AUDIT', 18, 150);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Encumbrance: ${enc?.status === 'ACTIVE' ? 'Active Financial Lien' : 'Nil Form 15 Encumbrance'}`, 18, 158);
  doc.text(`Property Tax: ${parcel.propertyTaxes?.[0]?.paymentStatus || 'PAID'}`, 100, 158);
  doc.text(`Centroid: [${parcel.centroidLat?.toFixed(5) || '15.84970'} N, ${parcel.centroidLng?.toFixed(5) || '74.49770'} E]`, 18, 166);
  doc.text('Dossier Components: 5 Authenticated Extract Sheets Follow', 18, 174);

  // PAGE 2: RTC FORM 16
  doc.addPage();
  await drawGovHeaderAndFooter(
    doc,
    'SECTION 2: RECORD OF RIGHTS & CROPS (RTC / FORM 16)',
    'Rule 58 of Karnataka Land Revenue Rules, 1966',
    'RTC-F16',
    ulpin
  );

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 42, pageWidth - 28, 40, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('I. LAND REVENUE ASSESSMENT & CULTIVATION (PAHANI)', 18, 50);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Survey No: ${surveyNo} | Hissa: ${parcel.subDivision || '1'} | Village: ${village}`, 18, 58);
  doc.text(`Legal Extent: ${area} Acres | Kharab: ${(area * 0.05).toFixed(2)} Acres`, 18, 65);
  doc.text(`Cultivator: ${ror?.cultivatorName || owner?.ownerName || 'Self'}`, 18, 72);
  doc.text(`Crop: ${ror?.cropName || 'Sugarcane / Jowar'}`, 100, 72);

  // PAGE 3: SURVEY TIPPANI SKETCH
  doc.addPage();
  await drawGovHeaderAndFooter(
    doc,
    'SECTION 3: CADASTRAL SURVEY TIPPANI BOUNDARY TRAVERSE',
    'Department of Survey, Settlement & Land Records',
    'TIPPANI-SSL',
    ulpin
  );

  doc.setDrawColor(30, 41, 59);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 42, pageWidth - 28, 100, 2, 2, 'FD');

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.8);
  doc.setFillColor(239, 246, 255);
  doc.lines([[80, -5], [10, 50], [-40, 20], [-45, -10], [-5, -55]], 50, 60, [1, 1], 'FD', true);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(`SY NO: ${surveyNo} (${area} Acres)`, 90, 85, { align: 'center' });

  // PAGE 4: SALE DEED
  doc.addPage();
  await drawGovHeaderAndFooter(
    doc,
    'SECTION 4: REGISTERED CONVEYANCE TITLE DEED COPY',
    'Department of Stamps & Registration (Kaveri Platform)',
    'DEED-BK1',
    ulpin
  );

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 42, pageWidth - 28, 50, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('REGISTRATION DOCKET & CONTRACTING PARTIES', 18, 50);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Deed Number: ${reg?.registrationNumber || reg?.deedNumber || 'BK-1-8842/2021'}`, 18, 58);
  doc.text(`Sub-Registrar Office: ${reg?.subRegistrarOffice || taluk + ' SRO'}`, 100, 58);
  doc.text(`Purchaser / Owner: ${owner?.ownerName || reg?.currentOwner || 'Sri Basavaraj Patil'}`, 18, 66);
  doc.text(`Vendor: ${reg?.previousOwner || 'Sri Chandrashekhar K. Hugar'}`, 18, 73);
  doc.text(`Consideration: Rs. ${(reg?.considerationAmount || area * 1850000).toLocaleString('en-IN')}`, 18, 80);

  // PAGE 5: FORM 15 NON-ENCUMBRANCE
  doc.addPage();
  await drawGovHeaderAndFooter(
    doc,
    'SECTION 5: CERTIFICATE OF ENCUMBRANCE ON PROPERTY (FORM 15/16)',
    'Rule 148 of Karnataka Registration Rules, 1965',
    'ENC-F15',
    ulpin
  );

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 42, pageWidth - 28, 50, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('FORM 16: NIL ENCUMBRANCE CERTIFICATE', 18, 50);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Search Criteria: Survey No. ${surveyNo}, ${village} Village, ${taluk} Taluk (30 Years)`, 18, 58);
  doc.text('Finding: No mortgage, act, lien or charge detected affecting the property.', 18, 66);
  doc.text(`Digital Seal: KAV-ENC-${ulpin.slice(-4)}-2026-X77`, 18, 74);

  return saveOrOpenPdf(doc, `COMPLETE_CADASTRAL_DOSSIER_${ulpin}.pdf`, openInNewTab);
}
