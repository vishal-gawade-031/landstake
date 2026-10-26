'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FileText,
  Send,
  CheckCircle,
  Clock,
  Search,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Building,
  DollarSign,
  Layers,
  Lock,
  Download,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { downloadServiceReceiptPdf, downloadApprovalCertificatePdf } from '@/lib/generateDocumentPdfs';

const WORKFLOW_STEPS = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'DOCUMENT_VERIFICATION',
  'OFFICER_REVIEW',
  'VERIFIED',
  'APPROVED',
  'COMPLETED',
];

const SERVICE_TYPES = [
  'Ownership Verification',
  'Land Record Information',
  'Mutation Request',
  'Encumbrance Information',
  'Land Use Information',
  'Building Permission Information',
  'Property Tax Information',
  'Dispute Submission',
];

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ServicesContent />
    </Suspense>
  );
}

function ServicesContent() {
  const { user, fetchWithAuth } = useAuth();
  const searchParams = useSearchParams();
  const initialTracking = searchParams.get('tracking') || '';

  // Form states
  const [parcelUlpin, setParcelUlpin] = useState('KA-BLG-001-000101');
  const [serviceType, setServiceType] = useState('Ownership Verification');
  const [citizenName, setCitizenName] = useState(user?.name || 'Priyanka Patil');
  const [citizenEmail, setCitizenEmail] = useState(user?.email || 'citizen@landstack.demo');
  const [citizenPhone, setCitizenPhone] = useState('+91 98450 00303');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<any>(null);

  // Tracking states
  const [trackingNumber, setTrackingNumber] = useState(initialTracking);
  const [trackedRequest, setTrackedRequest] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [allRequests, setAllRequests] = useState<any[]>([]);

  const loadRequests = async () => {
    try {
      const res = await fetchWithAuth('/api/service-requests');
      const json = await res.json();
      if (json.success) {
        setAllRequests(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (initialTracking) {
      handleTrack(initialTracking);
    }
  }, [initialTracking]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetchWithAuth('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcelUlpin,
          serviceType,
          citizenName: user?.name || citizenName,
          citizenEmail: user?.email || citizenEmail,
          citizenPhone,
          remarks,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSubmissionSuccess(json.data);
        setTrackedRequest(json.data);
        setTrackingNumber(json.data.requestNumber);
        loadRequests();
      } else {
        alert(json.message || 'Failed to submit request');
      }
    } catch {
      alert('Error submitting request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async (reqNum?: string) => {
    const num = reqNum || trackingNumber;
    if (!num.trim()) return;

    try {
      setTrackingLoading(true);
      const res = await fetchWithAuth('/api/service-requests');
      const json = await res.json();
      if (json.success) {
        const found = json.data.find(
          (r: any) => r.requestNumber.toLowerCase() === num.trim().toLowerCase()
        );
        if (found) {
          setTrackedRequest(found);
        } else {
          alert(`Application "${num}" not found.`);
        }
      }
    } catch {
      alert('Error tracking request');
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleAdvanceStatus = async (newStatus: string) => {
    if (!trackedRequest) return;
    try {
      const res = await fetchWithAuth(`/api/service-requests/${trackedRequest.requestNumber}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          remarks: `Status moved to ${newStatus} during officer review.`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTrackedRequest(json.data);
        loadRequests();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStepIndex = (status: string) => {
    const idx = WORKFLOW_STEPS.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Digital Land Governance Services
          </h1>
          <p className="text-xs text-slate-500">
            Submit formal citizen applications, request title verifications, and track digital workflow lifecycles.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Submit Service Request Form (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              <span>Submit Land Service Application</span>
            </h2>

            <form onSubmit={handleSubmitRequest} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Service Category:</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100"
                >
                  {SERVICE_TYPES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Parcel ULPIN:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-BLG-001-000101"
                  value={parcelUlpin}
                  onChange={(e) => setParcelUlpin(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Applicant Full Name:</label>
                <input
                  type="text"
                  required
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Email:</label>
                  <input
                    type="email"
                    required
                    value={citizenEmail}
                    onChange={(e) => setCitizenEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Mobile Phone:</label>
                  <input
                    type="text"
                    required
                    value={citizenPhone}
                    onChange={(e) => setCitizenPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Application Remarks & Justification:</label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="State the purpose of verification or mutation..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                {submitting ? 'Generating Application ID...' : 'Submit Service Application'}
              </button>
            </form>

            {submissionSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-300 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Application Generated Successfully!
                </p>
                <p className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                  {submissionSuccess.requestNumber}
                </p>
                <p className="text-[11px]">Workflow tracking activated below.</p>
                <button
                  type="button"
                  onClick={() => downloadServiceReceiptPdf(submissionSuccess)}
                  className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Acknowledgment Receipt (PDF)</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Status Tracker & Workflow Stepper (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Tracking Search Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>Track Application Lifecycle</span>
              </h2>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Request ID (e.g. REQ-2026-000001)..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-mono"
                />
                <button
                  onClick={() => handleTrack()}
                  disabled={trackingLoading}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  {trackingLoading ? 'Checking...' : 'Track'}
                </button>
              </div>

              {/* Stepper Display */}
              {trackedRequest ? (
                <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-blue-600 text-sm">
                        {trackedRequest.requestNumber}
                      </span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {trackedRequest.serviceType}
                      </p>
                      <p className="text-[11px] text-slate-400">Parcel: {trackedRequest.parcelUlpin}</p>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      {trackedRequest.status}
                    </span>
                  </div>

                  {/* 6-Stage Stepper Component */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Workflow Pipeline Progress
                    </p>
                    <div className="grid grid-cols-6 gap-1 text-center">
                      {WORKFLOW_STEPS.map((step, idx) => {
                        const currentIdx = getStepIndex(trackedRequest.status);
                        const isDone = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;

                        return (
                          <div key={step} className="space-y-1.5">
                            <div
                              className={`h-2 rounded-full ${
                                isDone ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                              } ${isCurrent ? 'ring-2 ring-blue-400 animate-pulse' : ''}`}
                            />
                            <p
                              className={`text-[9px] font-bold uppercase truncate ${
                                isDone
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-slate-400 dark:text-slate-600'
                              }`}
                              title={step}
                            >
                              {step.replace('_', ' ')}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Details & Officer Assignment */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs space-y-1.5 border border-slate-200 dark:border-slate-800">
                    <p><strong>Assigned Officer:</strong> {trackedRequest.assignedOfficer || 'Tahasildar Revenue Cell'}</p>
                    <p><strong>Applicant Name:</strong> {trackedRequest.citizenName}</p>
                    <p><strong>Remarks / Status Note:</strong> {trackedRequest.remarks || 'Application under digital queue verification.'}</p>
                    <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => downloadServiceReceiptPdf(trackedRequest)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Acknowledgment Receipt (PDF)</span>
                      </button>
                      {(trackedRequest.status === 'VERIFIED' || trackedRequest.status === 'APPROVED' || trackedRequest.status === 'COMPLETED') && (
                        <button
                          type="button"
                          onClick={() => downloadApprovalCertificatePdf(trackedRequest)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Download Verification Certificate (PDF)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Officer / Admin Authorized Workflow Controls Only */}
                  {(user?.role === 'OFFICER' || user?.role === 'ADMIN') && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-amber-500 font-bold uppercase">
                          Authorized Officer Workflow Endorsement:
                        </p>
                        <Link href="/officer" className="text-[11px] text-blue-600 font-bold hover:underline">
                          Open Full Verification Queue &rarr;
                        </Link>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {WORKFLOW_STEPS.map((st) => (
                          <button
                            key={st}
                            onClick={() => handleAdvanceStatus(st)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                              trackedRequest.status === st
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  Select an application below or submit a new request above to inspect lifecycle.
                </div>
              )}
            </div>

            {/* Applications List */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                {user?.role === 'CITIZEN' ? 'My Submitted Applications' : 'Authorized Application Docket'}
              </h3>
              <div className="space-y-2">
                {allRequests.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">No applications found.</p>
                ) : (
                  allRequests.slice(0, 5).map((req) => (
                    <div
                      key={req.id}
                      onClick={() => {
                        setTrackedRequest(req);
                        setTrackingNumber(req.requestNumber);
                      }}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {req.requestNumber}
                        </span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{req.serviceType}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {req.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

