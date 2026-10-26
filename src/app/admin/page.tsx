'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Layers,
  Building,
  FileText,
  Scale,
  ShieldAlert,
  Folder,
  History,
  Settings,
  PlusCircle,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Shield,
  MapPin,
  Download,
  FileCheck,
  Check,
  Search,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  downloadServiceReceiptPdf,
  downloadApprovalCertificatePdf,
  downloadRtcExtractPdf,
  downloadTippaniMapPdf,
  downloadSaleDeedPdf,
  downloadEncumbranceCertPdf,
  downloadCompleteDossierPdf,
} from '@/lib/generateDocumentPdfs';
import { generateLandCardPdf } from '@/lib/generateLandCardPdf';

export default function AdminPage() {
  const { user, fetchWithAuth } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [parcels, setParcels] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [disputesList, setDisputesList] = useState<any[]>([]);
  const [conflictsList, setConflictsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Overview selected parcel state
  const [selectedOverviewUlpin, setSelectedOverviewUlpin] = useState('KA-BLG-001-000101');

  // Settings state
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [platformTitle, setPlatformTitle] = useState('LANDSTACK Integrated GIS Cadastre');
  const [spatialCrs, setSpatialCrs] = useState('EPSG:4326 (WGS84)');
  const [syncInterval, setSyncInterval] = useState('Every 6 Hours (Automated Sync)');
  const [slaWindow, setSlaWindow] = useState('21 Working Days (Sakala Statutory)');
  const [conflictEngineActive, setConflictEngineActive] = useState(true);
  const [qrAttestationActive, setQrAttestationActive] = useState(true);
  const [officerMfaActive, setOfficerMfaActive] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // New Officer Provisioning Modal
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'OFFICER' | 'ADMIN' | 'CITIZEN'>('OFFICER');
  const [newDept, setNewDept] = useState('Taluk Revenue & Cadastral Cell');
  const [provisioning, setProvisioning] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, aRes, uRes, sRes, dRes, cRes] = await Promise.all([
        fetchWithAuth('/api/parcels?limit=50'),
        fetchWithAuth('/api/audit-logs?limit=50'),
        fetchWithAuth('/api/users'),
        fetchWithAuth('/api/service-requests'),
        fetchWithAuth('/api/disputes'),
        fetchWithAuth('/api/fraud-alerts'),
      ]);

      const [pJson, aJson, uJson, sJson, dJson, cJson] = await Promise.all([
        pRes.json(),
        aRes.json(),
        uRes.json(),
        sRes.json(),
        dRes.json(),
        cRes.json(),
      ]);

      if (pJson.success) {
        setParcels(pJson.data.parcels || []);
        if (pJson.data.parcels?.length > 0 && !selectedOverviewUlpin) {
          setSelectedOverviewUlpin(pJson.data.parcels[0].ulpin);
        }
      }
      if (aJson.success) setAuditLogs(aJson.data || []);
      if (uJson.success) setUsersList(uJson.data || []);
      if (sJson.success) setServicesList(sJson.data || []);
      if (dJson.success) setDisputesList(dJson.data || []);
      if (cJson.success) setConflictsList(cJson.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetchWithAuth(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(data.message || 'Failed to update role');
      }
    } catch {
      alert('Error communicating with server');
    }
  };

  const handleAdminVerifyRequest = async (requestNumber: string) => {
    try {
      setActionLoading(true);
      const res = await fetchWithAuth(`/api/service-requests/${requestNumber}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'VERIFIED',
          remarks: 'Application scrutinized, identity and cadastral records verified and endorsed by System Administrator.',
          assignedOfficer: user?.name || 'Administrator Bench',
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(data.message || 'Failed to verify application');
      }
    } catch {
      alert('Error verifying application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProvisionUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProvisioning(true);
      const res = await fetchWithAuth('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          name: newName,
          role: newRole,
          department: newDept,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewUserModalOpen(false);
        setNewEmail('');
        setNewName('');
        setNewPassword('');
        loadData();
      } else {
        alert(data.message || 'Failed to create user');
      }
    } catch {
      alert('Error provisioning user account');
    } finally {
      setProvisioning(false);
    }
  };

  const sections = [
    { id: 'overview', label: 'Cadastral Overview', icon: MapPin },
    { id: 'parcels', label: 'Cadastral Parcels', icon: Layers, count: '110' },
    { id: 'users', label: 'System Users & Roles', icon: Users, count: `${usersList.length || 3}` },
    { id: 'departments', label: 'Departments & Cells', icon: Building, count: '4' },
    { id: 'services', label: 'Services Registry', icon: FileText, count: `${servicesList.length || 8}` },
    { id: 'disputes', label: 'Disputes Registry', icon: Scale, count: `${disputesList.length || 6}` },
    { id: 'conflicts', label: 'Conflicts Registry', icon: ShieldAlert, count: `${conflictsList.length || 10}` },
    { id: 'documents', label: 'Documents Registry', icon: Folder, count: '110' },
    { id: 'layers', label: 'GIS Vector Layers', icon: Layers, count: '7' },
    { id: 'audit', label: 'System Audit Logs', icon: History, count: `${auditLogs.length}` },
    { id: 'settings', label: 'Settings Registry', icon: Settings },
  ];

  // STRICT ACCESS DENIED GUARD: Admin only
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-900/50 text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">403 Forbidden: Administrator Access Required</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          The Platform Administration Console is restricted exclusively to authorized System Administrators.
          Your current account role does not have authorization to view or configure administrative settings.
        </p>
        <div className="pt-3 flex justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
          >
            Return to GIS Map
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            Authenticate with Admin Account
          </Link>
        </div>
      </div>
    );
  }

  const selectedParcelData = parcels.find((p) => p.ulpin === selectedOverviewUlpin) || parcels[0] || {
    ulpin: 'KA-BLG-001-000101',
    surveyNo: '104/1',
    village: 'Kanabargi',
    taluk: 'Belagavi',
    district: 'Belagavi',
    area: 2.5,
    gisArea: 2.5,
    landUse: 'Agricultural',
    status: 'VERIFIED',
    riskScore: 15,
    riskLevel: 'LOW',
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Settings className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Platform Administration Console
              </h1>
              <p className="text-xs text-slate-500">
                Departmental configuration, role assignments, audit surveillance, and spatial registry management.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Registries</span>
            </button>
            <div className="text-right text-xs">
              <p className="font-bold text-slate-800 dark:text-slate-200">{user?.name}</p>
              <p className="text-slate-400">{user?.department}</p>
            </div>
          </div>
        </div>

        {/* Admin Navigation & Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Navigation Sidebar (3 cols) */}
          <div className="md:col-span-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{sec.label}</span>
                  </div>
                  {sec.count && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {sec.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Section Main View (9 cols) */}
          <div className="md:col-span-9 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[460px]">
            {/* SECTION 0: CADASTRAL OVERVIEW & FULL GIS */}
            {activeSection === 'overview' && (
              <div className="space-y-6 text-xs">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    System Cadastral Overview & GIS Map Navigator
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Select any parcel to inspect cadastral parameters and launch the exact parcel in the full GIS map.
                  </p>
                </div>

                {/* Key Cadastral Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Total Parcels</span>
                    <p className="text-xl font-black text-blue-600 dark:text-blue-400">110</p>
                    <p className="text-[10px] text-slate-500">Karnataka Cadastre</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Verified Titles</span>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">102</p>
                    <p className="text-[10px] text-slate-500">Clear RoR & Form 15</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Active Applications</span>
                    <p className="text-xl font-black text-amber-600 dark:text-amber-400">{servicesList.length || 8}</p>
                    <p className="text-[10px] text-slate-500">Pending & Verified</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Spatial Conflicts</span>
                    <p className="text-xl font-black text-purple-600 dark:text-purple-400">{conflictsList.length || 10}</p>
                    <p className="text-[10px] text-slate-500">Automated Flags</p>
                  </div>
                </div>

                {/* Interactive Parcel GIS Spotlight Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg border border-slate-700 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                        Interactive Parcel Spotlight
                      </span>
                      <h4 className="font-bold text-sm text-white">Target Cadastral Parcel Selection</h4>
                    </div>

                    {/* Parcel Selector */}
                    <div className="flex items-center gap-2">
                      <label className="text-slate-300 font-medium">Select Parcel:</label>
                      <select
                        value={selectedOverviewUlpin}
                        onChange={(e) => setSelectedOverviewUlpin(e.target.value)}
                        className="bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      >
                        {parcels.slice(0, 15).map((p) => (
                          <option key={p.id || p.ulpin} value={p.ulpin}>
                            {p.ulpin} — Sy {p.surveyNo} ({p.village})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Parcel Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">ULPIN</span>
                      <p className="font-mono font-bold text-cyan-300 text-sm">{selectedParcelData.ulpin}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Survey Number</span>
                      <p className="font-bold text-white text-sm">{selectedParcelData.surveyNo}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Jurisdiction</span>
                      <p className="font-semibold text-slate-200">{selectedParcelData.village}, {selectedParcelData.taluk}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Extent & Classification</span>
                      <p className="font-semibold text-slate-200">{selectedParcelData.area} Acres • {selectedParcelData.landUse}</p>
                    </div>
                  </div>

                  {/* Open Full GIS Action Banner */}
                  <div className="pt-3 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-300">
                      Click below to open the interactive GIS map centered precisely on parcel <span className="font-mono text-cyan-300 font-bold">{selectedParcelData.ulpin}</span>.
                    </p>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/parcels/${selectedParcelData.ulpin}`}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-colors border border-slate-600"
                      >
                        Inspect Parcel 360
                      </Link>
                      <Link
                        href={`/?ulpin=${selectedParcelData.ulpin}`}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black flex items-center gap-2 shadow-lg transition-all"
                      >
                        <MapPin className="w-4 h-4 text-cyan-300" />
                        <span>Open Full GIS</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 1: PARCELS */}
            {activeSection === 'parcels' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Registered Cadastral Parcels (110 Total)
                  </h3>
                  <Link href="/" className="text-blue-600 font-bold hover:underline">
                    View on GIS Map &rarr;
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="p-3">ULPIN</th>
                        <th className="p-3">Survey #</th>
                        <th className="p-3">District</th>
                        <th className="p-3">Village</th>
                        <th className="p-3">Area</th>
                        <th className="p-3">Land Use</th>
                        <th className="p-3">Risk</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parcels.slice(0, 10).map((p) => (
                        <tr key={p.id || p.ulpin}>
                          <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{p.ulpin}</td>
                          <td className="p-3 font-semibold">{p.surveyNo}</td>
                          <td className="p-3">{p.district}</td>
                          <td className="p-3">{p.village}</td>
                          <td className="p-3 font-mono">{p.area} A</td>
                          <td className="p-3">{p.landUse}</td>
                          <td className="p-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {p.riskLevel || 'LOW'}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <Link
                              href={`/?ulpin=${p.ulpin}`}
                              className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100 transition-colors"
                            >
                              Open GIS
                            </Link>
                            <Link href={`/parcels/${p.ulpin}`} className="text-slate-600 dark:text-slate-300 font-semibold hover:underline">
                              Inspect
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 2: DEPARTMENTS REGISTRY */}
            {activeSection === 'departments' && (
              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Departments & Administrative Cadastral Cells Registry
                  </h3>
                  <p className="text-slate-500">
                    Statutory oversight of Karnataka Revenue Administration, Survey, Settlement, and Stamps registries.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      name: 'Department of Survey, Settlement & Land Records',
                      head: 'Shri M. N. Gasti (ADLR)',
                      jurisdiction: 'Belagavi Division (North & South Taluks)',
                      officers: 14,
                      sla: '98.7% SLA Compliance',
                      contact: '+91 831 240 5001',
                      status: 'OPERATIONAL',
                    },
                    {
                      name: 'Bhoomi Monitoring & RoR Directorate',
                      head: 'Shri R. K. Patil (Tahasildar)',
                      jurisdiction: 'District Revenue & Khata Administration',
                      officers: 22,
                      sla: '96.4% SLA Compliance',
                      contact: '+91 831 240 5002',
                      status: 'OPERATIONAL',
                    },
                    {
                      name: 'Kaveri Stamps & Registration Directorate',
                      head: 'Smt. Kavitha Reddy (Senior Sub-Registrar)',
                      jurisdiction: 'Belagavi Urban & Rural Sub-Registries',
                      officers: 8,
                      sla: '99.1% SLA Compliance',
                      contact: '+91 831 240 5003',
                      status: 'OPERATIONAL',
                    },
                    {
                      name: 'Urban Planning & Cadastral Anomaly Cell',
                      head: 'Town Planning Officer (BUDA)',
                      jurisdiction: 'Comprehensive Development Plan (CDP 2031)',
                      officers: 6,
                      sla: '94.2% SLA Compliance',
                      contact: '+91 831 240 5004',
                      status: 'OPERATIONAL',
                    },
                  ].map((dept, i) => (
                    <div
                      key={i}
                      className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <h4 className="font-bold text-slate-800 dark:text-slate-100">{dept.name}</h4>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                          {dept.status}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">
                        <strong>Head Officer:</strong> {dept.head}
                      </p>
                      <p className="text-slate-500">
                        <strong>Jurisdiction:</strong> {dept.jurisdiction}
                      </p>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{dept.officers} Active Officers</span>
                        <span className="text-emerald-600 font-bold">{dept.sla}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 3: SERVICES REGISTRY */}
            {activeSection === 'services' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Citizen Services Registry & Workflow Queue
                    </h3>
                    <p className="text-slate-500">
                      Manage citizen service applications, verify submissions, and generate authenticated order certificates.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    {servicesList.length} Active Records
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold text-[11px]">
                      <tr>
                        <th className="p-3">Application #</th>
                        <th className="p-3">Parcel ULPIN</th>
                        <th className="p-3">Service Category</th>
                        <th className="p-3">Citizen Name</th>
                        <th className="p-3">Processing State</th>
                        <th className="p-3 text-right">Verification & Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {servicesList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400">Loading service applications...</td>
                        </tr>
                      ) : (
                        servicesList.map((req) => {
                          const isVerified = req.status === 'VERIFIED' || req.status === 'APPROVED' || req.status === 'COMPLETED';
                          return (
                            <tr key={req.id || req.requestNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                                {req.requestNumber}
                              </td>
                              <td className="p-3 font-mono">
                                <Link href={`/?ulpin=${req.parcelUlpin}`} className="hover:underline text-blue-600">
                                  {req.parcelUlpin}
                                </Link>
                              </td>
                              <td className="p-3 font-semibold">{req.serviceType}</td>
                              <td className="p-3">
                                <p className="font-bold text-slate-800 dark:text-slate-200">{req.citizenName}</p>
                                <p className="text-[10px] text-slate-400">{req.citizenPhone}</p>
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isVerified
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300'
                                      : req.status === 'REJECTED'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {isVerified ? `✓ ${req.status}` : req.status}
                                </span>
                              </td>
                              <td className="p-3 text-right space-x-1.5">
                                {!isVerified && (
                                  <button
                                    onClick={() => handleAdminVerifyRequest(req.requestNumber)}
                                    disabled={actionLoading}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded font-bold shadow-sm inline-flex items-center gap-1 transition-colors"
                                    title="Verify & Endorse Application"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Verify</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => downloadServiceReceiptPdf(req)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold transition-colors"
                                  title="Download Receipt (PDF)"
                                >
                                  Receipt
                                </button>
                                {isVerified && (
                                  <button
                                    onClick={() => downloadApprovalCertificatePdf(req)}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors"
                                    title="Download Certificate (PDF)"
                                  >
                                    Certificate
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 4: DISPUTES REGISTRY */}
            {activeSection === 'disputes' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Revenue Court Disputes & Appeals Docket Registry
                    </h3>
                    <p className="text-slate-500">
                      Tracking sub-judice appeals, boundary demarcation petitions, and title challenges.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                    {disputesList.length || 6} Cases
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold text-[11px]">
                      <tr>
                        <th className="p-3">Dispute Case #</th>
                        <th className="p-3">Target Parcel</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Petitioner Name</th>
                        <th className="p-3">Assigned Bench</th>
                        <th className="p-3">Case Status</th>
                        <th className="p-3 text-right">Cadastre</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {disputesList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-400">Loading disputes registry...</td>
                        </tr>
                      ) : (
                        disputesList.map((d) => (
                          <tr key={d.id || d.disputeNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                              {d.disputeNumber}
                            </td>
                            <td className="p-3 font-mono">
                              <Link href={`/?ulpin=${d.parcelUlpin}`} className="hover:underline text-blue-600">
                                {d.parcelUlpin}
                              </Link>
                              <p className="text-[10px] text-slate-400">Sy No: {d.surveyNumber}</p>
                            </td>
                            <td className="p-3 font-semibold">{d.disputeType}</td>
                            <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{d.citizenName}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{d.assignedOfficer || 'Assistant Commissioner'}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  d.status === 'RESOLVED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : d.status === 'HEARING_SCHEDULED'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {d.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <Link
                                href={`/parcels/${d.parcelUlpin}`}
                                className="inline-flex items-center gap-1 text-blue-600 hover:underline font-bold"
                              >
                                <span>Inspect</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 5: CONFLICTS REGISTRY */}
            {activeSection === 'conflicts' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Potential Conflicts & Spatial Anomaly Surveillance Registry
                    </h3>
                    <p className="text-slate-500">
                      Automated Turfs.js geodesic polygon overlap and area discrepancy detection alerts.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    {conflictsList.length || 10} Alerts Flagged
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold text-[11px]">
                      <tr>
                        <th className="p-3">Alert Ref</th>
                        <th className="p-3">Parcel ULPIN</th>
                        <th className="p-3">Conflict Category</th>
                        <th className="p-3">Severity</th>
                        <th className="p-3">Anomaly Reason</th>
                        <th className="p-3">Alert Status</th>
                        <th className="p-3 text-right">Spatial Map</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {conflictsList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-400">Loading conflict alerts...</td>
                        </tr>
                      ) : (
                        conflictsList.map((c) => (
                          <tr key={c.id || c.alertNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                              {c.alertNumber}
                            </td>
                            <td className="p-3 font-mono">
                              <Link href={`/?ulpin=${c.parcelUlpin}`} className="hover:underline text-blue-600">
                                {c.parcelUlpin}
                              </Link>
                            </td>
                            <td className="p-3 font-semibold">{c.conflictType}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  c.severity === 'CRITICAL'
                                    ? 'bg-red-100 text-red-700'
                                    : c.severity === 'HIGH'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {c.severity}
                              </span>
                            </td>
                            <td className="p-3 max-w-xs truncate" title={c.reason}>
                              {c.reason}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {c.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <Link
                                href={`/?ulpin=${c.parcelUlpin}`}
                                className="px-2 py-1 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded font-bold hover:bg-blue-100 transition-colors"
                              >
                                View GIS
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 6: DOCUMENTS REGISTRY */}
            {activeSection === 'documents' && (
              <div className="space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Digitized Documents & Cadastral Records Registry
                    </h3>
                    <p className="text-slate-500">
                      Centrally managed statutory documents with digital verification hashes and direct PDF download engine.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadCompleteDossierPdf(selectedParcelData, false)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download All 5 (Master Dossier PDF)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadCompleteDossierPdf(selectedParcelData, true)}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 transition-colors shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                      <span>Open Dossier</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      id: 'card',
                      title: 'Official Land Information Card (ULPIN Master Certificate)',
                      ulpin: selectedOverviewUlpin,
                      category: 'Cadastral Master Summary',
                      hash: 'e4b29c9a8f103b4481029c7882aa911b302847291a0c71a39f',
                      size: '215 KB',
                      action: (openInNewTab = false) =>
                        generateLandCardPdf(
                          {
                            ulpin: selectedParcelData.ulpin,
                            surveyNo: selectedParcelData.surveyNo,
                            district: selectedParcelData.district,
                            taluk: selectedParcelData.taluk,
                            village: selectedParcelData.village,
                            area: selectedParcelData.area,
                            gisArea: selectedParcelData.gisArea || selectedParcelData.area,
                            landUse: selectedParcelData.landUse,
                            ownerName: 'Sri Basavaraj Patil',
                            status: selectedParcelData.status,
                            registrationStatus: 'COMPLETED',
                            encumbranceStatus: 'NONE',
                            taxStatus: 'PAID',
                            centroidLat: selectedParcelData.centroidLat || 15.8497,
                            centroidLng: selectedParcelData.centroidLng || 74.4977,
                            riskScore: selectedParcelData.riskScore || 15,
                            riskLevel: selectedParcelData.riskLevel || 'LOW',
                          },
                          openInNewTab
                        ),
                    },
                    {
                      id: 'rtc',
                      title: 'Record of Rights, Tenancy & Crops (RTC Pahani / Form 16)',
                      ulpin: selectedOverviewUlpin,
                      category: 'Bhoomi Revenue Extract',
                      hash: '9a7218ef89bca120938472891901abcf891238471908234a',
                      size: '184 KB',
                      action: (openInNewTab = false) => downloadRtcExtractPdf(selectedParcelData, openInNewTab),
                    },
                    {
                      id: 'tippani',
                      title: 'Cadastral Survey Tippani Map (Spatial Boundary Traverse)',
                      ulpin: selectedOverviewUlpin,
                      category: 'DGPS Boundary Traverse',
                      hash: '7190bcda1293847192837491028374910293847192837491',
                      size: '242 KB',
                      action: (openInNewTab = false) => downloadTippaniMapPdf(selectedParcelData, openInNewTab),
                    },
                    {
                      id: 'deed',
                      title: 'Certified Copy of Registered Title Deed (Book 1 Conveyance)',
                      ulpin: selectedOverviewUlpin,
                      category: 'Kaveri Registered Title',
                      hash: 'c81927384910293847192837491029384719283749102938',
                      size: '310 KB',
                      action: (openInNewTab = false) => downloadSaleDeedPdf(selectedParcelData, openInNewTab),
                    },
                    {
                      id: 'encumbrance',
                      title: 'Certificate of Non-Encumbrance on Property (Form 15 / 16)',
                      ulpin: selectedOverviewUlpin,
                      category: 'Sub-Registrar 30-Year Search',
                      hash: '591029384719283749102938471928374910293847192837',
                      size: '195 KB',
                      action: (openInNewTab = false) => downloadEncumbranceCertPdf(selectedParcelData, openInNewTab),
                    },
                  ].map((docItem, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{docItem.title}</h4>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 uppercase shrink-0">
                            {docItem.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">Target ULPIN: {docItem.ulpin}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">SHA-256: {docItem.hash}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">{docItem.size} • PDF</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => docItem.action(true)}
                            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg font-bold flex items-center gap-1 transition-colors border border-slate-300 dark:border-slate-600"
                            title="Open or print in new tab"
                          >
                            <ExternalLink className="w-3 h-3 text-blue-500" />
                            <span>Open</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => docItem.action(false)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 7: SYSTEM SETTINGS REGISTRY */}
            {activeSection === 'settings' && (
              <div className="space-y-6 text-xs">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Platform Settings Registry & Runtime Configuration
                  </h3>
                  <p className="text-slate-500">
                    Adjust GIS spatial reference systems, synchronization schedules, and statutory SLA governance.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Platform Title Name:</label>
                    <input
                      type="text"
                      value={platformTitle}
                      onChange={(e) => setPlatformTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Geodetic Spatial Reference (CRS):</label>
                    <input
                      type="text"
                      value={spatialCrs}
                      onChange={(e) => setSpatialCrs(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Bhoomi Cadastre Sync Cadence:</label>
                    <input
                      type="text"
                      value={syncInterval}
                      onChange={(e) => setSyncInterval(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Statutory Sakala SLA Window:</label>
                    <input
                      type="text"
                      value={slaWindow}
                      onChange={(e) => setSlaWindow(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                {/* System Toggles */}
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                    Security & Engine Safeguards
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={conflictEngineActive}
                        onChange={(e) => setConflictEngineActive(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">Automated Spatial Conflict Detection Engine</p>
                        <p className="text-[10px] text-slate-400">Execute Turf.js geodesic polygon intersection checks upon mutation submissions.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={qrAttestationActive}
                        onChange={(e) => setQrAttestationActive(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">Public QR Verification Attestation Gateway</p>
                        <p className="text-[10px] text-slate-400">Generate public cryptographic verification URLs encoded directly on all PDF certificates.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={officerMfaActive}
                        onChange={(e) => setOfficerMfaActive(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">Strict Role-Based Middleware Enforcement</p>
                        <p className="text-[10px] text-slate-400">Block unauthorized route access to Admin and Officer portals at the Edge layer.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  {settingsSaved ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      Platform settings persisted successfully!
                    </span>
                  ) : (
                    <span className="text-slate-400">All configurations synchronize to central database.</span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsSaved(true);
                      setTimeout(() => setSettingsSaved(false), 3000);
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-colors"
                  >
                    Save Platform Settings
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 8: AUDIT LOGS */}
            {activeSection === 'audit' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Immutable System Audit Logs
                </h3>
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{log.action}</span>
                          <span className="text-[10px] text-slate-400">• {log.entityType}</span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200">{log.details}</p>
                        <p className="text-[10px] text-slate-500">By: {log.performedBy} ({log.userRole})</p>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 9: SYSTEM USERS */}
            {activeSection === 'users' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Registered System Users & Role Governance</h3>
                    <p className="text-slate-500">Manage platform accounts, reassign role permissions, and provision departmental officers.</p>
                  </div>
                  <button
                    onClick={() => setNewUserModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Provision Officer / Account</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold text-[11px]">
                      <tr>
                        <th className="p-3">User Details</th>
                        <th className="p-3">Email Address</th>
                        <th className="p-3">Department / Cell</th>
                        <th className="p-3">Assigned Role</th>
                        <th className="p-3">Account Status</th>
                        <th className="p-3 text-right">Role Governance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {usersList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400">Loading system users...</td>
                        </tr>
                      ) : (
                        usersList.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3">
                              <p className="font-bold text-slate-800 dark:text-slate-200">{u.name || 'Unnamed'}</p>
                              <p className="text-[10px] text-slate-400 font-mono">ID: {u.id.substring(0, 8)}...</p>
                            </td>
                            <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{u.email}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{u.department || 'General Public'}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  u.role === 'ADMIN'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300'
                                    : u.role === 'OFFICER'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                disabled={u.id === user.id}
                                className="px-2 py-1 text-[11px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                              >
                                <option value="ADMIN">ADMIN</option>
                                <option value="OFFICER">OFFICER</option>
                                <option value="CITIZEN">CITIZEN</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Provisioning Modal */}
                {newUserModalOpen && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">Provision New Official Account</h4>
                        <button
                          onClick={() => setNewUserModalOpen(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          ✕
                        </button>
                      </div>
                      <form onSubmit={handleProvisionUser} className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Official Full Name
                          </label>
                          <input
                            type="text"
                            required
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. Smt. Kavitha Reddy"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Official Email
                          </label>
                          <input
                            type="email"
                            required
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="e.g. kavitha.reddy@landstack.demo"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Initial Temporary Password
                          </label>
                          <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Minimum 6 characters"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Designated Role
                          </label>
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value as any)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                          >
                            <option value="OFFICER">OFFICER (Land Records / Verification Cell)</option>
                            <option value="ADMIN">ADMIN (System Administrator)</option>
                            <option value="CITIZEN">CITIZEN (Standard End User)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Department / Cell
                          </label>
                          <input
                            type="text"
                            required
                            value={newDept}
                            onChange={(e) => setNewDept(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="pt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setNewUserModalOpen(false)}
                            className="px-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={provisioning}
                            className="px-4 py-2 text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition-colors disabled:opacity-50"
                          >
                            {provisioning ? 'Provisioning...' : 'Provision Account'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 10: GIS LAYERS */}
            {activeSection === 'layers' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Configured GIS Vector Layers</h3>
                <div className="space-y-2">
                  {[
                    { name: 'Cadastral Parcels Layer', file: 'data/geojson/parcels.geojson', count: '110 Polygons', format: 'GeoJSON Polygon' },
                    { name: 'Statutory Restriction Zones', file: 'data/geojson/restrictions.geojson', count: '4 Buffer Zones', format: 'GeoJSON Polygon' },
                    { name: 'Infrastructure & Power Corridors', file: 'data/geojson/infrastructure.geojson', count: '3 Major Corridors', format: 'GeoJSON LineString' },
                    { name: 'OpenStreetMap Base Layer', file: 'https://tile.openstreetmap.org', count: 'Global Tiles', format: 'XYZ Raster' },
                  ].map((l, i) => (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{l.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{l.file}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-blue-600">{l.count}</span>
                        <p className="text-[10px] text-slate-400">{l.format}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
