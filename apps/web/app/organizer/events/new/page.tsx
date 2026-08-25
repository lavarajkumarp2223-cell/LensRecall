'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  MapPin,
  Image as ImageIcon,
  Shield,
  ArrowLeft,
  Loader2,
  Sparkles,
  Clock,
  Plus,
} from 'lucide-react';

const CATEGORIES = [
  'Wedding',
  'Conference',
  'Corporate Gala',
  'Birthday',
  'Concert / Festival',
  'Sports Event',
  'Private Celebration',
];

const PRESET_COVERS = [
  {
    name: 'Wedding Warmth',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Tech Conference',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Celebration Lights',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Party Vibes',
    url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop&q=80',
  },
];

export default function NewEventPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Wedding');
  const [eventDate, setEventDate] = useState('2026-09-12');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(PRESET_COVERS[0]!.url);

  // Settings
  const [requireGuestAuth, setRequireGuestAuth] = useState(true);
  const [allowGuestDownloads, setAllowGuestDownloads] = useState(true);
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [faceRetentionDays, setFaceRetentionDays] = useState(90);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('lr_access_token') || ''}`,
        },
        body: JSON.stringify({
          name,
          eventDate,
          location,
          description,
          coverPhotoUrl,
          requireGuestAuth,
          allowGuestDownloads,
          watermarkEnabled,
          faceRetentionDays,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/organizer/events/${data.data.id}`);
        return;
      }
    } catch {
      // Fallback local persistence
    }

    const newEvent = {
      id: `evt_${Date.now()}`,
      name,
      category: 'Celebration',
      date: eventDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      location: location || 'Venue TBA',
      status: 'ACTIVE',
      photoCount: 0,
      searchCount: 0,
      qrToken: `qr_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`,
      coverUrl: coverPhotoUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
      description,
      organizerName: 'My Studio',
    };

    try {
      const existingRaw = localStorage.getItem('lr_organizer_events');
      let existingEvents = [];
      if (existingRaw) existingEvents = JSON.parse(existingRaw);
      existingEvents.unshift(newEvent);
      localStorage.setItem('lr_organizer_events', JSON.stringify(existingEvents));
    } catch {
      // ignore
    }

    router.push('/organizer/events');
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-16">
      {/* Top breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/organizer/events" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
          <ArrowLeft size={13} />
          Events
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-bold">Create Event</span>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Calendar size={28} className="text-indigo-600" />
          Create New Event Collection
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure event details, cover image, and AWS Rekognition collection partition settings
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. General Details */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600" />
              Event Details
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Event Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Vikram & Maya Wedding Celebrations"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Event Date</label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Venue / Location</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. The Leela Palace, Bengaluru"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                />
                <MapPin size={15} className="absolute left-3 top-3 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
              <textarea
                rows={3}
                placeholder="Welcome guests! Scan the event standee QR at the venue entrance to find all your moments."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* 2. Cover Photo Selection */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ImageIcon size={18} className="text-indigo-600" />
              Cover Image Preset
            </h3>
            <p className="text-xs text-slate-500">
              Choose a cover image displayed on the guest QR scanning landing page.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESET_COVERS.map((preset) => (
                <div
                  key={preset.name}
                  onClick={() => setCoverPhotoUrl(preset.url)}
                  className={`relative rounded-2xl overflow-hidden aspect-video cursor-pointer border-2 transition-all ${
                    coverPhotoUrl === preset.url
                      ? 'border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                    <span className="text-[10px] font-bold text-white truncate">
                      {preset.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Privacy & Biometric Rules */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Shield size={18} className="text-indigo-600" />
              Privacy & Biometric Retention Rules
            </h3>

            <div className="space-y-4 divide-y divide-slate-100">
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-xs font-bold text-slate-900">Require Guest Consent & Sign-In</div>
                  <div className="text-[11px] text-slate-500">
                    Guests must sign in via Google or Magic Link before viewing matched photos
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={requireGuestAuth}
                  onChange={(e) => setRequireGuestAuth(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <div className="text-xs font-bold text-slate-900">Allow High-Res Downloads</div>
                  <div className="text-[11px] text-slate-500">
                    Guests can download original full-resolution photographs
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={allowGuestDownloads}
                  onChange={(e) => setAllowGuestDownloads(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <div className="text-xs font-bold text-slate-900">Watermark on Guest Previews</div>
                  <div className="text-[11px] text-slate-500">
                    Apply studio watermark overlay on thumbnail views
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={watermarkEnabled}
                  onChange={(e) => setWatermarkEnabled(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <div className="text-xs font-bold text-slate-900">AWS Rekognition Retention</div>
                  <div className="text-[11px] text-slate-500">
                    Auto-purge face vectors from AWS collection after specified duration
                  </div>
                </div>
                <select
                  value={faceRetentionDays}
                  onChange={(e) => setFaceRetentionDays(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value={30}>30 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days (Standard)</option>
                  <option value={180}>180 Days</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Summary & Submit Action */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-base text-slate-900">Event Summary</h3>

            {/* Live Preview Card */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
              <div className="relative h-32 w-full bg-slate-900">
                <img src={coverPhotoUrl} alt="Cover preview" className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                    {category}
                  </span>
                </div>
              </div>
              <div className="p-3.5 space-y-1">
                <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                  {name || 'Untitled Event'}
                </h4>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <MapPin size={11} className="text-indigo-600" />
                  {location || 'Location not set'}
                </p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar size={11} className="text-indigo-600" />
                  {eventDate}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-indigo-600" />
                <span>AWS Rekognition Collection Auto-Created</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-indigo-600" />
                <span>Face Data Retention: {faceRetentionDays} days</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="lr-btn-primary-gradient w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Plus size={16} />
                  Create Event & Provision AI
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
