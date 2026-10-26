'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Map,
  ShieldCheck,
  FileText,
  AlertTriangle,
  BarChart3,
  UserCheck,
  Settings,
  Search,
  Menu,
  X,
  ChevronDown,
  LogIn,
  LogOut,
  User as UserIcon,
  Building2,
  FileCheck,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Role-Segregated Navigation Links
  const getNavLinks = () => {
    if (!user) {
      return [
        { href: '/', label: 'GIS Map', icon: Map },
        { href: '/services', label: 'Services', icon: FileText },
      ];
    }

    if (user.role === 'CITIZEN') {
      return [
        { href: '/', label: 'GIS Map', icon: Map },
        { href: '/citizen', label: 'Citizen Portal', icon: UserCheck },
        { href: '/services', label: 'Apply for Services', icon: FileText },
        { href: '/disputes', label: 'My Disputes', icon: ShieldCheck },
      ];
    }

    if (user.role === 'OFFICER') {
      return [
        { href: '/', label: 'GIS Map', icon: Map },
        { href: '/officer', label: 'Officer Workspace', icon: Building2 },
        { href: '/admin/fraud-alerts', label: 'Potential Conflicts', icon: AlertTriangle, badge: '10' },
      ];
    }

    // ADMIN
    return [
      { href: '/', label: 'GIS Map', icon: Map },
      { href: '/admin', label: 'Admin Console', icon: Settings },
      { href: '/dashboard', label: 'Executive Analytics', icon: BarChart3 },
      { href: '/admin/fraud-alerts', label: 'Conflict Surveillance', icon: AlertTriangle, badge: '10' },
    ];
  };

  const navLinks = getNavLinks();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/parcels/${searchQuery.trim().toUpperCase()}`;
    }
  };

  const handleLogout = () => {
    logout();
    setRoleDropdownOpen(false);
    setMobileMenuOpen(false);
    router.push('/login');
  };

  const getUserPortalLink = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'OFFICER') return '/officer';
    return '/citizen';
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-lg border-b border-slate-800">
      {/* Official Government Prototype Top Banner */}
      <div className="bg-amber-500/90 text-slate-950 px-4 py-1 text-xs font-semibold text-center flex items-center justify-center gap-2 tracking-wide uppercase">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>ACADEMIC PROTOTYPE: DEMO DATA — NOT AN OFFICIAL GOVERNMENT LAND RECORD</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Map className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight text-white">LANDSTACK</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    ULPIN-GIS
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                  Integrated Land Governance Platform
                </p>
              </div>
            </Link>
          </div>

          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative max-w-xs w-full ml-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search ULPIN (e.g. KA-BLG-001-000101)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </form>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/30 text-amber-300 border border-amber-500/40">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Auth & Role Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-200 transition-colors"
                    title="User Session Profile"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-400'
                          : user.role === 'OFFICER'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <span className="hidden sm:inline font-bold">{user.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-slate-700 text-slate-300">
                      {user.role}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {roleDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50"
                      onMouseLeave={() => setRoleDropdownOpen(false)}
                    >
                      <div className="px-4 py-2.5 border-b border-slate-800">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Signed In Identity</p>
                        <p className="text-xs font-bold text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                              user.role === 'ADMIN'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : user.role === 'OFFICER'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {user.role}
                          </span>
                        </div>
                        {user.department && (
                          <p className="text-[10px] text-slate-400 mt-1 truncate">{user.department}</p>
                        )}
                      </div>

                      <div className="pt-2 px-2 space-y-1">
                        <Link
                          href={getUserPortalLink()}
                          onClick={() => setRoleDropdownOpen(false)}
                          className="w-full text-left px-3 py-1.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors font-semibold"
                        >
                          <UserIcon className="w-3.5 h-3.5" />
                          <span>My Workspace Portal</span>
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg flex items-center gap-2 font-bold transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Prominent Quick Logout Button */}
                <button
                  onClick={handleLogout}
                  title="Log out of current session"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-6 space-y-3">
          <form onSubmit={handleSearchSubmit} className="mb-2">
            <input
              type="text"
              placeholder="Search ULPIN (e.g. KA-BLG-001-000101)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400"
            />
          </form>

          {/* User Status in Mobile */}
          {user ? (
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">{user.name}</p>
                <p className="text-[10px] text-slate-400">{user.email} • {user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-2.5 py-1 rounded bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/30 flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Member Portal</span>
            </Link>
          )}

          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/30 text-amber-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}

