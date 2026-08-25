import Link from 'next/link';
import { Camera } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#f8fafc] selection:bg-indigo-600 selection:text-white">
      {/* Ambient background glows */}
      <div className="lr-mesh-glow-1" aria-hidden="true" />
      <div className="lr-mesh-glow-2" aria-hidden="true" />

      {/* Header / Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Camera size={20} strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
            LensRecall
          </span>
        </Link>
      </div>

      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-[0_10px_35px_rgba(0,0,0,0.05)]">
          {children}
        </div>

        {/* Footer links */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Protected by LensRecall event-isolated security.
        </p>
      </div>
    </div>
  );
}
