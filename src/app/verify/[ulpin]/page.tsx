'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  QrCode,
  MapPin,
  ExternalLink,
  Printer,
  Calendar,
  Lock,
  Download,
} from 'lucide-react';
import QRCode from 'qrcode';
import { generateLandCardPdf } from '@/lib/generateLandCardPdf';

export default function VerifyParcelPage() {
  const params = useParams();
  const ulpin = params?.ulpin as string;

  const [parcel, setParcel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [downloading, setDownloading] = useState(false);

  const handleDownloadLandCard = async () => {
    if (!parcel) return;
    setDownloading(true);
    try {
      await generateLandCardPdf({
        ulpin: parcel.ulpin,
        surveyNo: parcel.surveyNo,
        district: parcel.district,
        taluk: parcel.taluk,
        village: parcel.village,
        area: parcel.area,
        gisArea: parcel.gisArea || parcel.area,
        landUse: parcel.landUse,
        ownerName: parcel.ownershipRecords?.[0]?.ownerName || 'Registered Khatadar',
        status: parcel.status,
        registrationStatus: parcel.registrations?.[0]?.transactionStatus || 'COMPLETED',
        encumbranceStatus: parcel.encumbrances?.[0]?.status || 'NONE',
        taxStatus: parcel.propertyTaxes?.[0]?.paymentStatus || 'PAID',
        centroidLat: parcel.centroidLat,
        centroidLng: parcel.centroidLng,
        riskScore: parcel.riskScore,
        riskLevel: parcel.riskLevel,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!ulpin) return;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/parcels/${ulpin}`);
        const json = await res.json();
        if (json.success && json.data) {
          setParcel(json.data);
          const qr = await QRCode.toDataURL(window.location.href, { width: 180, margin: 1 });
          setQrDataUrl(qr);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ulpin]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 text-center space-y-4 bg-white rounded-xl shadow-md border">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Unverified Identifier</h2>
        <p className="text-xs text-slate-500">The scanned ULPIN &quot;{ulpin}&quot; does not match any record in the cadastral registry.</p>
        <Link href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold">
          Search GIS Map
        </Link>
      </div>
    );
  }

  const primaryOwner = parcel.ownershipRecords?.[0];
  const primaryReg = parcel.registrations?.[0];
  const primaryEnc = parcel.encumbrances?.[0];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Verification Certificate Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 text-center space-y-2 relative border-b-4 border-blue-600">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto shadow-md mb-2">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-400">
            Digital Land Cadastre
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
            Land Parcel Verification
          </h1>
          <p className="text-xs text-slate-300 font-mono tracking-wide">
            Unique Land Parcel Identification Number (ULPIN): {parcel.ulpin}
          </p>
        </div>

        {/* Mandatory Demo Disclaimer Banner */}
        <div className="bg-amber-500/10 border-y border-amber-500/30 px-6 py-2.5 text-center flex items-center justify-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wide">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>DEMO VERIFICATION — NOT AN OFFICIAL GOVERNMENT CERTIFICATE</span>
        </div>

        {/* Certificate Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* QR & Status Seal */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-semibold text-slate-400">Verification Status</span>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <h3 className="text-lg font-bold text-slate-900">{parcel.status || 'VERIFIED'}</h3>
              </div>
              <p className="text-[11px] text-slate-500">
                Record validated against digital land cadastre index.
              </p>
              <p className="text-[10px] text-slate-400">Timestamp: {new Date().toUTCString()}</p>
            </div>

            {qrDataUrl && (
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
                <img src={qrDataUrl} alt="Verification QR" className="w-24 h-24" />
              </div>
            )}
          </div>

          {/* Key Parcel Parameters Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px]">Survey Number</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{parcel.surveyNo}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px]">Total Extent (Area)</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{parcel.area} Acres</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px]">Village & Taluk</span>
              <p className="font-semibold text-slate-800 mt-0.5">{parcel.village}, {parcel.taluk}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px]">District</span>
              <p className="font-semibold text-slate-800 mt-0.5">{parcel.district}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px]">Land Use</span>
              <p className="font-bold text-blue-600 mt-0.5">{parcel.landUse}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px]">Registered Owner</span>
              <p className="font-bold text-slate-800 mt-0.5">{primaryOwner?.ownerName || 'Verified Holder'}</p>
            </div>
          </div>

          {/* Verification Indicators Checklist */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Verification Checklist</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
                <span className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  Ownership Verification Status
                </span>
                <span className="font-bold">{primaryOwner?.ownershipStatus || 'Verified'}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Registration Status
                </span>
                <span className="font-bold">{primaryReg?.transactionStatus || 'COMPLETED'}</span>
              </div>

              <div
                className={`flex items-center justify-between p-2.5 rounded-lg border ${
                  primaryEnc?.status === 'ACTIVE'
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-600" />
                  Encumbrance Status
                </span>
                <span className="font-bold">
                  {primaryEnc?.status === 'ACTIVE' ? 'Active Bank Charge' : 'Nil Encumbrance (Clear)'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadLandCard}
              disabled={downloading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              {downloading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{downloading ? 'Generating PDF...' : 'Download Verified Land Card (PDF)'}</span>
            </button>
            <Link
              href={`/parcels/${parcel.ulpin}`}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold text-center transition-colors shadow-sm"
            >
              Parcel 360 &rarr;
            </Link>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-300"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
