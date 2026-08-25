'use client';

import { useState, useRef } from 'react';
import {
  Upload,
  Trash2,
  Download,
  X,
  Sparkles,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';

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
}

const INITIAL_PHOTOS: PhotoItem[] = [];

export default function PhotosLightManagementPage() {
  const [selectedEvent, setSelectedEvent] = useState('evt_wedding_01');
  const [selectedAlbum, setSelectedAlbum] = useState('ALL');
  const [photosList, setPhotosList] = useState<PhotoItem[]>(INITIAL_PHOTOS);
  const [activePhoto, setActivePhoto] = useState<PhotoItem | null>(null);
  const [showFaceBoxes, setShowFaceBoxes] = useState(true);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [_showQueueModal, setShowQueueModal] = useState(false);

  const filteredPhotos = photosList.filter((p) => {
    if (selectedAlbum === 'ALL') return true;
    return p.album === selectedAlbum;
  });

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newQueue: UploadQueueItem[] = Array.from(files).map((f, idx) => ({
      id: `up_${Date.now()}_${idx}`,
      name: f.name,
      sizeMB: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      progress: 0,
      status: 'QUEUED',
    }));

    setUploadQueue((prev) => [...prev, ...newQueue]);
    setShowQueueModal(true);

    newQueue.forEach((item, index) => {
      setTimeout(() => {
        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'UPLOADING', progress: 20 } : q)),
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
                url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1600',
                thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600',
                album: 'Highlights & All Photos',
                width: 4200,
                height: 2800,
                sizeMB: item.sizeMB,
                uploadedAt: 'Just now',
                status: 'READY',
                faceCount: 2,
                faces: [
                  { x: 38, y: 22, width: 14, height: 18, confidence: 99.2 },
                  { x: 54, y: 25, width: 13, height: 17, confidence: 98.6 },
                ],
              };

              setPhotosList((prev) => [newPhoto, ...prev]);
            }, 600);
          }, 500);
        }, 500);
      }, index * 300);
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
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-800 outline-none shadow-sm cursor-pointer"
          >
            <option value="evt_wedding_01">Rohan & Priya Wedding Gala</option>
            <option value="evt_conf_02">TechVision Global Summit 2026</option>
            <option value="evt_corp_03">Apex Annual Awards Night</option>
          </select>
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
          Upload up to 500 JPG, PNG, or HEIC files at once. Photos stream directly to Cloudflare R2 object storage with automated AI indexing.
        </p>
        <button
          type="button"
          className="lr-btn-primary-gradient px-5 py-2 rounded-full text-xs font-bold pointer-events-none"
        >
          Browse Files
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
                AI Indexing Synchronized
              </span>
            </div>
            <div className="text-xs text-slate-500">
              AWS Rekognition collection partition <code className="text-indigo-600 font-mono">lensrecall_evt_wedding_01</code> is active.
            </div>
          </div>
        </div>

        {uploadQueue.length > 0 && (
          <button
            type="button"
            onClick={() => setShowQueueModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Layers size={14} />
            View Upload Queue ({uploadQueue.filter((q) => q.status === 'DONE').length}/{uploadQueue.length})
          </button>
        )}
      </div>

      {/* ── Album Filter Tabs ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          {[
            'ALL',
            'Highlights & All Photos',
            'Ceremony & Phere',
            'Sangeet & Mehendi Night',
            'Reception Gala Dinner',
          ].map((alb) => (
            <button
              key={alb}
              onClick={() => setSelectedAlbum(alb)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedAlbum === alb
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
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
            Drop your high-resolution event photographs into the upload zone above to begin AI indexing with AWS Rekognition.
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
                    className="absolute border-2 border-indigo-400 rounded-lg shadow-lg pointer-events-none transition-all flex items-end justify-center"
                  >
                    <span className="bg-indigo-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded -mb-3 shadow-md">
                      {box.confidence}%
                    </span>
                  </div>
                ))}
            </div>

            {/* Sidebar Details */}
            <div className="w-full md:w-80 p-6 bg-white flex flex-col justify-between space-y-6 overflow-y-auto border-t md:border-t-0 md:border-l border-slate-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="font-bold text-sm text-slate-900 truncate">
                    Photo Inspector
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActivePhoto(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-500 block">Filename</span>
                    <span className="font-mono text-slate-900 break-all font-semibold">
                      {activePhoto.originalFilename}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Album</span>
                    <span className="font-semibold text-indigo-600">
                      {activePhoto.album}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 block">Resolution</span>
                      <span className="font-semibold text-slate-800">
                        {activePhoto.width} × {activePhoto.height}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">File Size</span>
                      <span className="font-semibold text-slate-800">
                        {activePhoto.sizeMB}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Detected Faces</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {activePhoto.faceCount} faces indexed
                    </span>
                  </div>
                </div>

                {/* Face boxes toggle */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={showFaceBoxes}
                      onChange={(e) => setShowFaceBoxes(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded"
                    />
                    Highlight Face Bounding Boxes
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-4 border-t border-slate-200">
                <a
                  href={activePhoto.url}
                  target="_blank"
                  rel="noreferrer"
                  download={activePhoto.originalFilename}
                  className="lr-btn-primary-gradient py-2.5 rounded-xl text-xs font-bold w-full flex items-center justify-center gap-2 shadow-sm text-center"
                >
                  <Download size={15} />
                  Download Original
                </a>
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(activePhoto.id)}
                  className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 size={15} />
                  Delete Photo & Faces
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
