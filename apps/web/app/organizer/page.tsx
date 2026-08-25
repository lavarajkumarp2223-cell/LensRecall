'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Image as ImageIcon,
  Users,
  Plus,
  Sparkles,
  ChevronRight,
  HardDrive,
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

import { getPhotosForEvent } from '../../lib/photo-storage';

export default function OrganizerLightOverviewPage() {
  const [eventsList, setEventsList] = useState<EventItem[]>([]);

  useEffect(() => {
    async function loadAndSync() {
      try {
        const raw = localStorage.getItem('lr_organizer_events');
        if (raw) {
          const events: EventItem[] = JSON.parse(raw);
          const synced = await Promise.all(
            events.map(async (evt) => {
              const actualPhotos = await getPhotosForEvent(evt.id);
              return {
                ...evt,
                photoCount: actualPhotos.length,
              };
            })
          );
          setEventsList(synced);
        }
      } catch {
        // ignore
      }
    }
    loadAndSync();
  }, []);

  const totalPhotos = eventsList.reduce((acc, e) => acc + (e.photoCount || 0), 0);
  const totalSearches = eventsList.reduce((acc, e) => acc + (e.searchCount || 0), 0);

  const stats = [
    {
      label: 'Total Active Events',
      value: `${eventsList.filter((e) => e.status === 'ACTIVE').length}`,
      sub: `${eventsList.length} Total Hosted`,
      icon: Calendar,
      color: 'text-indigo-600',
    },
    {
      label: 'Photos Indexed',
      value: `${totalPhotos.toLocaleString()}`,
      sub: 'Cloudflare R2 / S3 Storage',
      icon: ImageIcon,
      color: 'text-purple-600',
    },
    {
      label: 'Guest Face Searches',
      value: `${totalSearches.toLocaleString()}`,
      sub: 'AWS Rekognition (ap-south-1)',
      icon: Users,
      color: 'text-emerald-600',
    },
    {
      label: 'Storage Consumed',
      value: totalPhotos > 0 ? `${(totalPhotos * 0.007).toFixed(1)} GB` : '0.0 GB',
      sub: 'of 250 GB Pro Quota',
      icon: HardDrive,
      color: 'text-cyan-600',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* ── Studio Header Banner ──────────────────────────────────────────── */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-indigo-200">
            <Sparkles size={13} className="text-amber-300" />
            <span>Studio Production Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome to LensRecall Studio
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-xl">
            Live AI Face Recognition photo distribution platform powered by Amazon Rekognition.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Link
            href="/organizer/events/new"
            className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-400/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Create Event
          </Link>
          <Link
            href="/organizer/photos"
            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all cursor-pointer"
          >
            Upload Photos
          </Link>
        </div>
      </div>

      {/* ── KPI Stats Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className={`w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center ${stat.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{stat.value}</div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>{stat.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Active Events Grid ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Active Event Shoots</h2>
            <p className="text-xs text-slate-500">
              Live photo upload pipelines, QR scan counters, and guest face searches
            </p>
          </div>
          <Link
            href="/organizer/events"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View all ({eventsList.length})</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {eventsList.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
              <Calendar size={28} />
            </div>
            <h3 className="font-bold text-lg text-slate-900">No event shoots yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first event collection to generate a customized standee QR code and begin AI photo indexing.
            </p>
            <Link
              href="/organizer/events/new"
              className="inline-flex items-center gap-2 lr-btn-primary-gradient px-6 py-3 rounded-2xl text-xs font-bold shadow-md"
            >
              <Plus size={15} />
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {eventsList.map((evt) => (
              <Link
                key={evt.id}
                href={`/organizer/events/${evt.id}`}
                className="group p-4 rounded-3xl bg-white border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100">
                    <img
                      src={evt.coverUrl}
                      alt={evt.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        {evt.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {evt.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{evt.date} • {evt.location}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">{evt.photoCount.toLocaleString()} photos</span>
                  <span className="text-indigo-600 font-bold">{evt.searchCount} guest scans</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
