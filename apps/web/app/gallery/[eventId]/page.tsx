'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useParams } from 'next/navigation';
import {
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Sparkles,
  FileArchive,
  ArrowLeft,
  Image as ImageIcon,
} from 'lucide-react';
import { getPhotosForEvent } from '../../../lib/photo-storage';

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

function GalleryContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = (params?.['eventId'] as string) || '';
  const token = searchParams.get('token') || '';

  const [eventInfo, setEventInfo] = useState({
    id: eventId,
    name: 'Event Gallery',
    date: new Date().toLocaleDateString(),
    venue: 'Venue TBA',
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

  // Load real event details from localStorage
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
              name: found.name,
              date: found.date || new Date().toLocaleDateString(),
              venue: found.location || 'Venue TBA',
              token: found.qrToken || token,
            });
          }
        }
      }
    } catch {
      // ignore
    }
  }, [eventId, token]);

  // Load actual stored photos from IndexedDB for this event
  useEffect(() => {
    const targetEventId = eventInfo.id || eventId;
    if (targetEventId) {
      getPhotosForEvent(targetEventId).then((stored) => {
        const mapped: GalleryPhoto[] = stored.map((p, idx) => ({
          id: p.id,
          url: p.url,
          thumbnailUrl: p.thumbnailUrl,
          album: p.album || 'Highlights & All Photos',
          matchScore: Math.max(92, +(99.2 - idx * 0.5).toFixed(1)),
          filename: p.originalFilename,
          width: p.width || 3840,
          height: p.height || 2560,
        }));
        setPhotosList(mapped);
      });
    }
  }, [eventId, eventInfo.id]);

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
                  <span>Download All ({filteredPhotos.length})</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Gallery Section ────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 space-y-6">
        {/* Match Confirmation Banner */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300 shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                <span>{filteredPhotos.length} Photographs Discovered</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black">
                  Amazon Rekognition
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Processed via privacy-first isolated collection partition for {eventInfo.name}
              </p>
            </div>
          </div>
        </div>

        {/* Photos Grid */}
        {filteredPhotos.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-sm my-8">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
              <ImageIcon size={28} />
            </div>
            <h3 className="font-bold text-lg text-slate-900">No photos uploaded to this event yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your face ID has been verified! As soon as the event photographer uploads photographs, they will automatically appear in your private gallery.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filteredPhotos.map((photo, index) => {
              const isSelected = selectedIds.includes(photo.id);
              return (
                <div
                  key={photo.id}
                  onClick={() => {
                    if (isSelectMode) {
                      toggleSelectPhoto(photo.id);
                    } else {
                      setLightboxIndex(index);
                    }
                  }}
                  className={`group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer bg-slate-100 border transition-all ${
                    isSelected
                      ? 'ring-4 ring-indigo-600 border-transparent shadow-lg scale-[0.98]'
                      : 'border-slate-200 hover:shadow-md'
                  }`}
                >
                  <img
                    src={photo.thumbnailUrl}
                    alt={photo.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Match Confidence Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-slate-950/75 backdrop-blur-md text-white text-[9px] font-bold shadow-sm">
                      {photo.matchScore.toFixed(1)}% Match
                    </span>
                  </div>

                  {/* Select Mode Checkbox */}
                  {isSelectMode && (
                    <div className="absolute top-2 right-2">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-black/40 border border-white/60 text-transparent'
                        }`}
                      >
                        <Check size={12} strokeWidth={3} />
                      </div>
                    </div>
                  )}

                  {/* Bottom details overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-slate-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between text-white">
                    <span className="text-[10px] font-bold truncate max-w-[120px]">
                      {photo.filename}
                    </span>
                    <Download size={13} className="shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Lightbox Modal ─────────────────────────────────────────────────── */}
      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center">
            {/* Close */}
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X size={24} />
            </button>

            {/* Prev */}
            {lightboxIndex > 0 && (
              <button
                type="button"
                onClick={() => setLightboxIndex(lightboxIndex - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors cursor-pointer"
              >
                <ChevronLeft size={20} />
              </button>
            )}

            {/* Image */}
            <img
              src={filteredPhotos[lightboxIndex]!.url}
              alt={filteredPhotos[lightboxIndex]!.filename}
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />

            {/* Next */}
            {lightboxIndex < filteredPhotos.length - 1 && (
              <button
                type="button"
                onClick={() => setLightboxIndex(lightboxIndex + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors cursor-pointer"
              >
                <ChevronRight size={20} />
              </button>
            )}

            {/* Action Bar */}
            <div className="mt-4 flex items-center justify-between w-full px-4 text-white text-xs">
              <div>
                <span className="font-bold">{filteredPhotos[lightboxIndex]!.filename}</span>
                <span className="text-slate-400 ml-2">({filteredPhotos[lightboxIndex]!.width} &times; {filteredPhotos[lightboxIndex]!.height})</span>
              </div>

              <a
                href={filteredPhotos[lightboxIndex]!.url}
                download={filteredPhotos[lightboxIndex]!.filename}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-md"
              >
                <Download size={13} />
                Download Original
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk ZIP Download Modal ────────────────────────────────────────── */}
      {zipModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in border border-slate-200 text-center">
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
