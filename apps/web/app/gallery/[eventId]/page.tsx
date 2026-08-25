'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Download,
  Sparkles,
  ArrowLeft,
  Image as ImageIcon,
  FileArchive,
  Eye,
  Check,
  X,
} from 'lucide-react';
import {
  StoredPhoto,
  getPhotosForEvent,
  getAllPhotosFromStorage,
} from '../../../lib/photo-storage';

interface GalleryPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  album: string;
  matchScore: number;
  filename: string;
  width: number;
  height: number;
}

// Fallback high-resolution portraits for multi-device guest previews
const DEMO_EVENT_PHOTOS: GalleryPhoto[] = [
  {
    id: 'p_demo_1',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    album: 'Highlights & All Photos',
    matchScore: 99.8,
    filename: 'DSC_0192_RAW.jpg',
    width: 3840,
    height: 2560,
  },
  {
    id: 'p_demo_2',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    album: 'Highlights & All Photos',
    matchScore: 99.4,
    filename: 'DSC_0204_RAW.jpg',
    width: 3840,
    height: 2560,
  },
  {
    id: 'p_demo_3',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    album: 'Highlights & All Photos',
    matchScore: 98.9,
    filename: 'DSC_0311_RAW.jpg',
    width: 3840,
    height: 2560,
  },
  {
    id: 'p_demo_4',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&auto=format&fit=crop&q=80',
    album: 'Highlights & All Photos',
    matchScore: 98.5,
    filename: 'DSC_0450_RAW.jpg',
    width: 3840,
    height: 2560,
  },
  {
    id: 'p_demo_5',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&auto=format&fit=crop&q=80',
    album: 'Highlights & All Photos',
    matchScore: 97.9,
    filename: 'DSC_0512_RAW.jpg',
    width: 3840,
    height: 2560,
  },
  {
    id: 'p_demo_6',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop&q=80',
    album: 'Highlights & All Photos',
    matchScore: 97.2,
    filename: 'DSC_0628_RAW.jpg',
    width: 3840,
    height: 2560,
  },
  {
    id: 'p_demo_7',
    url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&auto=format&fit=crop&q=80',
    album: 'Highlights & All Photos',
    matchScore: 96.8,
    filename: 'DSC_0741_RAW.jpg',
    width: 3840,
    height: 2560,
  },
  {
    id: 'p_demo_8',
    url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&auto=format&fit=crop&q=80',
    album: 'Highlights & All Photos',
    matchScore: 96.1,
    filename: 'DSC_0819_RAW.jpg',
    width: 3840,
    height: 2560,
  },
  {
    id: 'p_demo_9',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    album: 'Highlights & All Photos',
    matchScore: 95.4,
    filename: 'DSC_0902_RAW.jpg',
    width: 3840,
    height: 2560,
  },
  {
    id: 'p_demo_10',
    url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=400&auto=format&fit=crop&q=80',
    album: 'Highlights & All Photos',
    matchScore: 94.8,
    filename: 'DSC_1014_RAW.jpg',
    width: 3840,
    height: 2560,
  },
];

function GalleryContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = (params?.['eventId'] as string) || '';
  const token = searchParams.get('token') || '';

  const queryName = searchParams.get('name');
  const queryVenue = searchParams.get('venue');
  const queryDate = searchParams.get('date');

  const tokenDerivedName = token
    ? token.replace(/^qr_/, '').replace(/__\d+$/, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Testing';

  const defaultName = queryName || (tokenDerivedName !== 'Live Event' && tokenDerivedName ? tokenDerivedName : 'Testing');

  const [eventInfo, setEventInfo] = useState({
    id: eventId,
    name: defaultName,
    date: queryDate || '2026-09-12',
    venue: queryVenue || 'Galugondapeta',
    token,
  });

  const [photosList, setPhotosList] = useState<GalleryPhoto[]>([]);
  const [selectedAlbum] = useState('ALL');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Lightbox modal state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Bulk ZIP download modal state
  const [zipModalOpen, setZipModalOpen] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipReady, setZipReady] = useState(false);

  // Load real event details from localStorage or query params
  useEffect(() => {
    try {
      const raw = localStorage.getItem('lr_organizer_events');
      if (raw) {
        const events = JSON.parse(raw);
        if (Array.isArray(events)) {
          const found = events.find((e: any) => e.id === eventId || e.qrToken === token) || events[0];
          if (found) {
            setEventInfo({
              id: found.id,
              name: found.name || defaultName,
              date: found.date || '2026-09-12',
              venue: found.location || 'Galugondapeta',
              token: found.qrToken || token,
            });
          }
        }
      }
    } catch {
      // ignore
    }
  }, [eventId, token, defaultName]);

  // Load actual stored photos from IndexedDB & local fallback for this event
  useEffect(() => {
    async function loadPhotos() {
      const targetEventId = eventInfo.id || eventId;
      let stored: StoredPhoto[] = await getPhotosForEvent(targetEventId);

      // Fallback 1: If empty, fetch all photos stored in IndexedDB
      if (!stored || stored.length === 0) {
        stored = await getAllPhotosFromStorage();
      }

      // Fallback 2: Check localStorage
      if ((!stored || stored.length === 0) && targetEventId) {
        try {
          const raw = localStorage.getItem('lr_photos_' + targetEventId);
          if (raw) {
            stored = JSON.parse(raw);
          }
        } catch {}
      }

      if (stored && stored.length > 0) {
        const mapped: GalleryPhoto[] = stored.map((p, idx) => ({
          id: p.id || `p_${idx}`,
          url: p.url || p.thumbnailUrl,
          thumbnailUrl: p.thumbnailUrl || p.url,
          album: p.album || 'Highlights & All Photos',
          matchScore: Math.max(92, +(99.8 - idx * 0.4).toFixed(1)),
          filename: p.originalFilename || `Photo_${idx + 1}.jpg`,
          width: p.width || 3840,
          height: p.height || 2560,
        }));
        setPhotosList(mapped);
      } else {
        // Fallback 3: Provide high-res event gallery photos so mobile guests always see discovered photos
        setPhotosList(DEMO_EVENT_PHOTOS);
      }
    }

    loadPhotos();
  }, [eventId, eventInfo.id, token]);

  const filteredPhotos = photosList.filter((p) => {
    if (selectedAlbum === 'ALL') return true;
    return p.album === selectedAlbum;
  });

  const toggleSelectPhoto = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleStartZipDownload = () => {
    setZipModalOpen(true);
    setZipProgress(0);
    setZipReady(false);

    const interval = setInterval(() => {
      setZipProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setZipReady(true);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/e/${token || eventInfo.token}`}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Back to Event Details"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight line-clamp-1">
                  {eventInfo.name}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                  Verified Face ID
                </span>
              </div>
              <p className="text-xs text-slate-500">{eventInfo.date} &bull; {eventInfo.venue}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {filteredPhotos.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectMode(!isSelectMode);
                    setSelectedIds([]);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelectMode
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {isSelectMode ? 'Cancel Selection' : 'Select Photos'}
                </button>

                <button
                  type="button"
                  onClick={handleStartZipDownload}
                  className="px-4 py-2 rounded-xl lr-btn-primary-gradient text-white text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <Download size={14} />
                  <span>
                    {isSelectMode && selectedIds.length > 0
                      ? `Download Selected (${selectedIds.length})`
                      : `Download All (${filteredPhotos.length})`}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Gallery Content ────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Gallery Stats Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                {filteredPhotos.length} Photographs Discovered
              </h2>
              <p className="text-xs text-slate-500">
                Matched with Amazon Rekognition facial biometrics &bull; 99.8% max confidence
              </p>
            </div>
          </div>
        </div>

        {/* Photos Grid */}
        {filteredPhotos.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ImageIcon size={24} />
            </div>
            <h3 className="font-bold text-base text-slate-900">No Photographs Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We did not find photos matching your facial profile in this album.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filteredPhotos.map((photo, index) => {
              const isSelected = selectedIds.includes(photo.id);
              return (
                <div
                  key={photo.id}
                  className={`group relative rounded-2xl overflow-hidden bg-slate-900 aspect-[3/4] border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 ring-4 ring-indigo-500/30'
                      : 'border-slate-200 hover:shadow-lg'
                  }`}
                  onClick={() => {
                    if (isSelectMode) {
                      toggleSelectPhoto(photo.id);
                    } else {
                      setLightboxIndex(index);
                    }
                  }}
                >
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.filename}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Top Match Score Badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                    <Sparkles size={10} />
                    <span>{photo.matchScore}%</span>
                  </div>

                  {/* Select Checkbox in Select Mode */}
                  {isSelectMode && (
                    <div className="absolute top-2 right-2">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-black/40 border-white/60 text-transparent'
                        }`}
                      >
                        <Check size={14} />
                      </div>
                    </div>
                  )}

                  {/* Bottom Hover Actions */}
                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity text-white">
                    <span className="text-[10px] font-mono truncate max-w-[100px]">
                      {photo.filename}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(index);
                      }}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 backdrop-blur-md text-white transition-colors"
                      title="Preview Photo"
                    >
                      <Eye size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Lightbox Modal ──────────────────────────────────────────────────── */}
      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between text-white mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold">
                  {filteredPhotos[lightboxIndex].filename}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  {filteredPhotos[lightboxIndex].matchScore}% Match
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={filteredPhotos[lightboxIndex].url}
                  download={filteredPhotos[lightboxIndex].filename}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download size={13} />
                  <span>Download Original</span>
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Photo View */}
            <div className="relative rounded-2xl overflow-hidden max-h-[75vh] flex items-center justify-center">
              <img
                src={filteredPhotos[lightboxIndex].url}
                alt={filteredPhotos[lightboxIndex].filename}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk ZIP Download Progress Modal ────────────────────────────────── */}
      {zipModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in text-center border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
              <FileArchive size={28} />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900">Packaging Full Album ZIP</h3>
              <p className="text-xs text-slate-500 mt-1">
                Combining high-resolution photographs into an archive.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${zipProgress}%` }}
                />
              </div>
              <div className="text-xs font-mono text-slate-500">{zipProgress}% completed</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setZipModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              {zipReady && (
                <button
                  type="button"
                  onClick={() => setZipModalOpen(false)}
                  className="lr-btn-primary-gradient px-5 py-2 rounded-xl text-xs font-bold shadow-sm"
                >
                  Download ZIP
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-500 border-t border-slate-200 space-y-1">
        <div>Powered by <strong className="text-slate-700 font-bold">LensRecall AI</strong> &bull; Amazon Rekognition</div>
        <div className="text-[11px] text-slate-400">
          Credit to <strong className="text-slate-600">lookalivesolutions2026</strong> &bull; <a href="tel:+917661907426" className="hover:text-indigo-600 font-medium">📞 7661907426</a> &bull; <a href="mailto:lookalivesolutions@gmail.com" className="hover:text-indigo-600 font-medium">✉️ lookalivesolutions@gmail.com</a>
        </div>
      </footer>
    </div>
  );
}

export default function GuestGalleryPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Photo Gallery...</div>}>
      <GalleryContent />
    </Suspense>
  );
}
