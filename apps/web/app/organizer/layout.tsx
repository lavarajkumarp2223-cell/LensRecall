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
  Phone,
  HelpCircle,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Overview', href: '/organizer', icon: LayoutDashboard },
  { label: 'Events', href: '/organizer/events', icon: Calendar },
  { label: 'Photos & Uploads', href: '/organizer/photos', icon: ImageIcon },
  { label: 'QR Standees', href: '/organizer/qr', icon: QrCode },
  { label: 'Analytics & Latency', href: '/organizer/analytics', icon: BarChart3 },
  { label: 'Audit & Compliance', href: '/organizer/audit', icon: Shield },
  { label: 'Studio & Billing', href: '/organizer/settings', icon: Settings },
  { label: 'Contact Support', href: '/contact', icon: HelpCircle },
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
        const parsed = JSON.parse(raw);
        if (parsed.email === 'alex@google.com' || parsed.fullName === 'Alex Vance' || !parsed.fullName) {
          const defaultUser = { fullName: 'Lava Kumar', email: 'lookalivesolutions@gmail.com', role: 'ORGANIZER' };
          localStorage.setItem('lr_user', JSON.stringify(defaultUser));
          setUser(defaultUser);
        } else {
          setUser(parsed);
        }
      } catch {
        const defaultUser = { fullName: 'Lava Kumar', email: 'lookalivesolutions@gmail.com', role: 'ORGANIZER' };
        setUser(defaultUser);
      }
    } else {
      const defaultUser = { fullName: 'Lava Kumar', email: 'lookalivesolutions@gmail.com', role: 'ORGANIZER' };
      localStorage.setItem('lr_user', JSON.stringify(defaultUser));
      setUser(defaultUser);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('lr_access_token');
    localStorage.removeItem('lr_refresh_token');
    localStorage.removeItem('lr_user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      <div className="flex-1 flex">
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
                  L
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    Lava Kumar Studio
                  </div>
                  <div className="text-[10px] text-slate-500">
                    LookAliveSolutions
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

          {/* User profile & Contact Support */}
          <div className="p-3 border-t border-slate-200 space-y-2">
            <Link
              href="/contact"
              className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors block text-center"
            >
              <Phone size={13} />
              <span>Support: 7661907426</span>
            </Link>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  {user?.fullName ? user.fullName[0]?.toUpperCase() : 'L'}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {user?.fullName || 'Lava Kumar'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {user?.email || 'lookalivesolutions@gmail.com'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white transition-colors cursor-pointer"
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
                <Menu size={20} />
              </button>
              <span className="font-bold text-base text-slate-900">LensRecall</span>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">
                AI Face Recall &bull; Amazon Rekognition
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/contact"
                className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <Phone size={13} />
                <span className="hidden sm:inline">Help:</span> 7661907426
              </Link>

              <Link
                href="/organizer/events/new"
                className="lr-btn-primary-gradient px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={15} />
                <span>New Event</span>
              </Link>
            </div>
          </header>

          {/* Mobile Drawer */}
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

          {/* ── Universal Footer with LookAliveSolutions Credit ────────────── */}
          <footer className="border-t border-slate-200 py-6 px-4 sm:px-8 bg-white text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <span className="font-bold text-slate-800">LensRecall Platform</span> &bull; Credit to lookalivesolutions2026
            </div>
            <div className="flex items-center gap-5">
              <a href="tel:+917661907426" className="hover:text-indigo-600 font-medium">
                📞 7661907426
              </a>
              <a href="mailto:lookalivesolutions@gmail.com" className="hover:text-indigo-600 font-medium">
                ✉️ lookalivesolutions@gmail.com
              </a>
              <Link href="/contact" className="text-indigo-600 font-bold hover:underline">
                Contact Support
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
