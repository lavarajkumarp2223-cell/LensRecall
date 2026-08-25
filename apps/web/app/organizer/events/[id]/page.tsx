'use client';

import { useState, useEffect, useRef } from 'react';
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
  Copy,
  ArrowLeft,
  Sparkles,
  Layers,
  X,
  Trash2,
  Camera,
  Check,
} from 'lucide-react';

import {
  StoredPhoto,
  getPhotosForEvent,
  deletePhotosForEvent,
} from '../../../../lib/photo-storage';

import { getUserEvents, deleteUserEvent, saveUserEvent } from '../../../../lib/events-storage';

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

export default function EventDetailPage() {
  const params = useParams();
  const eventId = (params?.['id'] as string) || '';
  const router = useRouter();

  const [event, setEvent] = useState<EventData | null>(null);
  const [storedPhotos, setStoredPhotos] = useState<StoredPhoto[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'albums' | 'photographers' | 'settings'>('overview');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [origin, setOrigin] = useState('http://localhost:3000');
  const [showCoverModal, setShowCoverModal] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Load real event from user-scoped events and stored photos
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }

    try {
      const userEvents = getUserEvents();
      const found = userEvents.find((e) => e.id === eventId);
      if (found) {
        setEvent(found as EventData);
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
  const eventCount = event?.photoCount || storedPhotos.length || 0;
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

  const handleUpdateCover = (newCoverUrl: string) => {
    if (!newCoverUrl || !displayEvent.id) return;
    try {
      const updated = { ...displayEvent, coverUrl: newCoverUrl } as any;
      saveUserEvent(updated);
    } catch {}
    setEvent((prev) => (prev ? { ...prev, coverUrl: newCoverUrl } : null));
    setShowCoverModal(false);
  };

  const handleCustomCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleUpdateCover(reader.result);
      }
    };
    reader.readAsDataURL(file);
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

  const handleDeleteEvent = () => {
    if (confirm(`Are you sure you want to permanently delete event "${displayEvent.name}" and all its photos?`)) {
      try {
        deleteUserEvent(displayEvent.id);
        deletePhotosForEvent(displayEvent.id);
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
    <div className="space-y-8 animate-fade-in max-w-7xl pb-16 font-sans">
      <input
        type="file"
        ref={coverFileInputRef}
        onChange={handleCustomCoverUpload}
        accept="image/*"
        className="hidden"
      />

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

          {/* Change Cover Button */}
          <button
            type="button"
            onClick={() => setShowCoverModal(true)}
            className="absolute top-4 right-4 px-3.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
          >
            <Camera size={14} />
            <span>Change Cover Image</span>
          </button>
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
                {storedPhotos.length} Photos Indexed
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
            >
              <Trash2 size={15} />
              Delete Event
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 sm:px-8 border-t border-slate-200 bg-slate-50/50 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Standee QR', icon: QrCode },
            { id: 'albums', label: `Albums (${albumsList.length})`, icon: Layers },
            { id: 'photographers', label: `Photographers (${photographers.length})`, icon: Users },
            { id: 'settings', label: 'Event Rules & Privacy', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 bg-white shadow-xs rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab 1: Overview & QR Standee ────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Photographs
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {storedPhotos.length}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span>Amazon Rekognition Partition</span>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Guest Face Recalls
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {displayEvent.searchCount}
                </div>
                <div className="text-[11px] text-slate-500">Verified guest scans</div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Rekognition Latency
                </div>
                <div className="text-2xl font-black text-indigo-600">380ms</div>
                <div className="text-[11px] text-emerald-600 font-bold">ap-south-1 (Mumbai)</div>
              </div>
            </div>

            {/* Event Photographs Thumbnail Grid */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Event Photographs</h3>
                  <p className="text-xs text-slate-500">
                    Uploaded photographs indexed into collection partition <code className="text-indigo-600 font-mono text-[10px]">{`lensrecall_${displayEvent.id}`}</code>
                  </p>
                </div>
                <Link
                  href={`/organizer/photos?eventId=${displayEvent.id}`}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <span>Manage Photos</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

              {storedPhotos.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <ImageIcon size={24} className="text-slate-400 mx-auto" />
                  <div className="text-xs font-bold text-slate-700">No photographs uploaded yet for this event</div>
                  <p className="text-[11px] text-slate-400">Upload your event photos to enable AI face search for guests.</p>
                  <Link
                    href={`/organizer/photos?eventId=${displayEvent.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl lr-btn-primary-gradient text-white text-xs font-bold shadow-xs mt-2"
                  >
                    <Upload size={13} />
                    <span>Upload First Photo</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {storedPhotos.slice(0, 6).map((photo, i) => (
                    <div key={photo.id || i} className="group relative rounded-xl overflow-hidden aspect-square border border-slate-200 bg-slate-100">
                      <img src={photo.thumbnailUrl || photo.url} alt={photo.originalFilename} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleUpdateCover(photo.url || photo.thumbnailUrl)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold p-1 text-center cursor-pointer"
                      >
                        <Camera size={12} className="mb-0.5" />
                        <span>Set as Cover</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Standee QR Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-between text-center space-y-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                Event Access QR
              </span>
              <h3 className="font-extrabold text-base text-slate-900 mt-2">Guest Scanning Standee</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Guests scan this QR with any smartphone to trigger instant AI face search.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Event QR" className="w-52 h-52 object-contain rounded-xl" />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center bg-slate-50 text-slate-400">
                  <QrCode size={48} />
                </div>
              )}
            </div>

            <div className="w-full space-y-2">
              <input
                type="text"
                readOnly
                value={guestUrl}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-mono text-slate-600 select-all"
              />

              <Link
                href={`/organizer/qr?eventId=${displayEvent.id}`}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles size={14} className="text-amber-400" />
                <span>Customize Standee in Studio</span>
              </Link>

              <Link
                href={guestUrl}
                target="_blank"
                className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors block text-center"
              >
                <ExternalLink size={13} />
                <span>Test Guest View</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Cover Image Modal ────────────────────────────────────────── */}
      {showCoverModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 animate-scale-in border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Change Event Cover Image</h3>
                <p className="text-xs text-slate-500">Pick from your uploaded event photos, upload a custom file, or choose a preset theme.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCoverModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            {/* Option 1: Upload Custom File */}
            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-900">Upload Custom Image File</div>
                <div className="text-[11px] text-slate-500">Use any high-res banner photo from your computer or phone</div>
              </div>
              <button
                type="button"
                onClick={() => coverFileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl lr-btn-primary-gradient text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Upload size={14} />
                <span>Choose File</span>
              </button>
            </div>

            {/* Option 2: Uploaded Event Photos */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800">
                Choose from Uploaded Event Photos ({storedPhotos.length})
              </div>
              {storedPhotos.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No photos uploaded yet. Upload event photos to select from them here.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {storedPhotos.map((p) => {
                    const isCurrent = displayEvent.coverUrl === (p.url || p.thumbnailUrl);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleUpdateCover(p.url || p.thumbnailUrl)}
                        className={`group relative rounded-xl overflow-hidden aspect-video cursor-pointer border-2 transition-all ${
                          isCurrent ? 'border-indigo-600 ring-2 ring-indigo-500/30' : 'border-slate-200 hover:border-indigo-400'
                        }`}
                      >
                        <img src={p.thumbnailUrl || p.url} alt={p.originalFilename} className="w-full h-full object-cover" />
                        {isCurrent && (
                          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check size={12} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Option 3: Presets */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800">Or Pick from Presets</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PRESET_COVERS.map((preset) => (
                  <div
                    key={preset.name}
                    onClick={() => handleUpdateCover(preset.url)}
                    className="relative rounded-xl overflow-hidden aspect-video cursor-pointer border border-slate-200 hover:border-indigo-500 transition-all group"
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                      <span className="text-[10px] font-bold text-white truncate">{preset.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Album */}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Album Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reception Gala Dinner"
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

      {/* Modal: Invite Photographer */}
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
