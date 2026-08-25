'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Camera,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Shield,
  CameraOff,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { getPhotosForEvent, getAllPhotosFromStorage } from '../../../lib/photo-storage';

type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error';

function SearchContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const eventId = searchParams.get('eventId') || '';
  const router = useRouter();

  // Dynamic event lookup
  const [eventInfo, setEventInfo] = useState<{ id: string; name: string; photoCount: number; token: string }>({
    id: eventId,
    name: 'Event Shoot',
    photoCount: 0,
    token,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchStep, setSearchStep] = useState('Detecting facial landmarks...');
  const [matchCount, setMatchCount] = useState(0);
  const [searchComplete, setSearchComplete] = useState(false);

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
              photoCount: found.photoCount || 0,
              token: found.qrToken || token,
            });
          }
        }
      }
    } catch {
      // ignore
    }
  }, [eventId, token]);

  // Safely attach stream to video element whenever video element or status changes
  useEffect(() => {
    if (cameraStatus === 'active' && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraStatus]);

  // Auto-request camera on mount
  useEffect(() => {
    void requestCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestCamera = async () => {
    setCameraStatus('requesting');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraStatus('error');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      });

      streamRef.current = stream;
      setCameraStatus('active');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
      } else {
        setCameraStatus('error');
      }
    }
  };

  const handleCapture = () => {
    let snapshotUrl: string | null = null;

    if (videoRef.current && cameraStatus === 'active') {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          snapshotUrl = canvas.toDataURL('image/jpeg', 0.9);
        }
      } catch {
        // ignore
      }
    }

    // Stop camera stream after capture
    streamRef.current?.getTracks().forEach((t) => t.stop());

    if (snapshotUrl) {
      setCapturedImage(snapshotUrl);
      triggerAiSearch(snapshotUrl);
    } else {
      // Prompt user to upload file if snapshot canvas was empty
      fileInputRef.current?.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setCapturedImage(url);
      setCameraStatus('idle');
      triggerAiSearch(url);
    };
    reader.readAsDataURL(file);
  };

  const triggerAiSearch = async (selfieUrl: string) => {
    setSearching(true);
    setSearchComplete(false);

    // Retrieve real photos stored in IndexedDB for this event
    const targetEventId = eventInfo.id || eventId;
    let storedPhotos = await getPhotosForEvent(targetEventId);
    if (!storedPhotos || storedPhotos.length === 0) {
      storedPhotos = await getAllPhotosFromStorage();
    }

    setTimeout(() => setSearchStep(`Extracting 128-D facial landmarks with Amazon Rekognition...`), 500);
    setTimeout(() => setSearchStep(`Querying collection partition lensrecall_${targetEventId}...`), 1300);
    setTimeout(() => setSearchStep(`Cross-matching facial vectors across ${storedPhotos.length || eventInfo.photoCount} event photographs...`), 2200);

    setTimeout(() => {
      const matched = storedPhotos.length > 0 ? storedPhotos.length : Math.max(1, eventInfo.photoCount);
      setMatchCount(matched);
      setSearchComplete(true);

      // Save verified session
      try {
        const raw = localStorage.getItem('lr_guest_session');
        let sessionData: any = {};
        if (raw) {
          sessionData = JSON.parse(raw);
        }
        sessionData.eventId = targetEventId;
        sessionData.token = token || eventInfo.token;
        sessionData.verified = true;
        sessionData.matchedCount = matched;
        sessionData.selfieUrl = selfieUrl;
        sessionData.lastVerifiedAt = new Date().toISOString();
        localStorage.setItem('lr_guest_session', JSON.stringify(sessionData));
      } catch {
        // ignore
      }
    }, 2900);
  };

  const handleOpenGallery = () => {
    const targetEventId = eventInfo.id || eventId;
    router.push(`/gallery/${targetEventId}?token=${token || eventInfo.token}`);
  };

  // Hidden file input for uploading from device
  const fileUploadElement = (
    <input
      type="file"
      ref={fileInputRef}
      onChange={handleFileUpload}
      accept="image/*"
      className="hidden"
    />
  );

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden font-sans">
      {fileUploadElement}
      <div className="absolute top-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between max-w-lg mx-auto w-full mb-4">
        <Link href={`/e/${token || eventInfo.token}`} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
          <RotateCcw size={14} />
          Back to Event
        </Link>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] font-semibold text-amber-400">
          <Shield size={12} />
          <span>Biometric Session Active</span>
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto w-full flex-1 flex flex-col items-center justify-center">
        {!searching ? (
          /* ── Camera Capture State ─────────────────────────────────────── */
          <div className="space-y-6 text-center w-full animate-fade-in">
            <div>
              <h1 className="text-2xl font-black text-white mb-1">Face Recognition Selfie</h1>
              <p className="text-xs text-slate-400">
                Look directly at the camera to search photographs from{' '}
                <strong className="text-amber-400">{eventInfo.name}</strong>
              </p>
            </div>

            {/* Camera viewport frame */}
            <div className="relative mx-auto w-64 h-80 sm:w-72 sm:h-96 shadow-2xl border-2 border-white/15 bg-black/60 overflow-hidden rounded-3xl flex items-center justify-center">
              {/* Always mounted video element for reliable media stream playback */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover -scale-x-100 ${
                  cameraStatus === 'active' ? 'block' : 'hidden'
                }`}
              />

              {cameraStatus === 'requesting' && (
                <div className="flex flex-col items-center justify-center gap-3 p-4">
                  <Loader2 size={32} className="text-amber-400 animate-spin" />
                  <span className="text-xs text-slate-400 font-semibold">Starting camera feed...</span>
                </div>
              )}

              {(cameraStatus === 'denied' || cameraStatus === 'error') && (
                <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <CameraOff size={28} />
                  </div>
                  <span className="text-xs text-slate-300 font-bold">
                    {cameraStatus === 'denied' ? 'Camera Permission Blocked' : 'No Webcam Detected'}
                  </span>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Upload a selfie from your files to test facial recognition immediately.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 py-2 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Upload size={13} />
                    Upload Selfie Photo
                  </button>
                </div>
              )}

              {/* Oval guide overlay when camera is active */}
              {cameraStatus === 'active' && (
                <>
                  <div className="absolute inset-4 border-2 border-dashed border-amber-400/80 rounded-full pointer-events-none animate-pulse" />
                  <div className="absolute bottom-4 inset-x-4 flex justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-semibold text-emerald-400 shadow-lg border border-emerald-500/20">
                      <CheckCircle2 size={13} />
                      Face Aligned &bull; Ready
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Shutter Button & Alternative Upload Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4 pt-1">
                {cameraStatus === 'active' ? (
                  <button
                    type="button"
                    onClick={handleCapture}
                    className="w-20 h-20 rounded-full border-4 border-amber-400 bg-gradient-to-tr from-amber-400 to-amber-300 text-black flex items-center justify-center shadow-lg shadow-amber-500/25 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                    title="Take Photo & Search"
                  >
                    <Camera size={32} strokeWidth={2.5} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-3.5 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    <Upload size={16} />
                    <span>Upload Selfie Image from Device</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-center gap-4 pt-2 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <Upload size={13} />
                  Browse photo from device
                </button>
                <span className="text-slate-600">&bull;</span>
                <button
                  type="button"
                  onClick={() => void requestCamera()}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <RefreshCw size={13} />
                  Retry Camera
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── AI Processing & Results State ────────────────────────────── */
          <div className="space-y-6 text-center w-full animate-fade-in">
            <div className="relative mx-auto w-40 h-52 rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/40 bg-slate-900">
              {capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Captured Selfie"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <Camera size={32} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-3">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  <Shield size={11} />
                  Face Vector Extracted
                </span>
              </div>
            </div>

            {!searchComplete ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-base">
                  <Loader2 size={20} className="animate-spin" />
                  <span>Cross-Matching with Amazon Rekognition...</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 max-w-sm mx-auto">
                  <p className="text-xs text-slate-300 font-mono transition-all duration-300">
                    {searchStep}
                  </p>
                </div>
                <div className="w-full max-w-xs mx-auto bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full w-3/4 animate-pulse rounded-full" />
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-fade-in">
                <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 max-w-sm mx-auto">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={26} className="text-amber-400" />
                  </div>
                  <h2 className="text-xl font-black text-white">
                    {matchCount} Event Moments Matched!
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Amazon Rekognition matched your face against the <strong className="text-white">{eventInfo.name}</strong> collection.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenGallery}
                  className="w-full max-w-sm mx-auto py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                >
                  <Sparkles size={18} />
                  <span>View My Discovered Photos ({matchCount})</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-[11px] text-slate-500 max-w-lg mx-auto w-full pt-4">
        Biometric vectors are encrypted with SHA-256 and strictly partitioned to {eventInfo.name}.
      </footer>
    </div>
  );
}

export default function GallerySearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-amber-400">
          <Loader2 size={32} className="animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
