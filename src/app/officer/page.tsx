'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  FileCheck,
  Scale,
  ShieldAlert,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  ExternalLink,
  RefreshCw,
  FileText,
  UserCheck,
  Eye,
  Filter,
  MessageSquare,
  History,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function OfficerPortalPage() {
  const { user, fetchWithAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<'queue' | 'disputes' | 'conflicts' | 'audit'>('queue');
  const [loading, setLoading] = useState(true);

  // Data states
  const [requests, setRequests] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Action Modals
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [reqStatus, setReqStatus] = useState('');
  const [reqRemarks, setReqRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Conflict Modal
  const [selectedConflict, setSelectedConflict] = useState<any>(null);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictStatus, setConflictStatus] = useState('UNDER_REVIEW');
  const [conflictRemarks, setConflictRemarks] = useState('');

  const loadOfficerData = async () => {
    try {
      setLoading(true);
      const [reqRes, dispRes, confRes] = await Promise.all([
        fetchWithAuth('/api/service-requests'),
        fetchWithAuth('/api/disputes'),
        fetchWithAuth('/api/fraud-alerts'),
      ]);

      const [reqJson, dispJson, confJson] = await Promise.all([
        reqRes.json(),
        dispRes.json(),
        confRes.json(),
      ]);

      if (reqJson.success) setRequests(reqJson.data);
      if (dispJson.success) setDisputes(dispJson.data);
      if (confJson.success) setConflicts(confJson.data);
    } catch (e) {
      console.error('Error loading officer data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfficerData();
  }, []);

  const handleUpdateRequestStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !reqStatus) return;

    try {
      setActionLoading(true);
      const res = await fetchWithAuth(`/api/service-requests/${selectedRequest.requestNumber}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reqStatus,
          remarks: reqRemarks,
          assignedOfficer: user?.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReqModalOpen(false);
        setSelectedRequest(null);
        loadOfficerData();
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch {
      alert('Error communicating with server');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickVerify = async (requestNumber: string) => {
    try {
      setActionLoading(true);
      const res = await fetchWithAuth(`/api/service-requests/${requestNumber}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'VERIFIED',
          remarks: 'Application scrutinized, records verified, and formally endorsed by Revenue Officer.',
          assignedOfficer: user?.name || 'Tahasildar Revenue Cell',
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadOfficerData();
      } else {
        alert(data.message || 'Failed to verify application');
      }
    } catch {
      alert('Error verifying application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateConflict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConflict) return;

    try {
      setActionLoading(true);
      const res = await fetchWithAuth(`/api/fraud-alerts/${selectedConflict.alertNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: conflictStatus,
          remarks: conflictRemarks,
          assignedOfficer: user?.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConflictModalOpen(false);
        setSelectedConflict(null);
        loadOfficerData();
      } else {
        alert(data.message || 'Failed to update conflict');
      }
    } catch {
      alert('Error updating conflict');
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const pendingRequests = requests.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW' || r.status === 'DOCUMENT_VERIFICATION' || r.status === 'OFFICER_REVIEW'
  );
  const openDisputes = disputes.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_INVESTIGATION');
  const activeConflicts = conflicts.filter((c) => c.status === 'OPEN' || c.status === 'UNDER_REVIEW');

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Revenue Officer Adjudication Workspace
                </h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Officer Panel
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Taluk Cadastral Verification Cell • Mandate: Application Scrutiny, Field Inspections, & Conflict Adjudication
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadOfficerData}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Docket</span>
            </button>
            <div className="text-right text-xs hidden sm:block">
              <p className="font-bold text-slate-800 dark:text-slate-200">{user?.name}</p>
              <p className="text-[11px] text-slate-400">{user?.department}</p>
            </div>
          </div>
        </div>

        {/* 4 Workload Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Verification Queue</span>
              <FileCheck className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{pendingRequests.length}</p>
            <p className="text-[10px] text-slate-400">Applications awaiting scrutiny</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Active Disputes</span>
              <Scale className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{openDisputes.length}</p>
            <p className="text-[10px] text-slate-400">Revenue court appeals</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Data Conflict Inquiries</span>
              <ShieldAlert className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{activeConflicts.length}</p>
            <p className="text-[10px] text-slate-400">Boundary & area anomalies</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Completed Actions</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {requests.filter((r) => r.status === 'COMPLETED' || r.status === 'APPROVED').length}
            </p>
            <p className="text-[10px] text-slate-400">Disposed cases this cycle</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('queue')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'queue'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Service Request Verification Queue ({requests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('disputes')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'disputes'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Assigned Disputes Docket ({disputes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('conflicts')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'conflicts'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Potential Data Conflicts ({conflicts.length})</span>
          </button>
        </div>

        {/* TAB 1: VERIFICATION QUEUE */}
        {activeTab === 'queue' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Citizen Applications Requiring Officer Action
              </h2>
              <span className="text-[11px] text-slate-400">Authorized: Scrutiny, Document Verification, and Approval</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">Loading verification queue...</div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">No applications currently in queue.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="p-3.5">Request #</th>
                      <th className="p-3.5">Parcel ULPIN</th>
                      <th className="p-3.5">Service Type</th>
                      <th className="p-3.5">Applicant</th>
                      <th className="p-3.5">Current Status</th>
                      <th className="p-3.5">Remarks / Case Note</th>
                      <th className="p-3.5 text-right">Officer Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {req.requestNumber}
                        </td>
                        <td className="p-3.5">
                          <Link
                            href={`/parcels/${req.parcelUlpin}`}
                            className="font-mono font-semibold hover:underline text-slate-800 dark:text-slate-200"
                          >
                            {req.parcelUlpin}
                          </Link>
                          {req.parcel?.village && (
                            <p className="text-[10px] text-slate-400">{req.parcel.village} ({req.parcel.district})</p>
                          )}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{req.serviceType}</td>
                        <td className="p-3.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{req.citizenName}</p>
                          <p className="text-[10px] text-slate-400">{req.citizenPhone}</p>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              req.status === 'APPROVED' || req.status === 'VERIFIED' || req.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.status === 'REJECTED'
                                ? 'bg-red-100 text-red-800'
                                : req.status === 'UNDER_REVIEW' || req.status === 'DOCUMENT_VERIFICATION'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {req.status === 'VERIFIED' ? '✓ VERIFIED' : req.status}
                          </span>
                        </td>
                        <td className="p-3.5 max-w-xs text-slate-600 dark:text-slate-300 truncate" title={req.remarks}>
                          {req.remarks || 'None'}
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          {req.status !== 'VERIFIED' && req.status !== 'APPROVED' && (
                            <button
                              onClick={() => handleQuickVerify(req.requestNumber)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded font-bold shadow-sm inline-flex items-center gap-1 transition-colors"
                              title="Officially Verify & Endorse Application"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Verify</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setReqStatus(req.status);
                              setReqRemarks(req.remarks || '');
                              setReqModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-sm transition-colors"
                          >
                            Adjudicate
                          </button>
                          <Link
                            href={`/parcels/${req.parcelUlpin}`}
                            className="inline-block p-1 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Inspect Parcel 360"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ASSIGNED DISPUTES */}
        {activeTab === 'disputes' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Revenue Court Appeals Assigned to This Officer Bench
              </h2>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">Loading assigned disputes...</div>
            ) : disputes.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">No disputes currently assigned.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="p-3.5">Dispute #</th>
                      <th className="p-3.5">Parcel / Survey</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Petitioner</th>
                      <th className="p-3.5">Grievance Summary</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {disputes.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-purple-600 dark:text-purple-400">
                          {d.disputeNumber}
                        </td>
                        <td className="p-3.5">
                          <Link
                            href={`/parcels/${d.parcelUlpin}`}
                            className="font-mono font-semibold hover:underline text-slate-800 dark:text-slate-200"
                          >
                            {d.parcelUlpin}
                          </Link>
                          <p className="text-[10px] text-slate-400">Survey {d.surveyNumber}</p>
                        </td>
                        <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">{d.disputeType}</td>
                        <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{d.citizenName}</td>
                        <td className="p-3.5 max-w-xs text-slate-600 dark:text-slate-300 truncate" title={d.description}>
                          {d.description}
                        </td>
                        <td className="p-3.5">
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
                        <td className="p-3.5 text-right">
                          <Link
                            href={`/parcels/${d.parcelUlpin}`}
                            className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline"
                          >
                            <span>Inspect Parcel</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CONFLICT INVESTIGATION */}
        {activeTab === 'conflicts' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Spatial & Legal Data Conflict Investigations (Assigned Cell)
              </h2>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">Loading conflict alerts...</div>
            ) : conflicts.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">No active conflict alerts.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="p-3.5">Alert #</th>
                      <th className="p-3.5">Parcel ULPIN</th>
                      <th className="p-3.5">Conflict Type</th>
                      <th className="p-3.5">Severity</th>
                      <th className="p-3.5">Anomaly Flag Reason</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {conflicts.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                          {c.alertNumber}
                        </td>
                        <td className="p-3.5 font-mono font-semibold">
                          <Link href={`/parcels/${c.parcelUlpin}`} className="hover:underline text-blue-600">
                            {c.parcelUlpin}
                          </Link>
                        </td>
                        <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{c.conflictType}</td>
                        <td className="p-3.5">
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
                        <td className="p-3.5 max-w-xs text-slate-600 dark:text-slate-300 truncate" title={c.reason}>
                          {c.reason}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.status === 'RESOLVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.status === 'UNDER_REVIEW'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedConflict(c);
                              setConflictStatus(c.status);
                              setConflictRemarks(c.remarks || '');
                              setConflictModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-bold"
                          >
                            Investigate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Adjudicate Request Modal */}
        {reqModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <form
              onSubmit={handleUpdateRequestStatus}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Officer Adjudication: {selectedRequest.requestNumber}
                </h3>
                <button type="button" onClick={() => setReqModalOpen(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <p><strong>Service:</strong> {selectedRequest.serviceType}</p>
                <p><strong>Parcel:</strong> {selectedRequest.parcelUlpin}</p>
                <p><strong>Applicant:</strong> {selectedRequest.citizenName} ({selectedRequest.citizenPhone})</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Advance Workflow Status:</label>
                <select
                  value={reqStatus}
                  onChange={(e) => setReqStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs"
                >
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="DOCUMENT_VERIFICATION">Document Verification</option>
                  <option value="OFFICER_REVIEW">Officer Review</option>
                  <option value="VERIFIED">Verified (Official Verification Endorsed)</option>
                  <option value="APPROVED">Approved (Mutation Endorsed)</option>
                  <option value="REJECTED">Rejected (Defect Notice Issued)</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Officer Scrutiny Findings & Official Remarks:
                </label>
                <textarea
                  rows={4}
                  required
                  value={reqRemarks}
                  onChange={(e) => setReqRemarks(e.target.value)}
                  placeholder="Record deed comparison findings, survey verification, or defect instructions..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReqModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow"
                >
                  {actionLoading ? 'Recording Decision...' : 'Commit Adjudication'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Investigate Conflict Modal */}
        {conflictModalOpen && selectedConflict && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <form
              onSubmit={handleUpdateConflict}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Investigate Conflict: {selectedConflict.alertNumber}
                </h3>
                <button type="button" onClick={() => setConflictModalOpen(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <p><strong>Conflict Type:</strong> {selectedConflict.conflictType}</p>
                <p><strong>Severity:</strong> {selectedConflict.severity}</p>
                <p><strong>Anomaly Reason:</strong> {selectedConflict.reason}</p>
                <p><strong>Target Parcel:</strong> {selectedConflict.parcelUlpin}</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Investigation Status:</label>
                <select
                  value={conflictStatus}
                  onChange={(e) => setConflictStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs"
                >
                  <option value="OPEN">Open</option>
                  <option value="UNDER_REVIEW">Under Review / Field Survey Ordered</option>
                  <option value="RESOLVED">Resolved (Resurvey Completed & Cleared)</option>
                  <option value="DISMISSED">Dismissed (False Positive Cleared)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Field Inspection Notes & Total Station Survey Remarks:
                </label>
                <textarea
                  rows={4}
                  required
                  value={conflictRemarks}
                  onChange={(e) => setConflictRemarks(e.target.value)}
                  placeholder="Enter field resurvey findings or boundary reconciliation rationale..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setConflictModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow"
                >
                  {actionLoading ? 'Saving...' : 'Save Investigation Findings'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
