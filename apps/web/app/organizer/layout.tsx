'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Camera,
  LayoutDashboard,
  Calendar,
  Image as ImageIcon,
  QrCode,
  BarChart3,
  Settings,
  Shield,
  Plus,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';


const NAV_ITEMS = [
  { label: 'Overview', href: '/organizer', icon: LayoutDashboard },
  { label: 'Events', href: '/organizer/events', icon: Calendar },
  { label: 'Photos & Uploads', href: '/organizer/photos', icon: ImageIcon },
  { label: 'QR Standees', href: '/organizer/qr', icon: QrCode },
  { label: 'Analytics & Latency', href: '/organizer/analytics', icon: BarChart3 },
  { label: 'Audit & Compliance', href: '/organizer/audit', icon: Shield },
  { label: 'Studio & Billing', href: '/organizer/settings', icon: Settings },
];

export default function OrganizerLightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ fullName: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('lr_user');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        setUser({ fullName: 'Sarah Jenkins', email: 'sarah@apexevents.com', role: 'ORGANIZER' });
      }
    } else {
      setUser({ fullName: 'Sarah Jenkins', email: 'sarah@apexevents.com', role: 'ORGANIZER' });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('lr_access_token');
    localStorage.removeItem('lr_refresh_token');
    localStorage.removeItem('lr_user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex">
      {/* ── Desktop Clean Light Sidebar ───────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-200 fixed inset-y-0 z-30 justify-between">
        <div className="space-y-4">
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Camera size={16} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900">
                LensRecall
              </span>
            </Link>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] uppercase font-bold">
              Pro Studio
            </span>
          </div>

          {/* Studio Selector */}
          <div className="p-3 mx-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                A
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  Apex Events & Media
                </div>
                <div className="text-[10px] text-slate-500">
                  3 active events
                </div>
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400 shrink-0" />
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href || (href !== '/organizer' && pathname.startsWith(href));
              return (
                <Link
                  key={label}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile */}
        <div className="p-3 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                {user?.fullName ? user.fullName[0]?.toUpperCase() : 'S'}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {user?.fullName || 'Sarah Jenkins'}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {user?.email || 'sarah@apexevents.com'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-8">
          {/* Mobile hamburger */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="font-bold text-lg text-slate-900">LensRecall</span>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-sm font-semibold text-slate-600">
              {pathname === '/organizer'
                ? 'Studio Overview'
                : pathname.includes('/events')
                ? 'Events Management'
                : pathname.includes('/photos')
                ? 'Photos & Direct Upload Pipeline'
                : pathname.includes('/qr')
                ? 'QR Standee Designer'
                : pathname.includes('/analytics')
                ? 'Analytics & Discovery Latency'
                : pathname.includes('/audit')
                ? 'Audit Logs & Compliance'
                : pathname.includes('/settings')
                ? 'Studio Settings & Team'
                : 'Studio Hub'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/organizer/events/new"
              className="lr-btn-primary-gradient px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">New Event</span>
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm">
            <div className="fixed inset-y-0 left-0 w-64 bg-white p-4 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-bold text-xl text-slate-900">Menu</span>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="p-1 rounded-lg text-slate-500"
                  >
                    <X size={20} />
                  </button>
                </div>
                <nav className="space-y-1">
                  {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                        pathname === href ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{label}</span>
                    </Link>
                  ))}
                </nav>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
