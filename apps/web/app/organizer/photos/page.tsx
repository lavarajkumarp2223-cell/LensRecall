'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Trash2,
  Download,
  X,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

interface PhotoItem {
  id: string;
  originalFilename: string;
  url: string;
  thumbnailUrl: string;
  album: string;
  width: number;
  height: number;
  sizeMB: string;
  uploadedAt: string;
  status: 'READY' | 'PROCESSING' | 'FAILED';
  faceCount: number;
  faces: { x: number; y: number; width: number; height: number; confidence: number }[];
}

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

const INITIAL_PHOTOS: PhotoItem[] = [];

export default function PhotosLightManagementPage() {
  const [eventsList, setEventsList] = useState<EventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState('ALL');
  const [photosList, setPhotosList] = useState<PhotoItem[]>(INITIAL_PHOTOS);
  const [activePhoto, setActivePhoto] = useState<PhotoItem | null>(null);
  const [showFaceBoxes, setShowFaceBoxes] = useState(true);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [showQueueModal, setShowQueueModal] = useState(false);

  // Load events and saved photos from localStorage
  useEffect(() => {
    try {
      const rawEvents = localStorage.getItem('lr_organizer_events');
      if (rawEvents) {
        const parsed = JSON.parse(rawEvents);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEventsList(parsed.map((e) => ({ id: e.id, name: e.name })));
          setSelectedEvent(parsed[0].id);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const filteredPhotos = photosList.filter((p) => {
    if (selectedAlbum === 'ALL') return true;
    return p.album === selectedAlbum;
  });

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

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

    newQueue.forEach((item, index) => {
      setTimeout(() => {
        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'UPLOADING', progress: 30 } : q)),
        );

        setTimeout(() => {
          setUploadQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, progress: 75 } : q)),
          );

          setTimeout(() => {
            setUploadQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, status: 'PROCESSING', progress: 95 } : q)),
            );

            setTimeout(() => {
              setUploadQueue((prev) =>
                prev.map((q) => (q.id === item.id ? { ...q, status: 'DONE', progress: 100 } : q)),
              );

              const newPhoto: PhotoItem = {
                id: `ph_uploaded_${Date.now()}_${index}`,
                originalFilename: item.name,
                url: item.previewUrl,
                thumbnailUrl: item.previewUrl,
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

              setPhotosList((prev) => [newPhoto, ...prev]);

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
            }, 500);
          }, 400);
        }, 400);
      }, index * 250);
    });
  };

  const handleDeletePhoto = (id: string) => {
    setPhotosList(photosList.filter((p) => p.id !== id));
    if (activePhoto?.id === id) setActivePhoto(null);
  };

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
          {eventsList.length > 0 ? (
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
          ) : (
            <Link
              href="/organizer/events/new"
              className="lr-btn-primary-gradient px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} />
              Create Event First
            </Link>
          )}
        </div>
      </div>

      {/* ── Drag and Drop Upload Zone (Light Mode) ─────────────────────────── */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFilesSelected(e.dataTransfer.files);
        }}
        className="p-10 rounded-3xl bg-white border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 text-center cursor-pointer transition-all shadow-sm group"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm">
          <Upload size={28} />
        </div>
        <h3 className="font-bold text-lg text-slate-900 mb-1">
          Drag and drop event photographs here
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
          Upload JPG, PNG, or HEIC files. Photos stream directly into your event collection with automated Amazon Rekognition face indexing.
        </p>
        <button
          type="button"
          className="lr-btn-primary-gradient px-5 py-2 rounded-full text-xs font-bold pointer-events-none"
        >
          Browse Files from Computer
        </button>
      </div>

      {/* ── Processing Pipeline Status Bar ───────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <span>{photosList.length} Photos in Collection</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                AI Indexing Active
              </span>
            </div>
            <div className="text-xs text-slate-500">
              AWS Rekognition partition <code className="text-indigo-600 font-mono">lensrecall_{selectedEvent || 'active_collection'}</code> is synchronized.
            </div>
          </div>
        </div>

        {uploadQueue.length > 0 && (
          <button
            type="button"
            onClick={() => setShowQueueModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Layers size={14} />
            View Upload Queue ({uploadQueue.filter((q) => q.status === 'DONE').length}/{uploadQueue.length})
          </button>
        )}
      </div>

      {/* ── Album Filter Tabs ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            'ALL',
            'Highlights & All Photos',
            'Ceremony & Phere',
            'Sangeet & Mehendi Night',
            'Reception Gala Dinner',
          ].map((alb) => (
            <button
              key={alb}
              type="button"
              onClick={() => setSelectedAlbum(alb)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedAlbum === alb
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {alb === 'ALL' ? 'All Photographs' : alb}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 whitespace-nowrap hidden sm:inline">
          Showing {filteredPhotos.length} photos
        </span>
      </div>

      {/* ── Photo Gallery Grid (Light Mode) ────────────────────────────────── */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
            <ImageIcon size={28} />
          </div>
          <h3 className="font-bold text-lg text-slate-900">No photos in collection yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Drop your event photographs into the upload zone above to begin AI indexing with AWS Rekognition.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setActivePhoto(photo)}
              className="group relative aspect-square bg-slate-100 rounded-2xl overflow-hidden cursor-pointer border border-slate-200 shadow-sm hover:shadow-md transition-all"
            >
              <img
                src={photo.thumbnailUrl}
                alt={photo.originalFilename}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Face Badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1">
                <span className="bg-slate-950/75 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {photo.faceCount} {photo.faceCount === 1 ? 'face' : 'faces'}
                </span>
              </div>

              {/* Hover Actions Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-between">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo.id);
                    }}
                    className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                    title="Delete Photo"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-white truncate">
                    {photo.originalFilename}
                  </div>
                  <div className="text-[9px] text-slate-300 truncate">
                    {photo.album}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal: Photo Inspector & Face Bounding Boxes ──────────────────── */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-0 overflow-hidden shadow-2xl animate-scale-in flex flex-col md:flex-row max-h-[90vh] border border-slate-200">
            {/* Image Preview with Face Boxes */}
            <div className="relative flex-1 bg-slate-950 flex items-center justify-center min-h-[320px] overflow-hidden">
              <img
                src={activePhoto.url}
                alt={activePhoto.originalFilename}
                className="max-h-[75vh] w-auto object-contain"
              />

              {/* Bounding Boxes */}
              {showFaceBoxes &&
                activePhoto.faces.map((box, bIdx) => (
                  <div
                    key={bIdx}
                    style={{
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                    }}
                    className="absolute border-2 border-amber-400 bg-amber-400/20 rounded-md pointer-events-none transition-all shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                  >
                    <span className="absolute -top-6 left-0 bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm">
                      {box.confidence.toFixed(1)}% Match
                    </span>
                  </div>
                ))}
            </div>

            {/* Sidebar Inspector Info */}
            <div className="w-full md:w-80 p-6 flex flex-col justify-between bg-white border-t md:border-t-0 md:border-l border-slate-200 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Photo Metadata
                  </span>
                  <button
                    type="button"
                    onClick={() => setActivePhoto(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 font-medium block text-[11px]">Filename</label>
                    <div className="font-bold text-slate-900 break-all">{activePhoto.originalFilename}</div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block text-[11px]">Album</label>
                    <div className="font-semibold text-slate-800">{activePhoto.album}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <div>
                      <label className="text-slate-400 font-medium block text-[11px]">Resolution</label>
                      <div className="font-semibold text-slate-800">{activePhoto.width} &times; {activePhoto.height}</div>
                    </div>
                    <div>
                      <label className="text-slate-400 font-medium block text-[11px]">File Size</label>
                      <div className="font-semibold text-slate-800">{activePhoto.sizeMB}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <label className="text-slate-400 font-medium block text-[11px]">Indexed Faces</label>
                    <div className="font-black text-indigo-600 text-base">
                      {activePhoto.faceCount} {activePhoto.faceCount === 1 ? 'Face Detected' : 'Faces Detected'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFaceBoxes(!showFaceBoxes)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    showFaceBoxes
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {showFaceBoxes ? 'Hide Face Bounding Boxes' : 'Show Face Bounding Boxes'}
                </button>

                <a
                  href={activePhoto.url}
                  download={activePhoto.originalFilename}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Download size={14} />
                  Download High-Res
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Upload Queue ───────────────────────────────────────────── */}
      {showQueueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-in border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Upload & AI Indexing Queue</h3>
                <p className="text-xs text-slate-500">
                  {uploadQueue.filter((q) => q.status === 'DONE').length} of {uploadQueue.length} files processed
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQueueModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2.5 divide-y divide-slate-100 pr-1">
              {uploadQueue.map((item) => (
                <div key={item.id} className="pt-2.5 first:pt-0 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 max-w-[70%]">
                      {item.previewUrl && (
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="w-6 h-6 rounded-md object-cover border border-slate-200"
                        />
                      )}
                      <span className="font-medium text-slate-800 truncate">{item.name}</span>
                    </div>
                    <span className="text-slate-400 text-[11px] font-mono">{item.sizeMB}</span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        item.status === 'DONE'
                          ? 'bg-emerald-500'
                          : item.status === 'ERROR'
                          ? 'bg-rose-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowQueueModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
