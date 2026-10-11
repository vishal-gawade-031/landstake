import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'LANDSTACK — GIS-Based Integrated Land Governance Platform',
  description: 'Parcel-centric GIS land governance platform integrating cadastral polygons, ULPIN, ownership, RoR, encumbrance, and automated spatial anomaly detection.',
  keywords: 'GIS, Land Governance, ULPIN, Cadastral Map, Bhoomi, Karnataka, Turf.js, Leaflet, Land Stack',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
