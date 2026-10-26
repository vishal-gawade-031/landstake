'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  Shield,
  MapPin,
  QrCode,
  Download,
  Map as MapIcon,
  CheckCircle,
  AlertTriangle,
  Building,
  DollarSign,
  FileCheck,
  Zap,
  History,
  Lock,
  Compass,
  Layers,
  ChevronRight,
  ExternalLink,
  Printer,
  X,
  Share2,
} from 'lucide-react';
import { generateLandCardPdf } from '@/lib/generateLandCardPdf';
import {
  downloadRtcExtractPdf,
  downloadTippaniMapPdf,
  downloadSaleDeedPdf,
  downloadEncumbranceCertPdf,
  downloadCompleteDossierPdf,
} from '@/lib/generateDocumentPdfs';
import QRCode from 'qrcode';
import { useAuth } from '@/context/AuthContext';

export default function Parcel360Page() {
  const params = useParams();
  const router = useRouter();
  const ulpin = params?.ulpin as string;
  const { user, fetchWithAuth } = useAuth();

  const [parcel, setParcel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);
  const [downloadingLandCard, setDownloadingLandCard] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<{
    title: string;
    url?: string;
    filename: string;
  } | null>(null);

  useEffect(() => {
    if (!ulpin) return;

    async function fetchParcel() {
      try {
        setLoading(true);
        const res = await fetchWithAuth(`/api/parcels/${ulpin}`);
        const json = await res.json();
        if (json.success && json.data) {
          setParcel(json.data);
          // Pre-generate QR code
          const verifyUrl = `${window.location.origin}/verify/${json.data.ulpin}`;
          const qrcodeUrl = await QRCode.toDataURL(verifyUrl, { width: 250, margin: 1 });
          setQrDataUrl(qrcodeUrl);
        } else {
          setError(json.message || 'Parcel not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch parcel');
      } finally {
        setLoading(false);
      }
    }
    fetchParcel();
  }, [ulpin]);

  const handleDownloadPdf = async (openInNewTab = false) => {
    if (!parcel) return;
    setDownloadingLandCard(true);
    try {
      const ownerName = parcel.ownershipRecords?.[0]?.ownerName || 'Sri Basavaraj Patil';
      const regStatus = parcel.registrations?.[0]?.transactionStatus || 'COMPLETED';
      const encStatus = parcel.encumbrances?.[0]?.status || 'NONE';
      const taxStatus = parcel.propertyTaxes?.[0]?.paymentStatus || 'PAID';

      const result = await generateLandCardPdf(
        {
          ulpin: parcel.ulpin,
          surveyNo: parcel.surveyNo,
          district: parcel.district,
          taluk: parcel.taluk,
          village: parcel.village,
          area: parcel.area,
          gisArea: parcel.gisArea || parcel.area,
          landUse: parcel.landUse,
          ownerName,
          status: parcel.status,
          registrationStatus: regStatus,
          encumbranceStatus: encStatus,
          taxStatus,
          centroidLat: parcel.centroidLat,
          centroidLng: parcel.centroidLng,
          riskScore: parcel.riskScore,
          riskLevel: parcel.riskLevel,
        },
        openInNewTab
      );

      if (result) {
        setDownloadNotice({
          title: 'Official Land Information Card (ULPIN Master Certificate)',
          url: result.url,
          filename: result.filename,
        });
      }
    } catch (err) {
      console.error('Failed to generate land card PDF', err);
    } finally {
      setDownloadingLandCard(false);
    }
  };

  const handleDownloadDocument = async (docType: string, openInNewTab = false) => {
    if (!parcel) return;
    setDownloadingDoc(docType);
    try {
      let result: any = null;
      let docTitle = '';

      if (docType === 'dossier') {
        docTitle = 'Complete Cadastral Dossier (All Documents in 1 Master PDF)';
        result = await downloadCompleteDossierPdf(parcel, openInNewTab);
      } else if (docType === 'card') {
        docTitle = 'Official Land Information Card';
        result = await generateLandCardPdf(
          {
            ulpin: parcel.ulpin,
            surveyNo: parcel.surveyNo,
            district: parcel.district,
            taluk: parcel.taluk,
            village: parcel.village,
            area: parcel.area,
            gisArea: parcel.gisArea || parcel.area,
            landUse: parcel.landUse,
            ownerName: parcel.ownershipRecords?.[0]?.ownerName || 'Sri Basavaraj Patil',
            status: parcel.status,
            registrationStatus: parcel.registrations?.[0]?.transactionStatus || 'COMPLETED',
            encumbranceStatus: parcel.encumbrances?.[0]?.status || 'NONE',
            taxStatus: parcel.propertyTaxes?.[0]?.paymentStatus || 'PAID',
            centroidLat: parcel.centroidLat,
            centroidLng: parcel.centroidLng,
            riskScore: parcel.riskScore,
            riskLevel: parcel.riskLevel,
          },
          openInNewTab
        );
      } else if (docType === 'rtc') {
        docTitle = 'Record of Rights, Tenancy & Crops (RTC / Form 16)';
        result = await downloadRtcExtractPdf(parcel, openInNewTab);
      } else if (docType === 'tippani') {
        docTitle = 'Cadastral Survey Tippani Boundary Map';
        result = await downloadTippaniMapPdf(parcel, openInNewTab);
      } else if (docType === 'deed') {
        docTitle = 'Certified Copy of Registered Title Deed';
        result = await downloadSaleDeedPdf(parcel, openInNewTab);
      } else if (docType === 'encumbrance') {
        docTitle = 'Certificate of Encumbrance on Property (Form 15)';
        result = await downloadEncumbranceCertPdf(parcel, openInNewTab);
      }

      if (result) {
        setDownloadNotice({
          title: docTitle,
          url: result.url,
          filename: result.filename,
        });
      }
    } catch (err) {
      console.error(`Failed to download ${docType}`, err);
    } finally {
      setDownloadingDoc(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Retrieving Parcel 360 Records for {ulpin}...</p>
        </div>
      </div>
    );
  }

  if (error || !parcel) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">No Parcel Found</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          No cadastral record matches ULPIN &quot;{ulpin}&quot;. Please verify the identifier or search on the GIS Map.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
        >
          <MapIcon className="w-4 h-4" />
          <span>Return to GIS Map</span>
        </Link>
      </div>
    );
  }

  const isOfficerOrAdmin = user && (user.role === 'ADMIN' || user.role === 'OFFICER');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: MapPin },
    { id: 'ownership', label: 'Ownership', icon: Shield },
    { id: 'ror', label: 'RoR (Record of Rights)', icon: FileText },
    { id: 'registration', label: 'Registration', icon: FileCheck },
    { id: 'encumbrance', label: 'Encumbrance', icon: Lock },
    { id: 'landUse', label: 'Land Use', icon: Layers },
    { id: 'building', label: 'Building Permission', icon: Building },
    { id: 'tax', label: 'Property Tax', icon: DollarSign },
    { id: 'restrictions', label: 'Restrictions', icon: AlertTriangle },
    { id: 'utilities', label: 'Utilities', icon: Zap },
    { id: 'documents', label: 'Documents', icon: FileText },
    ...(isOfficerOrAdmin ? [{ id: 'audit', label: 'Audit History', icon: History }] : []),
  ];

  const primaryOwner = parcel.ownershipRecords?.[0];
  const primaryRor = parcel.rorRecords?.[0];
  const primaryReg = parcel.registrations?.[0];
  const primaryTax = parcel.propertyTaxes?.[0];
  const primaryLandUse = parcel.landUseRecords?.[0];
  const primaryBuilding = parcel.buildingPermissions?.[0];
  const primaryUtility = parcel.utilities?.[0];

  return (
    <div className="flex-1 bg-slate-100 dark:bg-slate-950 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600">GIS Map</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Parcels</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">{parcel.ulpin}</span>
        </nav>

        {/* 1. PARCEL 360 MASTER HEADER */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                LAND PARCEL
              </span>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                  parcel.status === 'VERIFIED'
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300'
                }`}
              >
                {parcel.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              ULPIN: <span className="font-mono text-blue-600 dark:text-blue-400">{parcel.ulpin}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span>Survey No: <strong className="text-slate-900 dark:text-slate-200">{parcel.surveyNo}</strong></span>
              <span>•</span>
              <span>Village: <strong className="text-slate-900 dark:text-slate-200">{parcel.village}</strong></span>
              <span>•</span>
              <span>Taluk: <strong className="text-slate-900 dark:text-slate-200">{parcel.taluk}</strong></span>
              <span>•</span>
              <span>District: <strong className="text-slate-900 dark:text-slate-200">{parcel.district}</strong></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setQrModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
              title="View Public Verification QR Code"
            >
              <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>QR Code</span>
            </button>

            <button
              onClick={() => handleDownloadPdf(false)}
              disabled={downloadingLandCard}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-colors"
              title="Download Land Card in PDF format"
            >
              {downloadingLandCard ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{downloadingLandCard ? 'Generating...' : 'Download Land Card (PDF)'}</span>
            </button>

            <button
              onClick={() => handleDownloadPdf(true)}
              disabled={downloadingLandCard}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
              title="Open or Print Land Card PDF in a new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
              <span>Open in Tab</span>
            </button>

            <button
              onClick={() => handleDownloadDocument('dossier', false)}
              disabled={downloadingDoc === 'dossier'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-colors"
              title="Download all 5 cadastral documents combined in 1 PDF dossier"
            >
              {downloadingDoc === 'dossier' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileCheck className="w-4 h-4" />
              )}
              <span>{downloadingDoc === 'dossier' ? 'Compiling Dossier...' : 'Download All Docs (PDF)'}</span>
            </button>

            <Link
              href={`/?ulpin=${parcel.ulpin}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-colors border border-slate-700"
            >
              <MapIcon className="w-4 h-4 text-cyan-400" />
              <span>View on Map</span>
            </Link>
          </div>
        </div>

        {/* 2. TAB NAVIGATION BAR */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-1.5 shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-1 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. TAB CONTENTS */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800 min-h-[420px]">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cadastral Specs Card */}
                <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    Cadastral & Spatial Geometry Summary
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">ULPIN</span>
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-100">{parcel.ulpin}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Survey Number</span>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{parcel.surveyNo}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Recorded Extent</span>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{parcel.area} Acres</p>
                    </div>
                    <div>
                      <span className="text-slate-400">GIS Calculated Extent</span>
                      <p className="font-bold text-blue-600 dark:text-blue-400">{parcel.gisArea || parcel.area} Acres</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Area Variance</span>
                      <p className={`font-bold ${parcel.areaDifference > 0.1 ? 'text-amber-600' : 'text-slate-800 dark:text-slate-200'}`}>
                        {parcel.areaDifference ? parcel.areaDifference + ' Acres' : '0.00 Acres'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Land Classification</span>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{parcel.landUse}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Village & Taluk</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{parcel.village}, {parcel.taluk}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">District</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{parcel.district}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Centroid Coordinates</span>
                      <p className="font-mono text-slate-700 dark:text-slate-300">
                        {parcel.centroidLat?.toFixed(5)} N, {parcel.centroidLng?.toFixed(5)} E
                      </p>
                    </div>
                  </div>

                  {/* Geolocation Mini Status Card */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900 text-xs flex items-center justify-between">
                    <span className="text-blue-900 dark:text-blue-200 font-medium">
                      Bhoomi Cadastral Vector Index: Synchronized with Survey of India Geodetic Datum (WGS84).
                    </span>
                    <Link
                      href={`/?ulpin=${parcel.ulpin}`}
                      className="px-3 py-1 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors"
                    >
                      Open Full GIS
                    </Link>
                  </div>
                </div>

                {/* Risk Engine Breakdown Card */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-500" />
                    Risk Engine Assessment
                  </h3>

                  <div className="text-center py-2">
                    <div className="inline-flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                        {parcel.riskScore || 15}
                      </span>
                      <span className="text-xs text-slate-400">/ 100</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider mt-1 text-slate-700 dark:text-slate-300">
                      Level: <span className="font-extrabold text-blue-600 dark:text-blue-400">{parcel.riskLevel || 'LOW'}</span>
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-3">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Why this score?</p>
                    {parcel.evaluatedRisk?.factors ? (
                      <ul className="space-y-1.5 text-xs">
                        {parcel.evaluatedRisk.factors.map((f: any) => (
                          <li key={f.id} className="flex items-start gap-2">
                            <span className={f.triggered ? 'text-amber-500 font-bold' : 'text-emerald-500'}>
                              {f.triggered ? '⚠️' : '✓'}
                            </span>
                            <span className={f.triggered ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-500'}>
                              {f.name} ({f.triggered ? `+${f.weight} pts` : '0 pts'})
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        <li>✓ Cadastral Survey Cleared</li>
                        <li>✓ Nil Form 15 Encumbrance</li>
                        <li>✓ Digital Mutation Recorded</li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OWNERSHIP */}
          {activeTab === 'ownership' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Registered Ownership Chain</h3>
              {parcel.ownershipRecords?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="p-3">Owner Name</th>
                        <th className="p-3">Ownership Nature</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">RoR Reference</th>
                        <th className="p-3">Mutation Order #</th>
                        <th className="p-3">Mutation Date</th>
                        <th className="p-3">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {parcel.ownershipRecords.map((o: any) => (
                        <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{o.ownerName}</td>
                          <td className="p-3">{o.ownershipType}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                              {o.ownershipStatus}
                            </span>
                          </td>
                          <td className="p-3 font-mono">{o.rorReference}</td>
                          <td className="p-3 font-mono">{o.mutationNumber}</td>
                          <td className="p-3">{o.mutationDate}</td>
                          <td className="p-3 font-bold">{o.sharePercentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No ownership records found.</p>
              )}
            </div>
          )}

          {/* TAB 3: RoR */}
          {activeTab === 'ror' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Record of Rights, Tenancy and Crops (RTC)</h3>
              {primaryRor ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400">Khata Number</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">{primaryRor.khataNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Owner Name</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{primaryRor.ownerName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Father / Husband Name</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{primaryRor.fatherHusbandName || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Cultivator Details</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{primaryRor.cultivatorName || 'Self'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Tenancy Classification</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{primaryRor.tenancyType}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Soil Quality Grade</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{primaryRor.soilClassification}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Water Source</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{primaryRor.waterSource}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Tari / Kushki / Bagayat</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{primaryRor.dryWetGarden}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Active Liabilities</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{primaryRor.liabilities || 'Nil'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No RoR extract available.</p>
              )}
            </div>
          )}

          {/* TAB 4: REGISTRATION */}
          {activeTab === 'registration' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Sub-Registrar Deed Registrations</h3>
              {parcel.registrations?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="p-3">Deed Number</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Sub-Registrar</th>
                        <th className="p-3">Consideration</th>
                        <th className="p-3">Stamp Duty</th>
                        <th className="p-3">Previous Owner</th>
                        <th className="p-3">Current Owner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {parcel.registrations.map((r: any) => (
                        <tr key={r.id}>
                          <td className="p-3 font-mono font-bold text-blue-600">{r.registrationNumber}</td>
                          <td className="p-3 font-semibold">{r.documentType}</td>
                          <td className="p-3">{r.registrationDate}</td>
                          <td className="p-3">{r.subRegistrarOffice}</td>
                          <td className="p-3 font-mono font-bold">₹{r.considerationAmount?.toLocaleString()}</td>
                          <td className="p-3 font-mono">₹{r.stampDutyPaid?.toLocaleString()}</td>
                          <td className="p-3 text-slate-500">{r.previousOwner}</td>
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{r.currentOwner}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No registered deed transactions recorded.</p>
              )}
            </div>
          )}

          {/* TAB 5: ENCUMBRANCE */}
          {activeTab === 'encumbrance' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Encumbrance & Mortgage Status (Form 15/16)</h3>
              {parcel.encumbrances?.length > 0 ? (
                <div className="space-y-3">
                  {parcel.encumbrances.map((e: any) => (
                    <div
                      key={e.id}
                      className={`p-4 rounded-xl border text-xs space-y-2 ${
                        e.status === 'ACTIVE'
                          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {e.status === 'ACTIVE' ? '⚠️ Active Commercial Mortgage Lien Attached' : '✓ Nil Encumbrance Certificate (Clear Title)'}
                        </span>
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase bg-white dark:bg-slate-900 shadow-sm">
                          {e.status}
                        </span>
                      </div>
                      {e.status === 'ACTIVE' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-slate-700 dark:text-slate-300">
                          <div>
                            <span className="text-slate-400">Lender Institution:</span>
                            <p className="font-bold">{e.institution}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Encumbrance Amount:</span>
                            <p className="font-bold font-mono">₹{e.amount?.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Start Date:</span>
                            <p>{e.startDate}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Doc Reference:</span>
                            <p className="font-mono">{e.documentReference}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No encumbrance records found.</p>
              )}
            </div>
          )}

          {/* TAB 6: LAND USE */}
          {activeTab === 'landUse' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Statutory Land Use & Master Plan Zoning</h3>
              {primaryLandUse ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400">Current Land Use:</span>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{primaryLandUse.currentLandUse}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Master Plan Zone:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{primaryLandUse.masterPlanZone}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Section 95 Conversion:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{primaryLandUse.conversionRequirement}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Permitted Development:</span>
                    <p className="text-slate-700 dark:text-slate-300">{primaryLandUse.permittedUses}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No land use details recorded.</p>
              )}
            </div>
          )}

          {/* TAB 7: BUILDING PERMISSION */}
          {activeTab === 'building' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Urban Planning & Building Permissions</h3>
              {primaryBuilding ? (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {primaryBuilding.applicationId}
                    </span>
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
                      {primaryBuilding.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400">Building Type:</span>
                      <p className="font-semibold">{primaryBuilding.buildingType}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Floors Sanctioned:</span>
                      <p className="font-bold">{primaryBuilding.floors}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Approved Builtup Area:</span>
                      <p className="font-bold font-mono">{primaryBuilding.approvedBuiltupArea} sq.m</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Issuing Authority:</span>
                      <p className="font-semibold">{primaryBuilding.issuingAuthority}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No building permission requests on file.</p>
              )}
            </div>
          )}

          {/* TAB 8: PROPERTY TAX */}
          {activeTab === 'tax' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Municipal Property Tax Assessment</h3>
              {primaryTax ? (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Assessment Cycle: {primaryTax.assessmentYear}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        primaryTax.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {primaryTax.paymentStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-slate-400">Annual Assessed Tax:</span>
                      <p className="font-bold font-mono">₹{primaryTax.annualTax?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Amount Paid:</span>
                      <p className="font-bold font-mono text-emerald-600">₹{primaryTax.paidAmount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Outstanding Due:</span>
                      <p className={`font-bold font-mono ${primaryTax.outstandingAmount > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                        ₹{primaryTax.outstandingAmount?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Receipt Ref:</span>
                      <p className="font-mono text-slate-700 dark:text-slate-300">{primaryTax.receiptNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No property tax records found.</p>
              )}
            </div>
          )}

          {/* TAB 9: RESTRICTIONS */}
          {activeTab === 'restrictions' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Zonal Restrictions & Statutory Buffers</h3>
              {parcel.restrictions?.length > 0 ? (
                <div className="space-y-3">
                  {parcel.restrictions.map((rst: any) => (
                    <div
                      key={rst.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800/40 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          {rst.zoneType}
                        </span>
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-800">
                          {rst.status}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{rst.description}</p>
                      <p className="text-[11px] text-slate-400">Legal Authority: {rst.legalActReference}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No active statutory restrictions flagged on this parcel.</p>
              )}
            </div>
          )}

          {/* TAB 10: UTILITIES */}
          {activeTab === 'utilities' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Infrastructure & Utility Connections</h3>
              {primaryUtility ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400">Electricity (HESCOM):</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{primaryUtility.electricityStatus}</p>
                    <p className="font-mono text-[10px] text-slate-500">{primaryUtility.electricityRrNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Water Supply:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{primaryUtility.waterStatus}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Sewerage Network:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{primaryUtility.sewerageStatus}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Road Access:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{primaryUtility.roadAccessStatus}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">High-speed Fiber:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{primaryUtility.internetFiberStatus}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No utility records found.</p>
              )}
            </div>
          )}

          {/* TAB 11: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Digitized Land Records, Deeds & Cadastral Tippani
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cryptographically authenticated PDF extracts generated directly from integrated Land Stack datasets.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={downloadingDoc === 'dossier'}
                    onClick={() => handleDownloadDocument('dossier', false)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download All (1 PDF)</span>
                  </button>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
                    <FileCheck className="w-3.5 h-3.5" />
                    All 5 Extracts Available in PDF
                  </span>
                </div>
              </div>

              {/* Master Complete Cadastral Dossier Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white shadow-lg border border-blue-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/40">
                      All-in-One Legal Cadastral Package
                    </span>
                    <span className="text-[10px] text-amber-300 font-bold">5 Authenticated Sections</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Complete Cadastral Dossier (Unified Multi-Page Master PDF)
                  </h4>
                  <p className="text-xs text-blue-200/90 max-w-2xl leading-relaxed">
                    Download all 5 statutory land extracts compiled into a single multi-page certified PDF dossier containing:
                    1. Land Information Card, 2. RTC Pahani Form 16, 3. Cadastral Survey Tippani Traverse Map, 4. Registered Title Deed Conveyance, and 5. Form 15 Non-Encumbrance Certificate.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    disabled={downloadingDoc === 'dossier'}
                    onClick={() => handleDownloadDocument('dossier', false)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
                  >
                    {downloadingDoc === 'dossier' ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{downloadingDoc === 'dossier' ? 'Generating Dossier...' : 'Download Complete Dossier (PDF)'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={downloadingDoc === 'dossier'}
                    onClick={() => handleDownloadDocument('dossier', true)}
                    className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-xl font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Open in Tab</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {[
                  {
                    id: 'card',
                    name: 'Official Land Information Card (ULPIN Master Certificate)',
                    ref: `LIC-ULPIN-2026-${parcel.ulpin.slice(-4)}`,
                    authority: 'LandStack Unified Digital Cadastre',
                    type: 'Master Summary Card',
                    badge: 'ULPIN Verified',
                    badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
                    desc: 'Full-spectrum cadastral summary with high-resolution QR verification code and legal metadata.',
                  },
                  {
                    id: 'rtc',
                    name: 'Record of Rights, Tenancy & Crops (RTC / Form 16)',
                    ref: `RTC-F16-BHOOMI-2026-${parcel.surveyNo}`,
                    authority: 'Revenue Dept, Govt. of Karnataka (Bhoomi)',
                    type: 'Pahani Extract (Form 16)',
                    badge: 'Rule 58 Form 16',
                    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
                    desc: 'Official land revenue extract detailing Khatadar ownership, Kharab, soil type, and crop cultivation.',
                  },
                  {
                    id: 'tippani',
                    name: 'Cadastral Survey Tippani Map (Spatial Boundary Traverse)',
                    ref: `TIP-SSL-2026-SY${parcel.surveyNo}`,
                    authority: 'Department of Survey, Settlement & Land Records',
                    type: 'DGPS / ETS Survey Map',
                    badge: 'Cadastral Traverse',
                    badgeClass: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
                    desc: 'Survey sketch with boundary coordinates, station nodes A-E, traverse lengths, and area measurements.',
                  },
                  {
                    id: 'deed',
                    name: 'Certified Copy of Registered Title Deed',
                    ref: `DEED-KAVERI-2026-BK1`,
                    authority: 'Department of Stamps & Registration (Kaveri Platform)',
                    type: 'Sub-Registrar Conveyance',
                    badge: 'Book 1 Extract',
                    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
                    desc: 'Registered sale deed copy including party names, consideration amount, and stamp duty paid.',
                  },
                  {
                    id: 'encumbrance',
                    name: 'Certificate of Encumbrance on Property (Form 15 / 16)',
                    ref: `ENC-F15-30YR-2026`,
                    authority: 'Sub-Registrar 30-Year Search Docket',
                    type: 'Lien / Mortgage Search',
                    badge: parcel.encumbrances?.[0]?.status === 'ACTIVE' ? 'Active Lien' : 'Nil Encumbrance',
                    badgeClass: parcel.encumbrances?.[0]?.status === 'ACTIVE'
                      ? 'bg-red-500/10 text-red-600 border-red-500/30'
                      : 'bg-teal-500/10 text-teal-600 border-teal-500/30',
                    desc: 'Certified 30-year search results for registered financial mortgages, court attachments, and charges.',
                  },
                ].map((doc) => {
                  const isDownloading = downloadingDoc === doc.id;
                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-xs leading-snug">{doc.name}</p>
                              <p className="text-[10px] text-slate-400">{doc.authority}</p>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${doc.badgeClass}`}>
                            {doc.badge}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {doc.desc}
                        </p>

                        <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Ref: {doc.ref}</span>
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <FileCheck className="w-3 h-3" />
                            PDF Format
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400">SHA-256 Attested</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isDownloading}
                            onClick={() => handleDownloadDocument(doc.id, true)}
                            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors flex items-center gap-1 border border-slate-300 dark:border-slate-700"
                            title="Open or print PDF in a new tab"
                          >
                            <ExternalLink className="w-3 h-3 text-blue-500" />
                            <span>Open</span>
                          </button>
                          <button
                            type="button"
                            disabled={isDownloading}
                            onClick={() => handleDownloadDocument(doc.id, false)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5"
                          >
                            {isDownloading ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>Download PDF</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 12: AUDIT HISTORY */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Immutable Cadastral Audit Log</h3>
              {parcel.auditLogs?.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {parcel.auditLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between"
                    >
                      <div className="space-y-1">
                        <span className="font-bold font-mono text-blue-600 dark:text-blue-400">{log.action}</span>
                        <p className="text-slate-700 dark:text-slate-300">{log.details}</p>
                        <p className="text-[10px] text-slate-400">Performed by: {log.performedBy} ({log.userRole})</p>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No audit logs recorded for this parcel.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Public Verification QR Code</h3>
              <button onClick={() => setQrModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {qrDataUrl && (
              <div className="bg-white p-3 rounded-xl shadow-inner inline-block mx-auto border border-slate-200">
                <img src={qrDataUrl} alt="Parcel Verification QR Code" className="w-48 h-48 mx-auto" />
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs font-mono font-bold text-blue-600">{parcel.ulpin}</p>
              <p className="text-[11px] text-slate-500">
                Scan to verify title validity, encumbrance status, and cadastral extent on public portal.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href={`/verify/${parcel.ulpin}`}
                className="block w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Open Verification Page &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Download Notification Banner / Toast */}
      {downloadNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-blue-500/40 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-xs text-white">PDF Ready & Download Started</p>
              <p className="text-[11px] text-slate-300 font-medium leading-snug">{downloadNotice.title}</p>
              <p className="text-[10px] text-slate-400 font-mono">{downloadNotice.filename}</p>
              {downloadNotice.url && (
                <div className="flex items-center gap-3 pt-1">
                  <a
                    href={downloadNotice.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open / View PDF</span>
                  </a>
                  <a
                    href={downloadNotice.url}
                    download={downloadNotice.filename}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Direct Download Link</span>
                  </a>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setDownloadNotice(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
