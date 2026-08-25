'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Search,
  Plus,
  QrCode,
  Upload,
  MapPin,
  Sparkles,
  ArrowRight,
  Image as ImageIcon,
  Clock,
  Trash2,
  ExternalLink,
  Eye,
} from 'lucide-react';

import { deletePhotosForEvent, getPhotosForEvent } from '../../../lib/photo-storage';

export interface EventItem {
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

export default function EventsListingPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ALL');
  const [eventsList, setEventsList] = useState<EventItem[]>([]);

  useEffect(() => {
    async function loadAndSyncEvents() {
      try {
        const raw = localStorage.getItem('lr_organizer_events');
        if (raw) {
          const events: EventItem[] = JSON.parse(raw);
          // Sync photoCount accurately with actual stored photos in IndexedDB for each event
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
          localStorage.setItem('lr_organizer_events', JSON.stringify(synced));
        }
      } catch {
        // ignore
      }
    }
    loadAndSyncEvents();
  }, []);

  const handleDeleteEvent = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete event "${name}"?`)) {
      const updated = eventsList.filter((e) => e.id !== id);
      setEventsList(updated);
      try {
        localStorage.setItem('lr_organizer_events', JSON.stringify(updated));
        deletePhotosForEvent(id);
      } catch {}
    }
  };

  const filteredEvents = eventsList.filter((evt) => {
    const matchesSearch =
      evt.name.toLowerCase().includes(search.toLowerCase()) ||
      evt.location.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || evt.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Event Collections
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your photo galleries, standee QR codes, and AI recognition collections
          </p>
        </div>

        <Link
          href="/organizer/events/new"
          className="lr-btn-primary-gradient px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Plus size={16} />
          Create Event
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by event name or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
          />
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'ACTIVE', 'DRAFT', 'ARCHIVED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Events' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
            <Calendar size={28} />
          </div>
          <h3 className="font-bold text-lg text-slate-900">No events found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {eventsList.length === 0
              ? 'Get started by creating your first event collection to upload photos, invite photographers, and generate custom standee QR codes.'
              : 'Try adjusting your search criteria or status filter.'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group flex flex-col justify-between"
            >
              {/* Cover Banner */}
              <div className="relative h-48 overflow-hidden bg-slate-900">
                <img
                  src={event.coverUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800'}
                  alt={event.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                {/* Category Pill */}
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
                    {event.category}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  {event.status === 'ACTIVE' ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      ACTIVE
                    </span>
                  ) : event.status === 'DRAFT' ? (
                    <span className="px-3 py-1 rounded-full bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Clock size={10} />
                      DRAFT
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-slate-700/90 backdrop-blur-md text-slate-200 text-[10px] font-black uppercase tracking-wider shadow-sm">
                      ARCHIVED
                    </span>
                  )}
                </div>

                {/* Event Title on Image Backdrop */}
                <div className="absolute bottom-3 inset-x-4">
                  <h3 className="text-base font-black text-white drop-shadow-md leading-tight line-clamp-1 group-hover:text-indigo-200 transition-colors">
                    {event.name}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5 mt-0.5 drop-shadow">
                    <MapPin size={11} className="text-indigo-400 shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </p>
                </div>
              </div>

              {/* Event Body Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar size={13} className="text-indigo-600" />
                      {event.date}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                      {event.qrToken}
                    </span>
                  </div>

                  {/* 2-Column Metrics Box */}
                  <div className="grid grid-cols-2 gap-3 p-3 mt-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <div className="space-y-0.5">
                      <div className="text-base font-black text-slate-900 flex items-center justify-center gap-1">
                        <ImageIcon size={13} className="text-indigo-600" />
                        {event.photoCount.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Photos Indexed
                      </div>
                    </div>

                    <div className="space-y-0.5 border-l border-slate-200 pl-2">
                      <div className="text-base font-black text-indigo-600 flex items-center justify-center gap-1">
                        <Sparkles size={13} className="text-amber-500" />
                        {event.searchCount.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Guest Searches
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/organizer/events/${event.id}`}
                      className="flex-1 bg-slate-900 hover:bg-indigo-600 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm group-hover:bg-indigo-600"
                    >
                      Manage Event
                      <ArrowRight size={13} />
                    </Link>

                    <Link
                      href={`/organizer/qr?eventId=${event.id}`}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 transition-colors"
                      title="View & Print Standee QR"
                    >
                      <QrCode size={16} />
                    </Link>

                    <Link
                      href={`/organizer/photos?eventId=${event.id}`}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 transition-colors"
                      title="Upload Photos"
                    >
                      <Upload size={16} />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(event.id, event.name)}
                      className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                      title="Delete Event"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Direct Test Guest View button */}
                  <Link
                    href={`/e/${event.qrToken || event.id}?name=${encodeURIComponent(event.name)}&venue=${encodeURIComponent(event.location)}&date=${encodeURIComponent(event.date)}&count=${event.photoCount}&eventId=${event.id}`}
                    target="_blank"
                    className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors block text-center"
                  >
                    <Eye size={14} />
                    <span>Test Guest View (Face Search)</span>
                    <ExternalLink size={12} className="opacity-70" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
