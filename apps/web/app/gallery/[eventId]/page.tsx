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
} from 'lucide-react';

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

const EVENT_METADATA: Record<string, { name: string; date: string; venue: string; token: string }> = {
  evt_wedding_01: { name: 'Rohan & Priya Wedding Gala', date: 'August 24, 2026', venue: 'The Taj West End, Bangalore', token: 'qr_rohan_priya_2026' },
  evt_conf_02: { name: 'TechVision Global Summit 2026', date: 'August 20, 2026', venue: 'BIEC Exhibition Centre, Bangalore', token: 'qr_techvision_2026' },
  evt_corp_03: { name: 'Apex Annual Awards Night', date: 'August 15, 2026', venue: 'Grand Ballroom, ITC Gardenia', token: 'qr_apex_awards_2026' },
};

const DISCOVERED_PHOTOS: GalleryPhoto[] = [
  {
    id: 'gal_01',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=60',
    album: 'Ceremony & Phere',
    matchScore: 99.4,
    filename: 'DSC_4920_Rohan_Priya.jpg',
    width: 4200,
    height: 2800,
  },
  {
    id: 'gal_02',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=60',
    album: 'Sangeet & Mehendi Night',
    matchScore: 98.8,
    filename: 'DSC_4921_Grand_Entrance.jpg',
    width: 3840,
    height: 2560,
  },
  {
    id: 'gal_03',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=60',
    album: 'Reception Gala Dinner',
    matchScore: 98.2,
    filename: 'DSC_4925_Gala_Toast.jpg',
    width: 4000,
    height: 2667,
  },
  {
    id: 'gal_04',
    url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&auto=format&fit=crop&q=60',
    album: 'Highlights & All Photos',
    matchScore: 97.5,
    filename: 'DSC_4930_Family_Portrait.jpg',
    width: 4500,
    height: 3000,
  },
  {
    id: 'gal_05',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=60',
    album: 'Sangeet & Mehendi Night',
    matchScore: 99.8,
    filename: 'DSC_4938_Stage_Performance.jpg',
    width: 3600,
    height: 2400,
  },
  {
    id: 'gal_06',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=60',
    album: 'Reception Gala Dinner',
    matchScore: 96.9,
    filename: 'DSC_4942_Cocktail_Party.jpg',
    width: 3900,
    height: 2600,
  },
  {
    id: 'gal_07',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=60',
    album: 'Ceremony & Phere',
    matchScore: 95.4,
    filename: 'DSC_4945_Varmala_Moment.jpg',
    width: 4100,
    height: 2733,
  },
  {
    id: 'gal_08',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=60',
    album: 'Highlights & All Photos',
    matchScore: 94.8,
    filename: 'DSC_4950_Dance_Floor.jpg',
    width: 4200,
    height: 2800,
  },
];

function GalleryContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = (params?.['eventId'] as string) || 'evt_wedding_01';
  const token = searchParams.get('token') || EVENT_METADATA[eventId]?.token || 'qr_rohan_priya_2026';
  const eventInfo = EVENT_METADATA[eventId] ?? {
    name: 'Event Gallery',
    date: 'August 2026',
    venue: 'Venue',
    token,
  };

  const [selectedAlbum, setSelectedAlbum] = useState('ALL');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Lightbox modal state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Bulk ZIP download modal state
  const [zipModalOpen, setZipModalOpen] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipReady, setZipReady] = useState(false);

  const filteredPhotos = DISCOVERED_PHOTOS.filter((p) => {
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

  const handleSelectAll = () => {
    if (selectedIds.length === filteredPhotos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPhotos.map((p) => p.id));
    }
  };

  const handleStartZipDownload = () => {
    setZipModalOpen(true);
    setZipReady(false);
    setZipProgress(0);

    // Simulate BullMQ Worker ZIP generation progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setZipProgress(100);
        setTimeout(() => setZipReady(true), 400);
      } else {
        setZipProgress(progress);
      }
    }, 180);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : filteredPhotos.length - 1));
      }
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev! < filteredPhotos.length - 1 ? prev! + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, filteredPhotos.length]);

  return (
    <div className="min-h-screen bg-lr-bg text-lr-text pb-20">
      {/* ── Top Navbar ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-lr-surface/85 backdrop-blur-md border-b border-lr-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/e/${token}`}
              className="p-2 rounded-lg text-lr-text-muted hover:text-lr-text hover:bg-lr-surface-2 transition-colors"
              title="Back to Event"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-lr-text leading-tight truncate max-w-[200px] sm:max-w-md">
                {eventInfo.name}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-lr-accent font-semibold">
                <Sparkles size={11} />
                <span>{DISCOVERED_PHOTOS.length} Personal Moments Found • Only You</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                setSelectedIds([]);
              }}
              className={`lr-btn lr-btn-sm text-xs ${
                isSelectMode ? 'bg-lr-surface-3 text-lr-accent border-lr-accent' : 'lr-btn-secondary'
              }`}
            >
              {isSelectMode ? 'Cancel Selection' : 'Select Photos'}
            </button>

            <button
              type="button"
              onClick={handleStartZipDownload}
              className="lr-btn lr-btn-primary lr-btn-sm flex items-center gap-1.5 text-xs font-bold shadow-accent-sm"
            >
              <Download size={14} />
              <span className="hidden sm:inline">
                {isSelectMode && selectedIds.length > 0
                  ? `Download Selected (${selectedIds.length})`
                  : `Download All (${DISCOVERED_PHOTOS.length})`}
              </span>
              <span className="sm:hidden">Download</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Gallery Content ─────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Album Filters & Select All Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-lr-border pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              'ALL',
              'Ceremony & Phere',
              'Sangeet & Mehendi Night',
              'Reception Gala Dinner',
              'Highlights & All Photos',
            ].map((alb) => (
              <button
                key={alb}
                onClick={() => setSelectedAlbum(alb)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedAlbum === alb
                    ? 'bg-lr-accent text-lr-bg font-bold shadow-sm'
                    : 'bg-lr-surface text-lr-text-muted hover:text-lr-text hover:bg-lr-surface-2'
                }`}
              >
                {alb === 'ALL' ? `All Moments (${DISCOVERED_PHOTOS.length})` : alb}
              </button>
            ))}
          </div>

          {isSelectMode && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-lr-text-muted">
                {selectedIds.length} of {filteredPhotos.length} selected
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-lr-accent font-semibold hover:underline"
              >
                {selectedIds.length === filteredPhotos.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          )}
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredPhotos.map((photo, idx) => {
            const isSelected = selectedIds.includes(photo.id);

            return (
              <div
                key={photo.id}
                onClick={() => {
                  if (isSelectMode) {
                    toggleSelectPhoto(photo.id);
                  } else {
                    setLightboxIndex(idx);
                  }
                }}
                className={`lr-photo-thumb group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                  isSelected ? 'border-lr-accent ring-4 ring-lr-accent/30 scale-98' : 'border-transparent hover:border-lr-border'
                }`}
              >
                <img
                  src={photo.thumbnailUrl}
                  alt={photo.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Match Score Badge */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="lr-badge lr-badge-accent text-[10px] font-bold shadow-md backdrop-blur-md">
                    {photo.matchScore}% Match
                  </span>
                </div>

                {/* Multi-Select Checkbox */}
                {isSelectMode && (
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isSelected
                          ? 'bg-lr-accent border-lr-accent text-black font-bold'
                          : 'bg-black/60 border-white/60 text-transparent'
                      }`}
                    >
                      <Check size={14} strokeWidth={3} />
                    </div>
                  </div>
                )}

                {/* Hover Overlay */}
                {!isSelectMode && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                    <div className="flex justify-end gap-1.5">
                      <a
                        href={photo.url}
                        target="_blank"
                        rel="noreferrer"
                        download={photo.filename}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-xl bg-black/60 hover:bg-lr-accent hover:text-black text-white backdrop-blur-md transition-colors"
                        title="Instant Download"
                      >
                        <Download size={14} />
                      </a>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-white truncate">
                        {photo.filename}
                      </div>
                      <div className="text-[10px] text-neutral-300 truncate">
                        {photo.album}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* ── Modal: Fullscreen Lightbox Viewer ────────────────────────────── */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex flex-col justify-between p-4 sm:p-6 animate-fade-in select-none">
          {/* Lightbox Topbar */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <span className="lr-badge lr-badge-accent text-xs font-bold">
                {filteredPhotos[lightboxIndex]!.matchScore}% Match
              </span>
              <span className="text-xs text-neutral-400 font-medium">
                {filteredPhotos[lightboxIndex]!.album} • {lightboxIndex + 1} of {filteredPhotos.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={filteredPhotos[lightboxIndex]!.url}
                target="_blank"
                rel="noreferrer"
                download={filteredPhotos[lightboxIndex]!.filename}
                className="lr-btn lr-btn-primary lr-btn-sm flex items-center gap-1.5 text-xs font-bold"
              >
                <Download size={14} />
                Download Original ({filteredPhotos[lightboxIndex]!.width} × {filteredPhotos[lightboxIndex]!.height})
              </a>

              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close (Esc)"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Centered Image with Navigation Arrows */}
          <div className="relative flex-1 flex items-center justify-center max-h-[80vh] my-auto">
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev! > 0 ? prev! - 1 : filteredPhotos.length - 1,
                )
              }
              className="absolute left-2 sm:left-6 z-10 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-colors"
              title="Previous"
            >
              <ChevronLeft size={24} />
            </button>

            <img
              src={filteredPhotos[lightboxIndex]!.url}
              alt={filteredPhotos[lightboxIndex]!.filename}
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl animate-scale-in"
            />

            <button
              type="button"
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev! < filteredPhotos.length - 1 ? prev! + 1 : 0,
                )
              }
              className="absolute right-2 sm:right-6 z-10 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-colors"
              title="Next"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Lightbox Footer */}
          <div className="text-center text-xs text-neutral-400 z-10">
            {filteredPhotos[lightboxIndex]!.filename} • Shot on Sony A7 IV • ISO 400 • f/2.8
          </div>
        </div>
      )}

      {/* ── Modal: Bulk ZIP Download Progress ─────────────────────────────── */}
      {zipModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="lr-card max-w-md w-full p-8 text-center space-y-6 shadow-2xl animate-scale-in bg-lr-surface border-lr-border">
            <div className="w-14 h-14 rounded-2xl bg-lr-accent-dim text-lr-accent flex items-center justify-center mx-auto shadow-md">
              <FileArchive size={28} />
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-lg text-lr-text">
                {zipReady ? 'Your ZIP Package is Ready!' : 'Packaging High-Resolution ZIP...'}
              </h3>
              <p className="text-xs text-lr-text-muted">
                {zipReady
                  ? 'All original high-resolution photos have been packaged without compression.'
                  : 'Compressing 18 full-resolution photographs into an archive...'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="lr-progress">
                <div className="lr-progress-fill" style={{ width: `${zipProgress}%` }} />
              </div>
              <div className="text-right text-[11px] font-mono text-lr-text-subtle">
                {zipProgress}% Complete
              </div>
            </div>

            {/* Ready Actions */}
            {zipReady && (
              <div className="space-y-3 pt-2 animate-fade-up">
                <a
                  href="https://images.unsplash.com/photo-1519741497674-611481863552?w=1600"
                  download="Rohan_Priya_Wedding_My_Moments.zip"
                  className="lr-btn lr-btn-primary w-full flex items-center justify-center gap-2 shadow-accent-sm font-bold"
                >
                  <Download size={16} />
                  Download ZIP (124 MB)
                </a>
                <p className="text-[10px] text-lr-text-subtle">
                  This download link is securely signed and valid for 24 hours.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setZipModalOpen(false)}
              className="text-xs text-lr-text-muted hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GuestPersonalGalleryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-lr-bg flex items-center justify-center text-lr-text">Loading personalized gallery...</div>}>
      <GalleryContent />
    </Suspense>
  );
}

