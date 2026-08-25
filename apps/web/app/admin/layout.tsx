'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  LayoutDashboard,
  Building2,
  Database,
  Activity,
  LogOut,
  ArrowLeft,
  UserCheck,
} from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin', label: 'Platform Overview', icon: LayoutDashboard },
  { href: '/admin#studios', label: 'Studios & Organizations', icon: Building2 },
  { href: '/admin#infrastructure', label: 'Cloud Infrastructure', icon: Database },
  { href: '/admin#queues', label: 'BullMQ Worker Queues', icon: Activity },
];

export default function SuperAdminLightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState('lavakumar');

  useEffect(() => {
    if (pathname === '/admin/login') {
      setIsAuthenticated(true);
      return;
    }

    const sessionRaw = localStorage.getItem('lr_superadmin_session');
    if (!sessionRaw) {
      router.push('/admin/login');
    } else {
      try {
        const parsed = JSON.parse(sessionRaw);
        if (parsed.role === 'SUPER_ADMIN') {
          setIsAuthenticated(true);
          if (parsed.username) setAdminUsername(parsed.username);
        } else {
          router.push('/admin/login');
        }
      } catch {
        router.push('/admin/login');
      }
    }
  }, [pathname, router]);

  const handleAdminSignOut = () => {
    localStorage.removeItem('lr_superadmin_session');
    router.push('/admin/login');
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-xs font-mono text-slate-500">
        Verifying cryptographic root privileges for {adminUsername}...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col lg:flex-row">
      {/* ── Super Admin Light Sidebar ─────────────────────────────────────── */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-5 flex flex-col justify-between shrink-0 shadow-sm">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="space-y-2">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <ShieldAlert size={18} strokeWidth={2.5} />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-slate-900 block">
                  LensRecall
                </span>
                <span className="text-[10px] font-mono text-red-600 font-bold uppercase tracking-wider block">
                  SUPER ADMIN PORTAL
                </span>
              </div>
            </Link>

            {/* Logged in identity card */}
            <div className="p-2.5 rounded-xl bg-red-50/80 border border-red-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-red-600 tracking-wider">Root Superadmin</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping inline-block" />
              </div>
              <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                <UserCheck size={13} className="text-red-600" />
                <span>{adminUsername}</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  pathname === href
                    ? 'bg-red-50 text-red-700 font-bold border border-red-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} className={pathname === href ? 'text-red-600' : 'text-slate-400'} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-slate-200 space-y-2">
          <Link
            href="/organizer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Switch to Studio Hub</span>
          </Link>

          <button
            type="button"
            onClick={handleAdminSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Revoke Admin Session</span>
          </button>
        </div>
      </aside>

      {/* ── Main Super Admin Content ───────────────────────────────────────── */}
      <main className="flex-1 flex flex-col justify-between overflow-y-auto">
        <div className="p-6 sm:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>

        <footer className="border-t border-slate-200 py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          <div>
            LensRecall Root Control Plane &bull; <strong className="text-slate-700 font-semibold">Credit to lookalivesolutions2026</strong>
          </div>
          <div className="flex items-center gap-4">
            <a href="tel:+917661907426" className="hover:text-red-600 font-medium">📞 7661907426</a>
            <a href="mailto:lookalivesolutions@gmail.com" className="hover:text-red-600 font-medium">✉️ lookalivesolutions@gmail.com</a>
            <Link href="/contact" className="text-red-600 font-bold hover:underline">Contact Support</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
