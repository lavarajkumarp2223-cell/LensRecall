'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import {
  Calendar,
  MapPin,
  Image as ImageIcon,
  Users,
  QrCode,
  Upload,
  Settings,
  CheckCircle2,
  ExternalLink,
  Plus,
  Copy,
  ArrowLeft,
  Sparkles,
  Layers,
  X,
  Trash2,
} from 'lucide-react';

import {
  StoredPhoto,
  getPhotosForEvent,
} from '../../../../lib/photo-storage';

interface EventData {
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
  description?: string;
}

interface Album {
  id: string;
  name: string;
  photoCount: number;
  isDefault: boolean;
}

interface Photographer {
  id: string;
  name: string;
  email: string;
  canUpload: boolean;
  canDelete: boolean;
}

export default function EventDetailPage() {
  const params = useParams();
  const eventId = (params?.['id'] as string) || '';

  const [event, setEvent] = useState<EventData | null>(null);
  const [storedPhotos, setStoredPhotos] = useState<StoredPhoto[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'albums' | 'photographers' | 'settings'>('overview');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [origin, setOrigin] = useState('http://localhost:3000');

  // Load real event from localStorage and stored photos
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }

    try {
      const raw = localStorage.getItem('lr_organizer_events');
      if (raw) {
        const events: EventData[] = JSON.parse(raw);
        const found = events.find((e) => e.id === eventId) || events[0];
        if (found) {
          setEvent(found);
        }
      }
    } catch {
      // ignore
    }

    if (eventId) {
      getPhotosForEvent(eventId).then((photos) => {
        setStoredPhotos(photos);
      });
    }
  }, [eventId]);

  const qrToken = event?.qrToken || `qr_${eventId}`;
  const eventName = encodeURIComponent(event?.name || 'Testing');
  const eventVenue = encodeURIComponent(event?.location || 'Galugondapeta');
  const eventDate = encodeURIComponent(event?.date || '2026-09-12');
  const eventCount = event?.photoCount || storedPhotos.length || 10;
  const guestUrl = `${origin}/e/${qrToken}?name=${eventName}&venue=${eventVenue}&date=${eventDate}&count=${eventCount}&eventId=${event?.id || eventId}`;

  useEffect(() => {
    if (!guestUrl) return;
    QRCode.toDataURL(guestUrl, {
      width: 500,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: { dark: '#0a0a0b', light: '#ffffff' },
    })
      .then((url) => setQrDataUrl(url))
      .catch(console.error);
  }, [guestUrl]);

  const copyGuestLink = () => {
    navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Albums state
  const [albumsList, setAlbumsList] = useState<Album[]>([
    {
      id: 'alb_1',
      name: 'Highlights & All Photos',
      photoCount: 0,
      isDefault: true,
    },
  ]);

  const [newAlbumName, setNewAlbumName] = useState('');
  const [showAlbumModal, setShowAlbumModal] = useState(false);

  // Photographers state
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [newPhotographerEmail, setNewPhotographerEmail] = useState('');
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const handleCreateAlbum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName) return;

    setAlbumsList([
      ...albumsList,
      {
        id: `alb_${Date.now()}`,
        name: newAlbumName,
        photoCount: 0,
        isDefault: false,
      },
    ]);
    setNewAlbumName('');
    setShowAlbumModal(false);
  };

  const handleInvitePhotographer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotographerEmail) return;

    setPhotographers([
      ...photographers,
      {
        id: `ph_${Date.now()}`,
        name: newPhotographerEmail.split('@')[0] || 'Photographer',
        email: newPhotographerEmail,
        canUpload: true,
        canDelete: false,
      },
    ]);
    setNewPhotographerEmail('');
    setShowPhotoModal(false);
  };

  const router = useRouter();

  const handleDeleteEvent = () => {
    if (confirm(`Are you sure you want to permanently delete event "${displayEvent.name}" and all its photos?`)) {
      try {
        const raw = localStorage.getItem('lr_organizer_events');
        if (raw) {
          const events: EventData[] = JSON.parse(raw);
          const updated = events.filter((e) => e.id !== displayEvent.id);
          localStorage.setItem('lr_organizer_events', JSON.stringify(updated));
        }
      } catch {}
      router.push('/organizer/events');
    }
  };

  const displayEvent: EventData = event || {
    id: eventId || 'evt_default',
    name: 'Event Shoot',
    category: 'Celebration',
    date: new Date().toLocaleDateString(),
    location: 'Venue TBA',
    status: 'ACTIVE',
    photoCount: 0,
    searchCount: 0,
    qrToken: `qr_${eventId}`,
    coverUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&auto=format&fit=crop&q=80',
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl pb-16">
      {/* Top breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/organizer/events" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
          <ArrowLeft size={13} />
          Events
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-bold">{displayEvent.name}</span>
      </div>

      {/* ── Event Header Banner ────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        {/* Cover Photo Backdrop */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-950">
          <img
            src={displayEvent.coverUrl}
            alt={displayEvent.name}
            className="w-full h-full object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 text-xs font-bold shadow-sm">
              {displayEvent.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {displayEvent.status}
            </span>
          </div>
        </div>

        {/* Header Details */}
        <div className="p-6 sm:p-8 -mt-16 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/90 backdrop-blur-md border-t border-slate-100">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {displayEvent.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600">
              <span className="flex items-center gap-1.5 font-semibold">
                <Calendar size={15} className="text-indigo-600" />
                {displayEvent.date}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin size={15} className="text-indigo-600" />
                {displayEvent.location}
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-500">
                <ImageIcon size={15} className="text-indigo-600" />
                {displayEvent.photoCount} Photos Indexed
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={copyGuestLink}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              {copied ? <CheckCircle2 size={15} className="text-emerald-600" /> : <Copy size={15} />}
              {copied ? 'Link Copied!' : 'Copy Guest Link'}
            </button>
            <Link
              href={`/organizer/photos?eventId=${displayEvent.id}`}
              className="lr-btn-primary-gradient px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Upload size={15} />
              Upload Photos
            </Link>
            <button
              type="button"
              onClick={handleDeleteEvent}
              className="px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Delete Event"
            >
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        {[
          { id: 'overview', label: 'Overview & Standee QR', icon: QrCode },
          { id: 'albums', label: `Albums (${albumsList.length})`, icon: Layers },
          { id: 'photographers', label: `Photographers (${photographers.length})`, icon: Users },
          { id: 'settings', label: 'Event Rules & Privacy', icon: Settings },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as 'overview' | 'albums' | 'photographers' | 'settings')}
            className={`flex items-center gap-2 pb-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview & QR ─────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Cols: Stats & Recent Photos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Photographs</div>
                <div className="text-2xl font-black text-slate-900">{displayEvent.photoCount}</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">Amazon Rekognition Partition</div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Guest Face Recalls</div>
                <div className="text-2xl font-black text-indigo-600">{displayEvent.searchCount}</div>
                <div className="text-[11px] text-slate-500 mt-1">Verified guest scans</div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-1 col-span-2 sm:col-span-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Rekognition Latency</div>
                <div className="text-2xl font-black text-slate-900">380ms</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">ap-south-1 (Mumbai)</div>
              </div>
            </div>

            {/* Photo Preview Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Event Photographs</h3>
                  <p className="text-xs text-slate-500">
                    Uploaded photographs indexed into collection partition <code className="text-indigo-600 font-mono">lensrecall_{displayEvent.id}</code>
                  </p>
                </div>
                <Link
                  href={`/organizer/photos?eventId=${displayEvent.id}`}
                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  Manage Photos
                  <ExternalLink size={12} />
                </Link>
              </div>

              {storedPhotos.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <ImageIcon size={22} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">No photos uploaded yet for this event</h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Drop high-resolution event photographs into the upload manager to begin instant facial recognition.
                  </p>
                  <Link
                    href={`/organizer/photos?eventId=${displayEvent.id}`}
                    className="inline-flex items-center gap-1.5 lr-btn-primary-gradient px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
                  >
                    <Upload size={13} />
                    Upload Photos Now
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {storedPhotos.slice(0, 6).map((photo) => (
                    <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm group">
                      <img
                        src={photo.thumbnailUrl}
                        alt={photo.originalFilename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                        <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-bold">
                          {photo.faceCount} face
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Col: QR Code Display Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 text-center">
              <div>
                <span className="inline-block px-3 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] uppercase font-bold mb-2">
                  Event Access QR
                </span>
                <h3 className="font-bold text-base text-slate-900">Guest Scanning Standee</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Guests scan this QR with any smartphone to trigger instant AI face search.
                </p>
              </div>

              {/* QR Image */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Event QR" className="w-48 h-48 object-contain rounded-xl" />
                ) : (
                  <div className="w-48 h-48 bg-slate-200 animate-pulse rounded-xl" />
                )}
              </div>

              <div className="text-xs text-slate-500 font-mono break-all bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {guestUrl}
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href={`/organizer/qr?eventId=${displayEvent.id}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Sparkles size={14} className="text-amber-400" />
                  Customize Standee in Studio
                </Link>

                <a
                  href={guestUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink size={13} />
                  Test Guest View
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Albums ────────────────────────────────────────────────────── */}
      {activeTab === 'albums' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Event Sub-Albums</h3>
              <p className="text-xs text-slate-500">Categorize your photographs by ceremony or session</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAlbumModal(true)}
              className="lr-btn-primary-gradient px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              Create Album
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {albumsList.map((album) => (
              <div
                key={album.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between p-5 space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      <Layers size={16} />
                    </span>
                    {album.isDefault && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                        Default
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-3">{album.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{album.photoCount} photos</p>
                </div>

                <Link
                  href={`/organizer/photos?eventId=${displayEvent.id}&album=${encodeURIComponent(album.name)}`}
                  className="w-full py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-600 text-xs font-bold text-center transition-colors block"
                >
                  View Photos
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Photographers ──────────────────────────────────────────────── */}
      {activeTab === 'photographers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Event Photographers</h3>
              <p className="text-xs text-slate-500">Allow team members to upload high-resolution images to this shoot</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPhotoModal(true)}
              className="lr-btn-primary-gradient px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              Invite Photographer
            </button>
          </div>

          {photographers.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Users size={22} />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No additional photographers assigned</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Invite associate photographers to give them direct upload permissions for this event shoot.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
              {photographers.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-700">
                      {p.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">{p.email}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {showAlbumModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Create New Album</h3>
              <button
                type="button"
                onClick={() => setShowAlbumModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Album Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reception Dinner, Day 2 Keynote"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAlbumModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="lr-btn-primary-gradient px-5 py-2 rounded-xl text-xs font-bold shadow-sm"
                >
                  Create Album
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPhotoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Invite Photographer</h3>
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleInvitePhotographer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Photographer Email</label>
                <input
                  type="email"
                  required
                  placeholder="photographer@studio.com"
                  value={newPhotographerEmail}
                  onChange={(e) => setNewPhotographerEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="lr-btn-primary-gradient px-5 py-2 rounded-xl text-xs font-bold shadow-sm"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
