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
  Settings,
  Lock,
  ExternalLink,
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs">
 

  
      

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>&copy; 2026 Integrated GIS Land Governance Platform. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[10px]">
            <span>OpenStreetMap &copy; OSM Contributors</span>
            <span>&bull;</span>
            <span>Turf.js Geodesic Engine</span>
            <span>&bull;</span>
            <span>Prisma ORM</span>
          </div>
        </div>
      
    </footer>

  )}