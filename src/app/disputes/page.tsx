'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Scale,
  PlusCircle,
  Search,
  Filter,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const DISPUTE_TYPES = [
  'Boundary Dispute',
  'Ownership Dispute',
  'Registration Dispute',
  'Land Use Dispute',
  'Tax Dispute',
];

export default function DisputesPage() {
  const { user, fetchWithAuth } = useAuth();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Register Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newParcelUlpin, setNewParcelUlpin] = useState('KA-BLG-001-000105');
  const [newType, setNewType] = useState('Boundary Dispute');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/disputes');
      const json = await res.json();
      if (json.success) {
        setDisputes(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [fetchWithAuth]);

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetchWithAuth('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcelUlpin: newParcelUlpin,
          disputeType: newType,
          description: newDescription,
          citizenName: user?.name || 'Citizen Applicant',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        setNewDescription('');
        fetchDisputes();
      } else {
        alert(json.message || 'Error creating dispute');
      }
    } catch {
      alert('Failed to register dispute');
    } finally {
      setSubmitting(false);
    }
  };


  const filtered = disputes.filter((d) => {
    if (typeFilter !== 'ALL' && d.disputeType !== typeFilter) return false;
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.disputeNumber?.toLowerCase().includes(q) ||
        d.parcelUlpin?.toLowerCase().includes(q) ||
        d.citizenName?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Scale className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Revenue Dispute Management
              </h1>
              <p className="text-xs text-slate-500">
                Statutory revenue court registry for boundary, title succession, and cadastral demarcation appeals.
              </p>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Lodge New Dispute</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search dispute #, ULPIN, or petitioner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Dispute Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5"
            >
              <option value="ALL">All Categories</option>
              {DISPUTE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="UNDER_INVESTIGATION">Under Investigation</option>
              <option value="HEARING_SCHEDULED">Hearing Scheduled</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {/* Disputes Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading dispute docket...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">No disputes found matching criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-4">Dispute ID</th>
                    <th className="p-4">ULPIN / Survey</th>
                    <th className="p-4">Petitioner</th>
                    <th className="p-4">Dispute Category</th>
                    <th className="p-4">Summary Description</th>
                    <th className="p-4">Assigned Bench</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                        {d.disputeNumber}
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/parcels/${d.parcelUlpin}`}
                          className="font-mono font-semibold text-slate-800 dark:text-slate-200 hover:underline"
                        >
                          {d.parcelUlpin}
                        </Link>
                        <p className="text-[11px] text-slate-400">Survey {d.surveyNumber}</p>
                      </td>
                      <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{d.citizenName}</td>
                      <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{d.disputeType}</td>
                      <td className="p-4 max-w-xs text-slate-600 dark:text-slate-300 truncate" title={d.description}>
                        {d.description}
                      </td>
                      <td className="p-4 text-slate-500">{d.assignedOfficer || 'Assistant Commissioner'}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.status === 'UNDER_INVESTIGATION'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/parcels/${d.parcelUlpin}`}
                          className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline"
                        >
                          <span>Inspect</span>
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
      </div>

      {/* Lodge Dispute Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateDispute}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Lodge Revenue Court Dispute</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Target Parcel ULPIN:</label>
              <input
                type="text"
                required
                value={newParcelUlpin}
                onChange={(e) => setNewParcelUlpin(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Dispute Classification:</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
              >
                {DISPUTE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Grievance / Appeal Summary:</label>
              <textarea
                rows={4}
                required
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Detail the boundary encroachment or succession claim..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border text-slate-600 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow"
              >
                {submitting ? 'Registering...' : 'Lodge Appeal'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
