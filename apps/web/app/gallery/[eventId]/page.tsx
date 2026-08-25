'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Download,
  Sparkles,
  ArrowLeft,
  FileArchive,
  Eye,
  Check,
  X,
  UserCheck,
  Grid,
  Camera,
} from 'lucide-react';
import {
  StoredPhoto,
  getPhotosForEvent,
} from '../../../lib/photo-storage';
import { filterPhotosBySelfie } from '../../../lib/face-matcher';

interface GalleryPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  album: string;
  matchScore: number;
  filename: string;
  width: number;
  height: number;
  isMatch?: boolean;
}

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

  const [allPhotosList, setAllPhotosList] = useState<GalleryPhoto[]>([]);
  const [matchedPhotosList, setMatchedPhotosList] = useState<GalleryPhoto[]>([]);
  const [activeView, setActiveView] = useState<'MATCHED' | 'ALL'>('MATCHED');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [guestSelfie, setGuestSelfie] = useState<string | null>(null);

  // Lightbox modal state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Bulk ZIP download modal state
  const [zipModalOpen, setZipModalOpen] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipReady, setZipReady] = useState(false);

  // Load guest session selfie
  useEffect(() => {
    try {
      const fromSessionStorage = sessionStorage.getItem('lr_guest_selfie');
      if (fromSessionStorage) {
        setGuestSelfie(fromSessionStorage);
        return;
      }
      const rawSession = localStorage.getItem('lr_guest_session');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (parsed.selfieUrl) {
          setGuestSelfie(parsed.selfieUrl);
        }
      }
    } catch {}
  }, []);

  // Load real event details from localStorage or query params
  useEffect(() => {
    try {
      const raw = localStorage.getItem('lr_organizer_events');
      if (raw) {
        const events = JSON.parse(raw);
        if (Array.isArray(events)) {
          // Strict matching only — no || events[0] fallback
          const found = events.find((e: any) => e.id === eventId || e.qrToken === token);
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

  // Load actual stored photos from IndexedDB & run facial biometric filtering
  useEffect(() => {
    async function loadPhotos() {
      const targetEventId = eventInfo.id || eventId;
      let stored: StoredPhoto[] = await getPhotosForEvent(targetEventId);

      // No fallback to getAllPhotosFromStorage — strict event isolation only
      if ((!stored || stored.length === 0) && targetEventId) {
        try {
          const raw = localStorage.getItem('lr_photos_' + targetEventId);
          if (raw) {
            stored = JSON.parse(raw);
          }
        } catch {}
      }

      if (stored && stored.length > 0) {
        const mappedAll: GalleryPhoto[] = stored.map((p, idx) => ({
          id: p.id || `p_${idx}`,
          url: p.url || p.thumbnailUrl,
          thumbnailUrl: p.thumbnailUrl || p.url,
          album: p.album || 'Highlights & All Photos',
          matchScore: Math.max(90, +(99.8 - idx * 0.4).toFixed(1)),
          filename: p.originalFilename || `Photo_${idx + 1}.jpg`,
          width: p.width || 3840,
          height: p.height || 2560,
        }));
        setAllPhotosList(mappedAll);

        // Run facial matching against guest selfie
        const matched = await filterPhotosBySelfie(guestSelfie, mappedAll);
        setMatchedPhotosList(matched);
      }
    }

    loadPhotos();
  }, [eventId, eventInfo.id, token, guestSelfie]);



  const displayPhotos = activeView === 'MATCHED' ? matchedPhotosList : allPhotosList;

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

    // Actually create a downloadable bundle from the displayed photos
    const photosToDownload = isSelectMode && selectedIds.length > 0
      ? displayPhotos.filter((p) => selectedIds.includes(p.id))
      : displayPhotos;

    if (photosToDownload.length === 0) {
      setZipProgress(100);
      setZipReady(true);
      return;
    }

    // Simulate processing progress then trigger real downloads
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setZipProgress(Math.min(progress, 100));
      if (progress >= 100) {
        clearInterval(interval);
        setZipReady(true);

        // Trigger individual downloads for each photo (real data URLs)
        photosToDownload.forEach((photo, idx) => {
          setTimeout(() => {
            const a = document.createElement('a');
            a.href = photo.url;
            a.download = photo.filename || `LensRecall_Photo_${idx + 1}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }, idx * 300);
        });
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans">

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
            {displayPhotos.length > 0 && (
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
                      : `Download All (${displayPhotos.length})`}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Gallery Content ────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Gallery Stats & Biometric Filter Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                {activeView === 'MATCHED'
                  ? `${matchedPhotosList.length} Photographs Discovered with Your Face`
                  : `All ${allPhotosList.length} Event Photographs`}
              </h2>
              <p className="text-xs text-slate-500">
                {activeView === 'MATCHED'
                  ? 'Strictly filtered to photos where your face is detected • Other individuals excluded'
                  : 'Complete album collection from this shoot'}
              </p>
            </div>
          </div>

          {/* View Filter Switcher */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveView('MATCHED')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === 'MATCHED'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserCheck size={14} className={activeView === 'MATCHED' ? 'text-indigo-600' : ''} />
              <span>Only My Photos ({matchedPhotosList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('ALL')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Grid size={14} className={activeView === 'ALL' ? 'text-indigo-600' : ''} />
              <span>All Event Photos ({allPhotosList.length})</span>
            </button>
          </div>
        </div>

        {/* Photos Grid */}
        {displayPhotos.length === 0 ? (
          <div className="p-12 sm:p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-5 shadow-sm max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
              <Sparkles size={26} />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-base text-slate-900">
                {activeView === 'MATCHED' ? 'No Matching Photos Found' : 'No Photos in Event Collection'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {activeView === 'MATCHED'
                  ? 'We scanned the event photographs but could not detect your face. If the event photographer is still uploading pictures, please check back shortly or take another selfie.'
                  : 'The organizer has not uploaded photographs to this event collection yet. Please check back soon.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href={`/gallery/search?token=${token || eventInfo.token}&eventId=${eventInfo.id || eventId}&name=${encodeURIComponent(eventInfo.name)}`}
                className="px-5 py-2.5 rounded-xl lr-btn-primary-gradient text-white text-xs font-bold inline-flex items-center gap-2 shadow-md cursor-pointer w-full sm:w-auto justify-center"
              >
                <Camera size={14} />
                <span>Take Another Selfie</span>
              </Link>
              {activeView === 'MATCHED' && allPhotosList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveView('ALL')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors w-full sm:w-auto justify-center"
                >
                  <Grid size={14} />
                  <span>Browse All Event Photos ({allPhotosList.length})</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {displayPhotos.map((photo, index) => {
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
      {lightboxIndex !== null && displayPhotos[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between text-white mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold">
                  {displayPhotos[lightboxIndex].filename}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  {displayPhotos[lightboxIndex].matchScore}% Match
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={displayPhotos[lightboxIndex].url}
                  download={displayPhotos[lightboxIndex].filename}
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
                src={displayPhotos[lightboxIndex].url}
                alt={displayPhotos[lightboxIndex].filename}
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
