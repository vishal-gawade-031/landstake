import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { saveOrOpenPdf } from './pdfHelper';

export interface LandCardData {
  ulpin: string;
  surveyNo: string;
  district?: string;
  taluk?: string;
  village?: string;
  area?: number;
  gisArea?: number;
  landUse?: string;
  ownerName?: string;
  status?: string;
  registrationStatus?: string;
  encumbranceStatus?: string;
  taxStatus?: string;
  centroidLat?: number;
  centroidLng?: number;
  riskScore?: number;
  riskLevel?: string;
}

export async function generateLandCardPdf(parcel: LandCardData, openInNewTab = false) {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const ulpin = parcel.ulpin || 'KA-BLG-001-000101';
    const village = parcel.village || 'Belagavi';
    const taluk = parcel.taluk || 'Belagavi';
    const district = parcel.district || 'Belagavi';
    const surveyNo = parcel.surveyNo || '101';
    const area = typeof parcel.area === 'number' ? parcel.area : 1.0;
    const gisArea = typeof parcel.gisArea === 'number' ? parcel.gisArea : area;
    const landUse = parcel.landUse || 'Agricultural';
    const ownerName = parcel.ownerName || 'Sri Basavaraj Patil';
    const status = parcel.status || 'VERIFIED';
    const riskScore = typeof parcel.riskScore === 'number' ? parcel.riskScore : 15;
    const riskLevel = parcel.riskLevel || 'LOW';

    const verifyUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/verify/${ulpin}`
      : `https://landstack.gov.demo/verify/${ulpin}`;

    // Generate QR code data URL
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        margin: 1,
        width: 120,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
    } catch (err) {
      console.warn('QR generation fallback:', err);
    }

    // Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 38, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('LANDSTACK', 15, 14);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(147, 197, 253); // blue-300
    doc.text('INTEGRATED GIS LAND GOVERNANCE PLATFORM', 15, 20);

    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text('PARCEL INFORMATION CARD (ULPIN CADASTRE)', 15, 26);

    // Status Badge on Header
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(pageWidth - 65, 10, 50, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`STATUS: ${status}`, pageWidth - 60, 16.5);

    // Verification QR Code
    if (qrDataUrl) {
      try {
        doc.addImage(qrDataUrl, 'PNG', pageWidth - 48, 44, 34, 34);
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text('Scan for Public Verification', pageWidth - 48, 81);
      } catch (e) {
        console.warn('QR image draw skipped:', e);
      }
    }

    // Parcel Identification Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 44, pageWidth - 68, 38, 2, 2, 'FD');

    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('1. PARCEL IDENTIFICATION & CADASTRE', 18, 51);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    doc.text('ULPIN:', 18, 58);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(ulpin, 40, 58);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Survey No:', 18, 64);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(surveyNo, 40, 64);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Recorded Extent:', 18, 70);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${area} Acres (${gisArea} A GIS Computed)`, 45, 70);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Location:', 18, 76);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${village}, ${taluk}, ${district}`, 40, 76);

    // Administrative & Legal Details Table
    let y = 88;
    const drawRow = (label: string, value: string, isHeader = false) => {
      if (isHeader) {
        doc.setFillColor(241, 245, 249);
        doc.rect(14, y, pageWidth - 28, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(label, 18, y + 5);
        y += 8;
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(label, 18, y + 4.5);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(value, 75, y + 4.5);

        doc.setDrawColor(241, 245, 249);
        doc.line(14, y + 6.5, pageWidth - 14, y + 6.5);
        y += 7;
      }
    };

    drawRow('2. OWNERSHIP & RECORD OF RIGHTS (RoR)', '', true);
    drawRow('Primary Registered Owner', ownerName);
    drawRow('Ownership Nature', 'Individual Freehold Holding');
    drawRow('RoR Khata Reference', `KHT-${(village.substring(0, 3) || 'VIL').toUpperCase()}-104`);
    drawRow('Land Classification', landUse);
    y += 2;

    drawRow('3. REGISTRATION & ENCUMBRANCE STATUS', '', true);
    drawRow('Deed Registration Status', parcel.registrationStatus || 'COMPLETED');
    drawRow('Financial Encumbrance', parcel.encumbranceStatus === 'ACTIVE' ? 'Active Bank Charge Attached' : 'Nil (Form 15 Non-Encumbrance)');
    drawRow('Property Tax Assessment', parcel.taxStatus || 'PAID (Current Fiscal Year)');
    y += 2;

    drawRow('4. GIS SPATIAL VERIFICATION & RISK AUDIT', '', true);
    drawRow(
      'Centroid Coordinates',
      `${parcel.centroidLat != null ? parcel.centroidLat.toFixed(6) : '15.849700'} N, ${
        parcel.centroidLng != null ? parcel.centroidLng.toFixed(6) : '74.497700'
      } E`
    );
    drawRow('Risk Index Engine', `${riskScore} / 100 (${riskLevel})`);
    drawRow('Boundary Overlap Status', riskScore > 50 ? 'Potential Spatial Conflict Flagged' : 'Verified Contiguous Clear Boundary');
    y += 4;

    // Verification Stamp Box
    doc.setDrawColor(148, 163, 184);
    doc.roundedRect(14, y, pageWidth - 28, 24, 2, 2, 'D');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('DIGITAL VERIFICATION ATTESTATION', 18, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Generated Timestamp: ${new Date().toUTCString()}`, 18, y + 11);
    doc.text(`Verification ID: LND-SEC-${ulpin.replace(/[^A-Za-z0-9]/g, '')}-2026`, 18, y + 16);
    doc.text('Attested By: Department of Survey, Settlement and Land Records (Academic Prototype Engine)', 18, y + 21);

    // Footer Disclaimer
    doc.setFillColor(254, 242, 242);
    doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text(
      'DEMO DATASET — NOT AN OFFICIAL GOVERNMENT LAND RECORD',
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(
      'For MCA Final Year Project Evaluation Only. Not legally admissible in Revenue Court.',
      pageWidth / 2,
      pageHeight - 4,
      { align: 'center' }
    );

    const filename = `LAND_CARD_${ulpin}.pdf`;
    return saveOrOpenPdf(doc, filename, openInNewTab);
  } catch (err: any) {
    console.error('generateLandCardPdf execution error:', err);
    throw err;
  }
}
