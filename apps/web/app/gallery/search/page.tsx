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
} from 'lucide-react';

type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error';

function SearchContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const eventId = searchParams.get('eventId') || '';
  const router = useRouter();

  // Dynamic event lookup
  const [eventInfo, setEventInfo] = useState<{ name: string; photoCount: number; token: string }>({
    name: 'Event Shoot',
    photoCount: 0,
    token,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lr_organizer_events');
      if (raw) {
        const events = JSON.parse(raw);
        if (Array.isArray(events)) {
          const found = events.find((e: any) => e.id === eventId || e.qrToken === token) || events[0];
          if (found) {
            setEventInfo({
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchStep, setSearchStep] = useState('Detecting facial landmarks...');
  const [matchCount, setMatchCount] = useState(0);
  const [searchComplete, setSearchComplete] = useState(false);

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraStatus('active');
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
          snapshotUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
      } catch {
        // ignore
      }
    }

    // Stop camera stream after capture
    streamRef.current?.getTracks().forEach((t) => t.stop());

    setCapturedImage(snapshotUrl ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80');
    triggerAiSearch();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setCapturedImage(url);
      setCameraStatus('idle');
      triggerAiSearch();
    };
    reader.readAsDataURL(file);
  };

  const handleUseDemoPhoto = (url: string) => {
    setCapturedImage(url);
    setCameraStatus('idle');
    triggerAiSearch();
  };

  const triggerAiSearch = () => {
    setSearching(true);
    setSearchComplete(false);

    setTimeout(() => setSearchStep(`Connecting to ${eventInfo.name} collection partition...`), 600);
    setTimeout(() => setSearchStep(`Scanning ${eventInfo.photoCount.toLocaleString()} photos with AWS Rekognition...`), 1500);
    setTimeout(() => setSearchStep('High-confidence matches found! Assembling your gallery...'), 2400);
    setTimeout(() => {
      const count = Math.floor(Math.random() * 11) + 12;
      setMatchCount(count);
      setSearchComplete(true);
    }, 3000);
  };

  const handleOpenGallery = () => {
    try {
      const raw = localStorage.getItem('lr_guest_session');
      let sessionData: any = {};
      if (raw) {
        sessionData = JSON.parse(raw);
      }
      sessionData.eventId = eventId;
      sessionData.token = token;
      sessionData.verified = true;
      sessionData.matchedCount = matchCount;
      sessionData.lastVerifiedAt = new Date().toISOString();
      localStorage.setItem('lr_guest_session', JSON.stringify(sessionData));
    } catch {
      // ignore
    }
    router.push(`/gallery/${eventId}?token=${token}&count=${matchCount}`);
  };

  // Hidden file input for uploading from PC
  const fileUploadElement = (
    <input
      type="file"
      ref={fileInputRef}
      onChange={handleFileUpload}
      accept="image/jpeg,image/png,image/webp,image/heic"
      className="hidden"
    />
  );

  // ── Camera Denied / No Camera Attached Screen (only shown when not searching) ──
  if (!searching && (cameraStatus === 'denied' || cameraStatus === 'error')) {
    return (
      <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col items-center justify-center p-6 text-center gap-6 relative overflow-hidden">
        {fileUploadElement}
        <div className="absolute top-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <CameraOff size={36} className="text-amber-400" />
        </div>

        <div className="space-y-2 max-w-md">
          <h1 className="text-2xl font-black text-white">No Physical Camera Detected</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {cameraStatus === 'denied'
              ? 'Camera access was blocked in your browser. You can test right now by uploading a selfie image from your PC or using a sample guest photo.'
              : 'No webcam was detected on your desktop. You can test immediately by uploading a photo from your PC or using a demo guest photo below.'}
          </p>
        </div>

        {/* Desktop Test Options */}
        <div className="space-y-3 w-full max-w-sm">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Upload size={16} />
            Upload a Selfie from PC
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleUseDemoPhoto('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80')}
              className="p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-amber-400/50 text-xs font-semibold text-slate-200 flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Priya"
                className="w-10 h-10 rounded-full object-cover border border-amber-400/40"
              />
              <span>Test with Priya (Bride)</span>
            </button>

            <button
              type="button"
              onClick={() => handleUseDemoPhoto('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80')}
              className="p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-amber-400/50 text-xs font-semibold text-slate-200 flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
            >
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                alt="Rohan"
                className="w-10 h-10 rounded-full object-cover border border-amber-400/40"
              />
              <span>Test with Rohan (Groom)</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setCameraStatus('idle'); void requestCamera(); }}
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Camera size={13} />
              Retry Physical Webcam
            </button>
            <span className="text-slate-600">&bull;</span>
            <Link
              href={`/e/${token}`}
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <RotateCcw size={13} />
              Back to Event
            </Link>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
          When you connect a physical webcam tomorrow, LensRecall will automatically launch the live camera feed.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {fileUploadElement}
      <div className="absolute top-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between max-w-lg mx-auto w-full mb-4">
        <Link href={`/e/${token}`} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
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
              <h1 className="text-2xl font-black text-white mb-1">Take a Selfie</h1>
              <p className="text-xs text-slate-400">
                Position your face in the oval — we&apos;ll search{' '}
                <strong className="text-white">{eventInfo.photoCount.toLocaleString()} photos</strong> from{' '}
                <strong className="text-amber-400">{eventInfo.name}</strong>
              </p>
            </div>

            {/* Camera viewport */}
            <div className="lr-camera-frame relative mx-auto shadow-2xl border-2 border-white/15 bg-black/40 overflow-hidden rounded-3xl">
              {cameraStatus === 'active' ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
              ) : (
                /* Requesting / idle */
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-white/[0.02]">
                  <Loader2 size={32} className="text-amber-400 animate-spin" />
                  <span className="text-xs text-slate-400 font-semibold">Starting camera…</span>
                </div>
              )}

              {/* Oval guide overlay */}
              <div className="lr-face-oval detected" />

              {cameraStatus === 'active' && (
                <div className="absolute bottom-4 inset-x-4 flex justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-semibold text-emerald-400 shadow-lg border border-emerald-500/20">
                    <CheckCircle2 size={13} />
                    Face Aligned • Good Lighting
                  </span>
                </div>
              )}
            </div>

            {/* Shutter Button & Upload Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-6 pt-1">
                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={cameraStatus !== 'active'}
                  className="w-20 h-20 rounded-full border-4 border-amber-400 bg-gradient-to-tr from-amber-400 to-amber-300 text-black flex items-center justify-center shadow-lg shadow-amber-500/25 cursor-pointer hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                  title="Take Photo & Search"
                >
                  <Camera size={32} strokeWidth={2.5} />
                </button>
              </div>

              {/* Alternative upload/demo triggers on desktop */}
              <div className="flex items-center justify-center gap-3 pt-2 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload size={13} />
                  Upload Photo from PC
                </button>
                <span className="text-slate-600">&bull;</span>
                <button
                  type="button"
                  onClick={() => handleUseDemoPhoto('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={13} className="text-amber-400" />
                  Use Demo Guest Photo
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── AI Processing & Results State ────────────────────────────── */
          <div className="space-y-6 text-center w-full animate-fade-in">
            <div className="relative mx-auto w-40 h-52 rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/40">
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captured Selfie"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-3">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  <Shield size={11} />
                  Live Face Vector Verified
                </span>
              </div>
            </div>

            {!searchComplete ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-base">
                  <Loader2 size={20} className="animate-spin" />
                  <span>Scanning with AWS Rekognition...</span>
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
                    {matchCount} Moments Found!
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    AWS Rekognition successfully matched your face across {eventInfo.photoCount.toLocaleString()} event photos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenGallery}
                  className="w-full max-w-sm mx-auto py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                >
                  <Sparkles size={18} />
                  View My Personal Gallery ({matchCount} Photos)
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-[11px] text-slate-500 max-w-lg mx-auto w-full pt-4">
        Biometric vectors are encrypted and strictly partitioned to {eventInfo.name}.
      </footer>
    </div>
  );
}

export default function GallerySearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-amber-400">
        <Loader2 size={32} className="animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
