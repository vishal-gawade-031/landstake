import Link from 'next/link';
import { MapPinOff, Map as MapIcon, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] p-4 text-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <MapPinOff className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">404 — Not Found</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          The requested land parcel record, cadastral polygon, or administrative page could not be located in the
          LANDSTACK digital index.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Link
            href="/"
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow"
          >
            <MapIcon className="w-4 h-4" />
            <span>Open GIS Map</span>
          </Link>
          <Link
            href="/citizen"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-300"
          >
            <Home className="w-4 h-4" />
            <span>Citizen Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
