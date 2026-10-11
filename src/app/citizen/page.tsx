'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Map as MapIcon,
  FileText,
  Clock,
  QrCode,
  Download,
  PlusCircle,
  Bell,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { generateLandCardPdf } from '@/lib/generateLandCardPdf';

export default function CitizenPortalPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedParcel, setSearchedParcel] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Load citizen requests
  useEffect(() => {
    async function loadRequests() {
      try {
        setLoadingRequests(true);
        const res = await fetch('/api/service-requests');
        const json = await res.json();
        if (json.success) {
          setMyRequests(json.data.slice(0, 5));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingRequests(false);
      }
    }
    loadRequests();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const res = await fetch(`/api/parcels/${searchQuery.trim().toUpperCase()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSearchedParcel(json.data);
      } else {
        alert(`No parcel found for: ${searchQuery}`);
      }
    } catch {
      alert('Error searching for parcel');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/30 text-blue-200 text-xs font-bold uppercase tracking-wider border border-blue-400/30">
              Citizen Self-Service Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Namaskara, {user?.name || 'Citizen'}
            </h1>
            <p className="text-xs text-blue-200 max-w-xl">
              Access digital land records, submit mutation/verification requests, download authenticated land cards,
              and track application workflows in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/services"
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-900 hover:bg-blue-50 rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-blue-600" />
              <span>Apply for Service</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl text-xs font-bold border border-blue-400/40 transition-colors"
            >
              <MapIcon className="w-4 h-4" />
              <span>View GIS Map</span>
            </Link>
          </div>
        </div>

        {/* 1. SEARCH LAND & PUBLIC RECORD INSPECTION */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            <span>Search Land Parcel by ULPIN</span>
          </h2>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter 14-digit ULPIN (e.g. KA-BLG-001-000101)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              {searching ? 'Searching...' : 'Search Record'}
            </button>
          </form>

          {/* Searched Result Preview */}
          {searchedParcel && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{searchedParcel.ulpin}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {searchedParcel.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Survey No: {searchedParcel.surveyNo} • {searchedParcel.village}, {searchedParcel.taluk} ({searchedParcel.district})
                </p>
                <p className="text-xs text-slate-500">
                  Extent: {searchedParcel.area} Acres • Land Use: {searchedParcel.landUse}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    generateLandCardPdf({
                      ulpin: searchedParcel.ulpin,
                      surveyNo: searchedParcel.surveyNo,
                      district: searchedParcel.district,
                      taluk: searchedParcel.taluk,
                      village: searchedParcel.village,
                      area: searchedParcel.area,
                      gisArea: searchedParcel.gisArea || searchedParcel.area,
                      landUse: searchedParcel.landUse,
                      ownerName: searchedParcel.ownershipRecords?.[0]?.ownerName || 'Khatadar',
                      status: searchedParcel.status,
                      registrationStatus: searchedParcel.registrations?.[0]?.transactionStatus || 'COMPLETED',
                      encumbranceStatus: searchedParcel.encumbrances?.[0]?.status || 'NONE',
                      taxStatus: searchedParcel.propertyTaxes?.[0]?.paymentStatus || 'PAID',
                      centroidLat: searchedParcel.centroidLat,
                      centroidLng: searchedParcel.centroidLng,
                      riskScore: searchedParcel.riskScore,
                      riskLevel: searchedParcel.riskLevel,
                    })
                  }
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Card</span>
                </button>
                <Link
                  href={`/verify/${searchedParcel.ulpin}`}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold"
                >
                  Verify QR
                </Link>
                <Link
                  href={`/parcels/${searchedParcel.ulpin}`}
                  className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                >
                  Open Parcel 360 &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 2. MY REQUESTS & APPLICATION TRACKER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>My Active Service Applications</span>
              </h2>
              <Link href="/services" className="text-xs text-blue-600 font-bold hover:underline">
                View All / Track &rarr;
              </Link>
            </div>

            {loadingRequests ? (
              <p className="text-xs text-slate-500">Loading requests...</p>
            ) : myRequests.length === 0 ? (
              <p className="text-xs text-slate-500">No applications filed yet.</p>
            ) : (
              <div className="space-y-3">
                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {req.requestNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                          {req.status}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{req.serviceType}</p>
                      <p className="text-[11px] text-slate-400">Parcel: {req.parcelUlpin}</p>
                    </div>

                    <Link
                      href={`/services?tracking=${req.requestNumber}`}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-blue-600 hover:bg-slate-100"
                    >
                      Track
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Citizen Services Sidebar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 dark:text-white text-base">Quick Citizen Actions</h2>
            <div className="space-y-2.5 text-xs">
              <Link
                href="/services"
                className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-200 dark:border-slate-800 transition-colors"
              >
                <p className="font-bold text-slate-800 dark:text-slate-100">Ownership & Title Verification</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Request formal title report certified by Tahasildar.</p>
              </Link>

              <Link
                href="/services"
                className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-200 dark:border-slate-800 transition-colors"
              >
                <p className="font-bold text-slate-800 dark:text-slate-100">Apply for Mutation Extract</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Submit inheritance or sale deed mutation papers.</p>
              </Link>

              <Link
                href="/disputes"
                className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-200 dark:border-slate-800 transition-colors"
              >
                <p className="font-bold text-slate-800 dark:text-slate-100">File Boundary Demarcation Dispute</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Lodge appeal regarding survey encroached buffer.</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
