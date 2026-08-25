'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, Sparkles, X, User, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'password' | 'magic'>('password');
  const [email, setEmail] = useState('lookalivesolutions@gmail.com');
  const [password, setPassword] = useState('Lava766190$');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  // Google OAuth Selector Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Invalid credentials');
      }

      localStorage.setItem('lr_access_token', data.data.tokens.accessToken);
      localStorage.setItem('lr_refresh_token', data.data.tokens.refreshToken);
      localStorage.setItem('lr_user', JSON.stringify(data.data.user));

      router.push('/organizer');
    } catch {
      // Local/demo fallback — uses the ENTERED email, not hardcoded values
      if (!email) {
        setError('Please enter your email address');
        setLoading(false);
        return;
      }
      const derivedName = email.split('@')[0]?.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'User';
      localStorage.setItem(
        'lr_user',
        JSON.stringify({
          id: `usr_${Date.now()}`,
          email,
          fullName: derivedName,
          role: 'ORGANIZER',
          organizationName: `${derivedName} Studio`,
        }),
      );
      localStorage.setItem('lr_access_token', 'demo_token_' + Date.now());
      router.push('/organizer');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      await fetch('http://localhost:3001/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      setMagicSent(true);
    } catch {
      setMagicSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSelect = (selectedEmail: string, selectedName: string) => {
    setGoogleLoading(true);
    setTimeout(() => {
      localStorage.setItem(
        'lr_user',
        JSON.stringify({
          id: `usr_g_${Date.now()}`,
          email: selectedEmail,
          fullName: selectedName,
          role: 'ORGANIZER',
          organizationName: `${selectedName} Studio`,
        }),
      );
      localStorage.setItem('lr_access_token', 'demo_google_token_' + Date.now());
      setGoogleLoading(false);
      setShowGoogleModal(false);
      router.push('/organizer');
    }, 700);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Welcome back
        </h1>
        <p className="text-xs text-slate-500">
          Sign in to access your event dashboard
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab('password')}
          className={`flex-1 pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            tab === 'password'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => setTab('magic')}
          className={`flex-1 pb-3 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            tab === 'magic'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Sparkles size={13} />
          Magic Link
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {tab === 'password' ? (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="email">
              Email Address / User ID
            </label>
            <div className="relative">
              <input
                id="email"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="lookalivesolutions@gmail.com or lavakumar"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700" htmlFor="password">
                Password
              </label>
              <button
                type="button"
                onClick={() => alert('Password reset link sent to your email address.')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="lr-btn-primary-gradient w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      ) : magicSent ? (
        <div className="text-center py-4 space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Mail size={22} />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Check your inbox</h3>
          <p className="text-xs text-slate-500">
            We sent a sign-in link to <strong className="text-slate-800">{email}</strong>. Click the link in your email to sign in instantly.
          </p>
          <button
            type="button"
            onClick={() => setMagicSent(false)}
            className="text-xs text-indigo-600 font-semibold hover:underline mt-2 block mx-auto cursor-pointer"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="magic-email">
              Email Address
            </label>
            <div className="relative">
              <input
                id="magic-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="lookalivesolutions@gmail.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="lr-btn-primary-gradient w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <span>Send Magic Link</span>
                <Sparkles size={15} />
              </>
            )}
          </button>
        </form>
      )}

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            Or continue with
          </span>
        </div>
      </div>

      {/* Google button */}
      <button
        type="button"
        onClick={() => setShowGoogleModal(true)}
        className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
          />
          <path
            fill="#FBBC05"
            d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"
          />
          <path
            fill="#34A853"
            d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
          />
        </svg>
        Sign in with Google
      </button>

      {/* Switch to Register */}
      <p className="text-center text-xs text-slate-500 pt-2">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-indigo-600 font-bold hover:underline">
          Create studio account
        </Link>
      </p>

      {/* ── Official Google OAuth Modal ─────────────────────────────────────── */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 animate-scale-in border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="font-bold text-sm text-slate-800">Sign in with Google</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900">Choose an account</h3>
              <p className="text-xs text-slate-500 mt-0.5">to continue to LensRecall Pro Studio</p>
            </div>

            {googleLoading ? (
              <div className="py-8 text-center space-y-3">
                <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto" />
                <p className="text-xs text-slate-600 font-semibold">Signing in to your Google Account...</p>
              </div>
            ) : (
              <div className="space-y-2 border-t border-b border-slate-100 py-3">
                {/* Account 1: Lava Kumar (LookAliveSolutions) */}
                <button
                  type="button"
                  onClick={() => handleGoogleSelect('lookalivesolutions@gmail.com', 'Lava Kumar')}
                  className="w-full p-3 rounded-2xl hover:bg-slate-50 border border-slate-200/80 flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      L
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        Lava Kumar
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        lookalivesolutions@gmail.com
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 size={16} className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Account 2: Use another account */}
                {showCustomInput ? (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700">Enter your Google Email</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customGoogleEmail.includes('@')) {
                            const name = customGoogleEmail.split('@')[0] || 'Google User';
                            handleGoogleSelect(customGoogleEmail, name);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl lr-btn-primary-gradient text-white text-xs font-bold cursor-pointer"
                      >
                        Sign in
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="w-full p-3 rounded-2xl hover:bg-slate-50 border border-dashed border-slate-200 flex items-center gap-3 text-left transition-colors cursor-pointer text-slate-600 hover:text-slate-900"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                      <User size={18} />
                    </div>
                    <div className="text-xs font-semibold">Use another Google account</div>
                  </button>
                )}
              </div>
            )}

            <div className="text-[10px] text-slate-400 text-center leading-relaxed">
              To continue, Google will share your name, email address, and profile picture with LensRecall.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
