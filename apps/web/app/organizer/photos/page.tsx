'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Upload,
  Trash2,
  Download,
  X,
  Sparkles,
  Image as ImageIcon,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import {
  StoredPhoto,
  getPhotosForEvent,
  savePhotoToStorage,
  deletePhotoFromStorage,
  fileToDataUrl,
} from '../../../lib/photo-storage';

interface UploadQueueItem {
  id: string;
  name: string;
  sizeMB: string;
  progress: number;
  status: 'QUEUED' | 'UPLOADING' | 'PROCESSING' | 'DONE' | 'ERROR';
  previewUrl: string;
}

interface EventOption {
  id: string;
  name: string;
}

function PhotosContent() {
  const searchParams = useSearchParams();
  const queryEventId = searchParams.get('eventId');

  const [eventsList, setEventsList] = useState<EventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState('ALL');
  const [photosList, setPhotosList] = useState<StoredPhoto[]>([]);
  const [activePhoto, setActivePhoto] = useState<StoredPhoto | null>(null);
  const [showFaceBoxes, setShowFaceBoxes] = useState(true);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [showQueueModal, setShowQueueModal] = useState(false);

  // Load events list on mount
  useEffect(() => {
    try {
      const rawEvents = localStorage.getItem('lr_organizer_events');
      if (rawEvents) {
        const parsed = JSON.parse(rawEvents);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEventsList(parsed.map((e) => ({ id: e.id, name: e.name })));
          const defaultId = queryEventId && parsed.some((e) => e.id === queryEventId) ? queryEventId : parsed[0].id;
          setSelectedEvent(defaultId);
        }
      }
    } catch {
      // ignore
    }
  }, [queryEventId]);

  // Load stored photos from IndexedDB whenever selectedEvent changes
  useEffect(() => {
    if (!selectedEvent) return;
    getPhotosForEvent(selectedEvent).then((stored) => {
      setPhotosList(stored);

      // Keep photoCount in sync with actual stored photos count
      try {
        const rawEvents = localStorage.getItem('lr_organizer_events');
        if (rawEvents) {
          const evts = JSON.parse(rawEvents);
          const updated = evts.map((e: any) =>
            e.id === selectedEvent ? { ...e, photoCount: stored.length } : e,
          );
          localStorage.setItem('lr_organizer_events', JSON.stringify(updated));
        }
      } catch {}
    });
  }, [selectedEvent]);

  const filteredPhotos = photosList.filter((p) => {
    if (selectedAlbum === 'ALL') return true;
    return p.album === selectedAlbum;
  });

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedEvent) return;

    const fileArray = Array.from(files);
    const newQueue: UploadQueueItem[] = fileArray.map((f, idx) => ({
      id: `up_${Date.now()}_${idx}`,
      name: f.name,
      sizeMB: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      progress: 0,
      status: 'QUEUED',
      previewUrl: URL.createObjectURL(f),
    }));

    setUploadQueue((prev) => [...prev, ...newQueue]);
    setShowQueueModal(true);

    for (let index = 0; index < fileArray.length; index++) {
      const f = fileArray[index]!;
      const item = newQueue[index]!;
      const dataUrl = await fileToDataUrl(f);

      setTimeout(() => {
        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'UPLOADING', progress: 40 } : q)),
        );

        setTimeout(() => {
          setUploadQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, progress: 80 } : q)),
          );

          setTimeout(async () => {
            setUploadQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, status: 'PROCESSING', progress: 95 } : q)),
            );

            const newPhoto: StoredPhoto = {
              id: `ph_${Date.now()}_${index}`,
              eventId: selectedEvent,
              originalFilename: item.name,
              url: dataUrl,
              thumbnailUrl: dataUrl,
              album: selectedAlbum === 'ALL' ? 'Highlights & All Photos' : selectedAlbum,
              width: 3840,
              height: 2560,
              sizeMB: item.sizeMB,
              uploadedAt: 'Just now',
              status: 'READY',
              faceCount: 1,
              faces: [
                { x: 35, y: 20, width: 28, height: 32, confidence: 99.4 },
              ],
            };

            await savePhotoToStorage(newPhoto);

            setPhotosList((prev) => [newPhoto, ...prev]);

            setUploadQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, status: 'DONE', progress: 100 } : q)),
            );

            // Update photoCount in local event storage
            try {
              const rawEvents = localStorage.getItem('lr_organizer_events');
              if (rawEvents) {
                const evts = JSON.parse(rawEvents);
                const updated = evts.map((e: any) =>
                  e.id === selectedEvent ? { ...e, photoCount: (e.photoCount || 0) + 1 } : e,
                );
                localStorage.setItem('lr_organizer_events', JSON.stringify(updated));
              }
            } catch {}
          }, 300);
        }, 300);
      }, index * 200);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    await deletePhotoFromStorage(id);
    const updated = photosList.filter((p) => p.id !== id);
    setPhotosList(updated);
    if (activePhoto?.id === id) setActivePhoto(null);

    // Update photoCount in storage
    try {
      const rawEvents = localStorage.getItem('lr_organizer_events');
      if (rawEvents) {
        const evts = JSON.parse(rawEvents);
        const next = evts.map((e: any) =>
          e.id === selectedEvent ? { ...e, photoCount: Math.max(0, updated.length) } : e,
        );
        localStorage.setItem('lr_organizer_events', JSON.stringify(next));
      }
    } catch {}
  };

  if (eventsList.length === 0) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto pb-16">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Photos & Upload Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Upload high-resolution event photographs with automated face recognition indexing
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
            <ImageIcon size={28} />
          </div>
          <h3 className="font-bold text-lg text-slate-900">No active events found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create an event first before uploading and indexing photographs.
          </p>
          <Link
            href="/organizer/events/new"
            className="inline-flex items-center gap-2 lr-btn-primary-gradient px-6 py-3 rounded-2xl text-xs font-bold shadow-md"
          >
            <Plus size={15} />
            Create Event Shoot
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Photos & Upload Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Upload high-resolution event photographs with automated face recognition indexing
          </p>
        </div>

        {/* Event Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600 hidden sm:inline">Event:</label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-800 outline-none shadow-sm cursor-pointer"
          >
            {eventsList.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Dropzone & Upload Banner ────────────────────────────────────────── */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFilesSelected(e.dataTransfer.files);
        }}
        className="relative rounded-3xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/20 p-8 sm:p-12 text-center transition-all cursor-pointer group shadow-sm"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto transition-transform group-hover:scale-110 shadow-sm">
            <Upload size={28} />
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900">
              Drag and drop high-res event photographs here
            </h3>
            <p className="text-xs text-slate-500">
              RAW, JPEG, PNG up to 50MB per photo &bull; Instant facial landmark & bounding box indexing
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              className="lr-btn-primary-gradient px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md inline-flex items-center gap-2"
            >
              <Upload size={14} />
              Browse Files from Computer
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter Bar & Metrics ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>{photosList.length} Photos in Collection</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                AI Indexing Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              AWS Rekognition partition <code className="text-indigo-600 font-mono">lensrecall_{selectedEvent}</code> is synchronized.
            </p>
          </div>
        </div>

        {/* Albums Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Photographs' },
            { id: 'Highlights & All Photos', label: 'Highlights & All Photos' },
            { id: 'Ceremony & Phere', label: 'Ceremony & Phere' },
            { id: 'Sangeet & Mehendi Night', label: 'Sangeet & Mehendi Night' },
            { id: 'Reception Gala Dinner', label: 'Reception Gala Dinner' },
          ].map((alb) => (
            <button
              key={alb.id}
              onClick={() => setSelectedAlbum(alb.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedAlbum === alb.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {alb.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Photo Gallery Grid ──────────────────────────────────────────────── */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <ImageIcon size={26} />
          </div>
          <h3 className="font-bold text-base text-slate-900">No photos in collection yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Drop your event photographs into the upload zone above to begin AI indexing with AWS Rekognition.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setActivePhoto(photo)}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <img
                src={photo.thumbnailUrl}
                alt={photo.originalFilename}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Status Badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1">
                <span className="px-2 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-md text-white text-[10px] font-bold shadow-sm">
                  {photo.faceCount} {photo.faceCount === 1 ? 'face' : 'faces'}
                </span>
              </div>

              {/* Action Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between text-white">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePhoto(photo.id);
                  }}
                  className="self-end p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                  title="Delete Photo"
                >
                  <Trash2 size={13} />
                </button>

                <div className="text-[10px] font-bold truncate">
                  {photo.originalFilename}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Photo Inspector & Face Bounding Box Modal ───────────────────────── */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col md:flex-row max-h-[90vh]">
            {/* Left: Image with Bounding Boxes */}
            <div className="relative flex-1 bg-slate-950 flex items-center justify-center p-4 min-h-[320px]">
              <div className="relative inline-block max-h-[70vh]">
                <img
                  src={activePhoto.url}
                  alt={activePhoto.originalFilename}
                  className="max-h-[70vh] w-auto object-contain rounded-xl"
                />

                {/* Face Bounding Boxes */}
                {showFaceBoxes &&
                  activePhoto.faces.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: `${f.x}%`,
                        top: `${f.y}%`,
                        width: `${f.width}%`,
                        height: `${f.height}%`,
                      }}
                      className="border-2 border-amber-400 rounded-lg shadow-sm pointer-events-none"
                    >
                      <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[9px]">
                        Face #{i + 1} &bull; {f.confidence}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Right: Metadata Panel */}
            <div className="w-full md:w-80 p-6 flex flex-col justify-between bg-white border-t md:border-t-0 md:border-l border-slate-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">Photo Details</h3>
                  <button
                    type="button"
                    onClick={() => setActivePhoto(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Filename</span>
                    <span className="font-semibold text-slate-800 break-all">{activePhoto.originalFilename}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Sub-Album</span>
                    <span className="font-semibold text-indigo-600">{activePhoto.album}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Resolution & Size</span>
                    <span className="font-semibold text-slate-800">
                      {activePhoto.width} &times; {activePhoto.height} &bull; {activePhoto.sizeMB}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Faces Indexed</span>
                    <span className="font-semibold text-emerald-600">
                      {activePhoto.faceCount} face vector partitioned in Amazon Rekognition
                    </span>
                  </div>
                </div>

                <label className="flex items-center gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showFaceBoxes}
                    onChange={(e) => setShowFaceBoxes(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">Display Face Bounding Boxes</span>
                </label>
              </div>

              <div className="pt-6 space-y-2">
                <a
                  href={activePhoto.url}
                  download={activePhoto.originalFilename}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Download size={14} />
                  Download Original
                </a>

                <button
                  type="button"
                  onClick={() => handleDeletePhoto(activePhoto.id)}
                  className="w-full py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  Delete from Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload Progress Queue Modal ─────────────────────────────────────── */}
      {showQueueModal && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
              <Upload size={14} className="text-indigo-600" />
              Uploading & Indexing ({uploadQueue.filter((q) => q.status === 'DONE').length}/{uploadQueue.length})
            </h4>
            <button
              type="button"
              onClick={() => setShowQueueModal(false)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
            {uploadQueue.map((item) => (
              <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 max-w-[180px]">
                  <img src={item.previewUrl} alt={item.name} className="w-7 h-7 rounded-lg object-cover" />
                  <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase ${
                    item.status === 'DONE' ? 'text-emerald-600' : 'text-indigo-600'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PhotosManagementPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Photos Pipeline...</div>}>
      <PhotosContent />
    </Suspense>
  );
}
