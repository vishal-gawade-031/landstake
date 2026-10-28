'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Shield,
  ShieldCheck,
  UserCheck,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  KeyRound,
  Eye,
  EyeOff,
  MapPin,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[70vh]">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '';
  const { user, loginWithCredentials, loginAsRole, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'OFFICER' | 'CITIZEN'>('ADMIN');
  const [email, setEmail] = useState('admin@landstack.demo');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Citizen Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const memberProfiles = [
    {
      role: 'ADMIN' as const,
      title: 'Administrator',
      name: 'Dr. Ramesh Narayan (IAS)',
      designation: 'District Collector & Land Settlement Officer',
      email: 'admin@landstack.demo',
      defaultPass: 'admin123',
      icon: Shield,
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      activeBorder: 'border-purple-500 bg-purple-950/20',
      description: 'Full supervisory authority over cadastral datasets, fraud detection rules, GIS layers, and audit logs.',
      destination: '/admin',
      privileges: ['System Configuration', 'User & Role Governance', 'Boundary Conflict Audits', 'Audit Log Forensics'],
    },
    {
      role: 'OFFICER' as const,
      title: 'Revenue Officer',
      name: 'Shri Anand Kulkarni (KAS)',
      designation: 'Tahasildar & Executive Magistrate',
      email: 'officer@landstack.demo',
      defaultPass: 'officer123',
      icon: Building2,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      activeBorder: 'border-amber-500 bg-amber-950/20',
      description: 'Adjudication of mutation requests, revenue dispute hearings, field notice generation, and conversion orders.',
      destination: '/officer',
      privileges: ['Verification Queue', 'Document Scrutiny', 'Dispute Hearings', 'Departmental Inspection'],
    },
    {
      role: 'CITIZEN' as const,
      title: 'Citizen Landholder',
      name: 'Priyanka Patil',
      designation: 'Registered Khatadar / Landowner',
      email: 'citizen@landstack.demo',
      defaultPass: 'citizen123',
      icon: UserCheck,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      activeBorder: 'border-emerald-500 bg-emerald-950/20',
      description: 'Access authenticated land records, apply for mutation / surveys, track requests, and download land cards.',
      destination: '/citizen',
      privileges: ['Public Parcel Search', 'Online Service Filing', 'Dispute Submission', 'Digital Land Card'],
    },
  ];

  const handleSelectRole = (role: 'ADMIN' | 'OFFICER' | 'CITIZEN') => {
    setSelectedRole(role);
    const profile = memberProfiles.find((p) => p.role === role);
    if (profile) {
      setEmail(profile.email);
      setPassword(profile.defaultPass);
      setError(null);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginWithCredentials(email, password);
      if (res.success && res.user) {
        setSuccessMessage(`Signed in successfully as ${res.user.name} (${res.user.role})`);
        const target = redirectUrl || (res.user.role === 'ADMIN' ? '/admin' : res.user.role === 'OFFICER' ? '/officer' : '/citizen');
        setTimeout(() => {
          router.push(target);
        }, 500);
      } else {
        setError(res.error || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          phone: regPhone,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSuccessMessage('Citizen account registered successfully! Signing you in...');
        const loginRes = await loginWithCredentials(regEmail, regPassword);
        if (loginRes.success) {
          setTimeout(() => {
            router.push('/citizen');
          }, 500);
        } else {
          setActiveTab('LOGIN');
          setEmail(regEmail);
        }
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error during registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoleLogin = async (role: 'ADMIN' | 'OFFICER' | 'CITIZEN') => {
    setError(null);
    setLoading(true);
    try {
      const res = await loginAsRole(role);
      if (res.success && res.user) {
        setSuccessMessage(`Authenticated as ${res.user.name}`);
        const target = redirectUrl || (role === 'ADMIN' ? '/admin' : role === 'OFFICER' ? '/officer' : '/citizen');
        setTimeout(() => {
          router.push(target);
        }, 500);
      } else {
        setError(res.error || 'Failed to authenticate preset persona');
      }
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            LandStack Unified Authentication & RBAC Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Member Authentication & Sign In
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Secure, parcel-centric role-based access for Government Administrators, Revenue Officers, and Citizens.
          </p>
        </div>

        {/* Currently Active Banner if already logged in */}
        {user && (
          <div className="bg-slate-900 border border-blue-600/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500 flex items-center justify-center text-blue-400 font-bold">
                {user.role[0]}
              </div>
              <div>
                <p className="text-xs text-slate-400">Currently Authenticated As</p>
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{user.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    {user.role}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href={user.role === 'ADMIN' ? '/admin' : user.role === 'OFFICER' ? '/services' : '/citizen'}
                className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors text-center"
              >
                Go to Workspace &rarr;
              </Link>
              <button
                onClick={() => {
                  logout();
                  setSuccessMessage('Logged out successfully.');
                }}
                className="flex-1 sm:flex-initial px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition-colors text-center"
              >
                Log Out
              </button>
            </div>
          </div>
        )}

        {/* Member Profiles Selector Cards */}
        <div className="space-y-3">
          <p className="text-xs uppercase font-bold tracking-wider text-slate-400">
            Select Member Role (1-Click Switch or Manual Sign In):
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {memberProfiles.map((profile) => {
              const Icon = profile.icon;
              const isSelected = selectedRole === profile.role;
              return (
                <div
                  key={profile.role}
                  onClick={() => handleSelectRole(profile.role)}
                  className={`cursor-pointer rounded-2xl p-5 border transition-all relative flex flex-col justify-between ${isSelected
                      ? `${profile.activeBorder} shadow-lg ring-2 ring-blue-500/50`
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-xl bg-slate-800 text-white">
                        <Icon className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${profile.badgeColor}`}>
                        {profile.role}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-base">{profile.title}</h3>
                      <p className="text-xs font-medium text-slate-300 mt-0.5">{profile.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{profile.designation}</p>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {profile.description}
                    </p>

                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Key Privileges:</p>
                      <ul className="text-[11px] text-slate-300 space-y-0.5">
                        {profile.privileges.map((p, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickRoleLogin(profile.role);
                      }}
                      className="w-full py-2 bg-slate-800 hover:bg-blue-600 text-white hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-700 hover:border-blue-500"
                    >
                      <span>1-Click Sign In as {profile.title.split(' ')[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Credentials / Registration Box */}
        <div className="max-w-lg mx-auto w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Tab Switcher */}
          <div className="flex border-b border-slate-800 pb-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab('LOGIN');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${activeTab === 'LOGIN'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
            >
              Member Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('REGISTER');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${activeTab === 'REGISTER'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
            >
              Public Citizen Registration
            </button>
          </div>

          <div className="flex items-center justify-between pb-2">
            <div>
              <h2 className="text-lg font-bold text-white">
                {activeTab === 'LOGIN' ? 'Member Portal Sign In' : 'Create Citizen Account'}
              </h2>
              <p className="text-xs text-slate-400">
                {activeTab === 'LOGIN'
                  ? 'Authenticating with Bcrypt & Signed JWT Session'
                  : 'Default role: CITIZEN with access to Public Land Registry'}
              </p>
            </div>
            {activeTab === 'LOGIN' ? (
              <KeyRound className="w-6 h-6 text-blue-500" />
            ) : (
              <UserCheck className="w-6 h-6 text-emerald-500" />
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {activeTab === 'LOGIN' ? (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Member Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@landstack.demo"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Access Password</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Default: {password}</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In as {selectedRole}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Legal Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Citizen Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ramesh.kumar@example.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Set Secure Password</span>
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contact Mobile Number (Optional)</span>
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Registering Account...</span>
                  </>
                ) : (
                  <>
                    <span>Register as Citizen</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Academic Prototype Notice */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center space-y-1">
            <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">
              Academic Examiner Demonstration Note
            </p>
            <p className="text-[10px] text-slate-400">
              Passcodes: <code className="text-white font-mono">admin123</code> (Admin), <code className="text-white font-mono">officer123</code> (Officer), <code className="text-white font-mono">citizen123</code> (Citizen).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
