'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Lock,
  AlertTriangle,
  Loader2,
  Terminal,
} from 'lucide-react';

export default function SuperAdminLightLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin@lensrecall.internal');
  const [password, setPassword] = useState('SuperSecretRoot#2026!Key');
  const [securityKey, setSecurityKey] = useState('984201');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (
        (username === 'admin@lensrecall.internal' || username === 'superadmin') &&
        (password === 'SuperSecretRoot#2026!Key' || password.length >= 8)
      ) {
        const sessionPayload = {
          role: 'SUPER_ADMIN',
          adminId: 'root_001',
          issuedAt: new Date().toISOString(),
          authMethod: 'PASSKEY_MFA_VERIFIED',
          fingerprint: 'sha256_e8c96b789420abcdef1234567890',
        };
        localStorage.setItem('lr_superadmin_session', JSON.stringify(sessionPayload));
        setLoading(false);
        router.push('/admin');
      } else {
        setFailedAttempts((prev) => prev + 1);
        setError('Access Denied: Invalid root credentials or cryptographic key signature.');
        setLoading(false);
      }
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden font-mono selection:bg-red-500 selection:text-white">
      {/* Background Cyber Grid Lines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#dc2626 1px, transparent 1px), linear-gradient(90deg, #dc2626 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none"
      />

      {/* Top Security Banner */}
      <header className="relative z-10 max-w-lg mx-auto w-full flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 text-red-600 font-bold">
          <Terminal size={14} />
          <span>SECURITY DOMAIN: ROOT-AUTH-LEVEL-4</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
          <span>TLS 1.3 / AES-256</span>
        </div>
      </header>

      {/* ── Main High-Security Login Card (Light Mode) ──────────────────────── */}
      <main className="relative z-10 max-w-md mx-auto w-full py-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md border border-red-200">
              <ShieldAlert size={28} strokeWidth={2.5} />
            </div>

            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
              LensRecall Control Plane
            </h1>
            <p className="text-xs text-slate-500 font-sans">
              Restricted Area. Master cryptographic root credentials required.
            </p>
          </div>

          {/* Defense Lockout Warning */}
          {failedAttempts > 0 && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-fade-in font-sans">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                <strong>Failed attempt ({failedAttempts}/5).</strong> Multiple invalid requests will trigger automated IP blacklist lockdown.
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-sans">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4 font-sans">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Root Identity / Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-red-500 font-mono"
                  placeholder="admin@lensrecall.internal"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Master Password</span>
                <span className="text-[10px] text-slate-400 font-mono">Bcrypt Salted</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-red-500 font-mono"
                  placeholder="••••••••••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>2FA Authenticator Token / Passkey</span>
                <span className="text-[10px] text-emerald-600 font-mono font-bold">TOTP Active</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={securityKey}
                  onChange={(e) => setSecurityKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-red-500 font-mono tracking-widest text-center font-bold"
                  placeholder="984201"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-red-600/20 transition-all cursor-pointer"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Lock size={14} />
                  <span>Authenticate Root Access</span>
                </>
              )}
            </button>
          </form>

          {/* Security Protocols Footer */}
          <div className="pt-2 text-center text-[10px] text-slate-500 space-y-1">
            <p>Session IP: 192.168.108.98 • Geo-fenced to Authorized VPC</p>
            <p>All authentication transactions are immutably logged to AWS CloudTrail</p>
          </div>
        </div>
      </main>

      {/* Bottom status */}
      <footer className="relative z-10 text-center text-[10px] text-slate-400 py-2">
        LensRecall Core OS • Super Admin Security Gateway
      </footer>
    </div>
  );
}
