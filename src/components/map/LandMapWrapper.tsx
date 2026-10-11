'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const DynamicLandMap = dynamic(() => import('./LandMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-6rem)] bg-slate-900 flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wide">Initializing Leaflet GIS & OpenStreetMap...</p>
      </div>
    </div>
  ),
});

export default function LandMapWrapper(props: any) {
  return <DynamicLandMap {...props} />;
}
