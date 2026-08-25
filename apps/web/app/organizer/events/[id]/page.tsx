'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import {
  Calendar,
  MapPin,
  Image as ImageIcon,
  Users,
  QrCode,
  Upload,
  Settings,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Plus,
  Copy,
  ArrowLeft,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';

interface Album {
  id: string;
  name: string;
  photoCount: number;
  isDefault: boolean;
  coverUrl: string;
}

interface Photographer {
  id: string;
  name: string;
  email: string;
  canUpload: boolean;
  canDelete: boolean;
}

const EVENT_TOKENS: Record<string, string> = {
  evt_wedding_01: 'qr_rohan_priya_2026',
  evt_conf_02: 'qr_techvision_2026',
  evt_corp_03: 'qr_apex_awards_2026',
};

export default function EventDetailPage() {
  const params = useParams();
  const eventId = (params?.['id'] as string) || 'evt_wedding_01';
  const qrToken = EVENT_TOKENS[eventId] ?? 'qr_rohan_priya_2026';

  const [activeTab, setActiveTab] = useState<'overview' | 'albums' | 'photographers' | 'settings'>('overview');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [origin, setOrigin] = useState('http://localhost:3000');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const guestUrl = `${origin}/e/${qrToken}`;

  useEffect(() => {
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
      photoCount: 5420,
      isDefault: true,
      coverUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'alb_2',
      name: 'Sangeet & Mehendi Night',
      photoCount: 1840,
      isDefault: false,
      coverUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'alb_3',
      name: 'Ceremony & Phere',
      photoCount: 2150,
      isDefault: false,
      coverUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'alb_4',
      name: 'Reception Gala Dinner',
      photoCount: 1430,
      isDefault: false,
      coverUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop&q=80',
    },
  ]);

  const [newAlbumName, setNewAlbumName] = useState('');
  const [showAlbumModal, setShowAlbumModal] = useState(false);

  // Photographers state
  const [photographers, setPhotographers] = useState<Photographer[]>([
    {
      id: 'ph_1',
      name: 'Sarah Jenkins (Lead)',
      email: 'sarah@apexevents.com',
      canUpload: true,
      canDelete: true,
    },
    {
      id: 'ph_2',
      name: 'Marcus Brody',
      email: 'marcus@brodyphoto.com',
      canUpload: true,
      canDelete: false,
    },
  ]);

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
        coverUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
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

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl pb-16">
      {/* Top breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/organizer/events" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
          <ArrowLeft size={13} />
          Events
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-bold">Rohan & Priya Wedding Gala</span>
      </div>

      {/* ── Event Header Banner ────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        {/* Cover Photo Backdrop */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-950">
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&auto=format&fit=crop&q=80"
            alt="Event Cover"
            className="w-full h-full object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 text-xs font-bold shadow-sm">
              Wedding Collection
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              ACTIVE
            </span>
          </div>
        </div>

        {/* Header Details */}
        <div className="p-6 sm:p-8 -mt-16 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/90 backdrop-blur-md border-t border-slate-100">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Rohan & Priya Wedding Gala
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600">
              <span className="flex items-center gap-1.5 font-semibold">
                <Calendar size={15} className="text-indigo-600" />
                Aug 24, 2026
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin size={15} className="text-indigo-600" />
                Taj West End, Bangalore
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-500">
                <ImageIcon size={15} className="text-indigo-600" />
                5,420 Photos Indexed
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
              href="/organizer/photos"
              className="lr-btn-primary-gradient px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Upload size={15} />
              Upload Photos
            </Link>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        {[
          { id: 'overview', label: 'Overview & Standee QR', icon: QrCode },
          { id: 'albums', label: 'Albums (4)', icon: Layers },
          { id: 'photographers', label: 'Photographers (2)', icon: Users },
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
                <div className="text-2xl font-black text-slate-900">5,420</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">100% indexed in R2</div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Guest Face Recalls</div>
                <div className="text-2xl font-black text-indigo-600">840</div>
                <div className="text-[11px] text-slate-500 mt-1">Avg 18 photos/guest</div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-1 col-span-2 sm:col-span-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Rekognition Latency</div>
                <div className="text-2xl font-black text-slate-900">380ms</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">Sub-second recall</div>
              </div>
            </div>

            {/* Photo Preview Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Recent Uploads</h3>
                  <p className="text-xs text-slate-500">
                    Photos processed and indexed with face bounding boxes
                  </p>
                </div>
                <Link
                  href="/organizer/photos"
                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  View full gallery
                  <ExternalLink size={12} />
                </Link>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[
                  'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&auto=format&fit=crop&q=60',
                  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&auto=format&fit=crop&q=60',
                  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop&q=60',
                  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&auto=format&fit=crop&q=60',
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=60',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=60',
                ].map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group shadow-sm">
                    <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                      <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-bold">
                        2 faces
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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

              {/* QR Container */}
              <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-md inline-block mx-auto">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Scannable QR Code for event ${eventId}`}
                    className="w-48 h-48 mx-auto rounded-lg object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                    Generating QR...
                  </div>
                )}
                <div className="text-[10px] font-mono text-slate-500 font-semibold tracking-wider mt-2">
                  SCAN TO RECALL MOMENTS
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <Link
                  href={`/organizer/qr?eventId=${eventId}`}
                  className="lr-btn-primary-gradient w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <Sparkles size={14} />
                  Open Standee Designer
                </Link>

                <a
                  href={guestUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors block"
                >
                  <ExternalLink size={13} />
                  Open Live Guest View
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
              <h3 className="font-bold text-lg text-slate-900">Event Albums</h3>
              <p className="text-xs text-slate-500">
                Group photographs into structured sub-events or ceremonies
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAlbumModal(true)}
              className="lr-btn-primary-gradient px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={15} />
              Create Album
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {albumsList.map((album) => (
              <div
                key={album.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  {album.isDefault && (
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow-sm">
                        Default Collection
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{album.name}</h4>
                    <p className="text-xs text-slate-500">{album.photoCount.toLocaleString()} photos</p>
                  </div>
                  <Link
                    href={`/organizer/photos?albumId=${album.id}`}
                    className="w-full bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-600 py-2 rounded-xl text-xs font-bold text-center block transition-colors"
                  >
                    View Photos
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Modal: Create Album */}
          {showAlbumModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-in border border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900">Create New Album</h3>
                  <button type="button" onClick={() => setShowAlbumModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleCreateAlbum} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Album Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Haldi Ceremony"
                      value={newAlbumName}
                      onChange={(e) => setNewAlbumName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAlbumModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="lr-btn-primary-gradient px-4 py-2 rounded-xl text-xs font-bold shadow-sm">
                      Create Album
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Photographers ─────────────────────────────────────────────── */}
      {activeTab === 'photographers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate-900">Assigned Photographers</h3>
              <p className="text-xs text-slate-500">
                Assign photographers to upload directly to this event shoot
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPhotoModal(true)}
              className="lr-btn-primary-gradient px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={15} />
              Assign Photographer
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            {photographers.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-sm text-indigo-700">
                    {p.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                    Upload Allowed
                  </span>
                  <button
                    type="button"
                    onClick={() => setPhotographers(photographers.filter((item) => item.id !== p.id))}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal: Assign Photographer */}
          {showPhotoModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-in border border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900">Assign Photographer</h3>
                  <button type="button" onClick={() => setShowPhotoModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPhotoModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="lr-btn-primary-gradient px-4 py-2 rounded-xl text-xs font-bold shadow-sm">
                      Assign Access
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Settings ──────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-base text-slate-900">Event Rules & Biometrics</h3>

            <div className="space-y-4 divide-y divide-slate-100">
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-xs font-bold text-slate-900">Event Discovery Status</div>
                  <div className="text-[11px] text-slate-500">
                    When active, guests can scan and search faces. When archived, search is frozen.
                  </div>
                </div>
                <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <div className="text-xs font-bold text-slate-900">Watermarking on Previews</div>
                  <div className="text-[11px] text-slate-500">
                    Stamp copyright watermark on guest gallery previews
                  </div>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-600 rounded cursor-pointer" />
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 space-y-3">
            <h3 className="font-bold text-sm text-rose-700">Danger Zone</h3>
            <p className="text-xs text-rose-600/80 leading-relaxed">
              Deleting this event will permanently remove all 5,420 photos, vector face representations, and delete the AWS Rekognition collection.
            </p>
            <button type="button" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm">
              <Trash2 size={14} />
              Delete Event & Face Indexes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
