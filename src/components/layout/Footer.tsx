'use client';

import React from 'react';
import Link from 'next/link';
import {
  Map,
  ShieldCheck,
  FileText,
  AlertTriangle,
  BarChart3,
  UserCheck,
  Satellite,
  Settings,
  Lock,
  ExternalLink,
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Map className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">LANDSTACK</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              GIS-Based Integrated Land Governance Platform. Demonstrating parcel-centric unification across cadastral boundaries, ownership, registrations, and planning around unique ULPIN identifiers.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px]">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Bcrypt & JWT Secured RBAC</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Spatial & Records</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  GIS Map Cadastre
                </Link>
              </li>
              <li>
                <Link href="/citizen" className="hover:text-white transition-colors">
                  Citizen Self-Service Portal
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  Online Mutations & Sakala
                </Link>
              </li>
              <li>
                <Link href="/disputes" className="hover:text-white transition-colors">
                  Revenue Dispute Appeals
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Executive GIS Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Advanced Governance Modules */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Intelligence & Admin</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link href="/admin/fraud-alerts" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Potential Conflict Alerts</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px]">10</span>
                </Link>
              </li>
              <li>
                <Link href="/satellite-ai" className="hover:text-white transition-colors">
                  Satellite Change Detection AI
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  Administration Console
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors text-blue-400 font-bold">
                  Member Login Portal &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Academic Prototype Notice */}
          <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>ACADEMIC NOTICE</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              This system is an academic final-year MCA capstone project prototype. All cadastral parcels, ULPIN identifiers, and citizen data are synthetic demo records.
            </p>
            <p className="text-[10px] text-slate-500">
              Department of MCA &bull; Jain College &bull; 2026
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>&copy; 2026 LANDSTACK — Integrated GIS Land Governance Platform. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[10px]">
            <span>OpenStreetMap &copy; OSM Contributors</span>
            <span>&bull;</span>
            <span>Turf.js Geodesic Engine</span>
            <span>&bull;</span>
            <span>Prisma ORM</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
