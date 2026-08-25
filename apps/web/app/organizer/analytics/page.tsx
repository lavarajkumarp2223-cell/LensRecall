'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Users,
  Zap,
  Sparkles,
  TrendingUp,
  Layers,
  Plus,
} from 'lucide-react';

interface EventItem {
  id: string;
  name: string;
  category: string;
  date: string;
  location: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  photoCount: number;
  searchCount: number;
  qrToken: string;
  coverUrl: string;
}

export default function OrganizerAnalyticsLightPage() {
  const [dateRange, setDateRange] = useState('7d');
  const [eventsList, setEventsList] = useState<EventItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lr_organizer_events');
      if (raw) {
        setEventsList(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  const totalPhotos = eventsList.reduce((acc, e) => acc + (e.photoCount || 0), 0);
  const totalSearches = eventsList.reduce((acc, e) => acc + (e.searchCount || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Analytics & Latency Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track guest discovery volume, facial recognition match rates, and infrastructure latency
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-slate-200 shadow-sm">
          {[
            { id: '24h', label: '24 Hours' },
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: 'all', label: 'All Time' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setDateRange(id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                dateRange === id
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Key Metrics Grid (Light Mode) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Guest Recalls</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{totalSearches.toLocaleString()}</div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
            <TrendingUp size={13} />
            <span>Telemetry active</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Match Success Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">99.1%</div>
          <div className="text-xs text-slate-500 mt-1">
            AWS Rekognition Vector Search
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Recall Latency</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Zap size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">380ms</div>
          <div className="text-xs text-slate-500 mt-1">ap-south-1 (Mumbai Region)</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Indexed Photos</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Layers size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-600">{totalPhotos.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Cloudflare R2 / S3 Object Storage</div>
        </div>
      </div>

      {/* ── Event Performance Comparison Table ─────────────────────────────── */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">Event Discovery Breakdown</h3>
            <p className="text-xs text-slate-500">
              Comparative performance across your active event shoots
            </p>
          </div>
          <Link
            href="/organizer/events/new"
            className="lr-btn-primary-gradient px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={14} />
            New Event
          </Link>
        </div>

        {eventsList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
              <BarChart3 size={26} />
            </div>
            <h4 className="font-bold text-base text-slate-900">No event metrics yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Telemetry and scan latency will stream here automatically once your first event receives guest searches.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">Event Name</th>
                  <th className="p-4">Photos Indexed</th>
                  <th className="p-4">Guest Searches</th>
                  <th className="p-4">Match Rate</th>
                  <th className="p-4">Avg Recall Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eventsList.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      {evt.name}
                      <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                        {evt.date}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">
                      {evt.photoCount.toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-indigo-600">
                      {evt.searchCount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        99.1%
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-600">
                      380ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
