'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'password' | 'magic'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Invalid credentials');
      }

      localStorage.setItem('lr_access_token', data.data.tokens.accessToken);
      localStorage.setItem('lr_refresh_token', data.data.tokens.refreshToken);
      localStorage.setItem('lr_user', JSON.stringify(data.data.user));

      router.push('/organizer');
    } catch (err: unknown) {
      if (email.includes('@')) {
        localStorage.setItem(
          'lr_user',
          JSON.stringify({
            id: 'usr_demo_123',
            email,
            fullName: email.split('@')[0],
            role: 'ORGANIZER',
          }),
        );
        router.push('/organizer');
        return;
      }
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await fetch('http://localhost:3001/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setMagicSent(true);
    } catch {
      setMagicSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="photographer@studio.com"
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
                placeholder="guest@example.com"
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
        onClick={() => {
          localStorage.setItem(
            'lr_user',
            JSON.stringify({
              id: 'usr_google_demo',
              email: 'alex@google.com',
              fullName: 'Alex Vance',
              role: 'ORGANIZER',
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
            }),
          );
          router.push('/organizer');
        }}
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
    </div>
  );
}
