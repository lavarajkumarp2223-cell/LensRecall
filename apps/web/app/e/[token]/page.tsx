'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Camera,
  Sparkles,
  Shield,
  CheckCircle2,
  ArrowRight,
  Mail,
  Loader2,
  Images,
  UserCheck,
} from 'lucide-react';

type EventData = {
  id: string;
  name: string;
  date: string;
  venue: string;
  coverUrl: string;
  photosCount: number;
  guestsScanned: number;
  organizerName: string;
};

function GuestLandingContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (params?.['token'] as string) || '';

  // Extract metadata from query params or token
  const queryName = searchParams.get('name');
  const queryVenue = searchParams.get('venue');
  const queryDate = searchParams.get('date');
  const queryCount = searchParams.get('count');
  const queryEventId = searchParams.get('eventId');

  // Derive human name from token if needed (e.g. qr_testing__2402 -> "Testing")
  const tokenDerivedName = token
    ? token.replace(/^qr_/, '').replace(/__\d+$/, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Testing';

  const defaultName = queryName || (tokenDerivedName !== 'Live Event' && tokenDerivedName ? tokenDerivedName : 'Testing');

  const [event, setEvent] = useState<EventData>({
    id: queryEventId || token || 'evt_testing',
    name: defaultName,
    date: queryDate || '2026-09-12',
    venue: queryVenue || 'Galugondapeta',
    coverUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80',
    photosCount: queryCount ? parseInt(queryCount, 10) : 0,
    guestsScanned: 0,
    organizerName: 'LensRecall Studio',
  });

  const [step, setStep] = useState<'landing' | 'consent' | 'auth'>('landing');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [existingSession, setExistingSession] = useState<{
    email: string;
    eventId: string;
    matchedCount?: number;
    verified?: boolean;
  } | null>(null);

  // Load event details from localStorage (only if exact match found — no fallbacks)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('lr_organizer_events');
      if (raw) {
        const events = JSON.parse(raw);
        if (Array.isArray(events)) {
          // Strict matching only — no || events[0] fallback
          const found = events.find((e: any) => e.qrToken === token || e.id === token || (queryEventId && e.id === queryEventId));
          if (found) {
            setEvent({
              id: found.id,
              name: found.name,
              date: found.date || '2026-09-12',
              venue: found.location || queryVenue || 'Galugondapeta',
              coverUrl: found.coverUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200',
              photosCount: found.photoCount || 0,
              guestsScanned: found.searchCount || 0,
              organizerName: 'LensRecall Studio',
            });
          }
        }
      }
      // NOTE: We no longer seed events into localStorage on mobile — guest flow works from URL params only
    } catch {
      // ignore
    }
  }, [token, queryEventId, queryVenue]);

  // Check if guest has previously verified face on this device
  useEffect(() => {
    try {
      const raw = localStorage.getItem('lr_guest_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.eventId === event.id && (parsed.verified || parsed.matchedCount)) {
          setExistingSession(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [event.id]);

  const saveSessionAndNavigate = (guestEmail: string) => {
    const sessionData = {
      email: guestEmail,
      eventId: event.id,
      token,
      issuedAt: new Date().toISOString(),
    };
    localStorage.setItem('lr_guest_session', JSON.stringify(sessionData));
    // Route through mandatory selfie/face-capture step
    const targetParams = new URLSearchParams({
      token,
      eventId: event.id,
      name: event.name,
      venue: event.venue,
      count: String(event.photosCount),
    });
    router.push(`/gallery/search?${targetParams.toString()}`);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      saveSessionAndNavigate(email);
    }, 600);
  };

  const handleGoogleAuth = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      saveSessionAndNavigate('guest_user@gmail.com');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="max-w-xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
            LR
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900">
            LensRecall
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span>LIVE EVENT PASS</span>
        </div>
      </header>

      {/* ── Main Step Flow ─────────────────────────────────────────────────── */}
      <main className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-center py-6">
        {step === 'landing' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-6 animate-fade-in">
            {/* Event Cover Photo */}
            <div className="h-52 sm:h-60 relative bg-slate-950 overflow-hidden">
              <img
                src={event.coverUrl}
                alt={event.name}
                className="w-full h-full object-cover brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
                  Official Guest Portal
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{event.name}</h1>
                <p className="text-xs text-slate-300 flex items-center gap-3">
                  <span>📅 {event.date}</span>
                  <span>📍 {event.venue}</span>
                </p>
              </div>
            </div>

            {/* Event Telemetry */}
            <div className="px-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-semibold">
                    <Images size={14} />
                    <span>Total Photos</span>
                  </div>
                  <div className="text-xl font-extrabold text-slate-900">{event.photosCount} Photos</div>
                  <p className="text-[10px] text-slate-500">Indexed in Rekognition</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                    <Sparkles size={14} />
                    <span>AI Recall</span>
                  </div>
                  <div className="text-xl font-extrabold text-emerald-600">Active</div>
                  <p className="text-[10px] text-slate-500">Selfie-based search</p>
                </div>
              </div>

              {/* Returning Guest Resume Prompt */}
              {existingSession && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <UserCheck size={18} className="text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Welcome Back!</div>
                      <div className="text-[11px] text-slate-600">
                        Found {existingSession.matchedCount || event.photosCount} photos from your previous session
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/gallery/${event.id}?token=${token}`}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition-colors"
                  >
                    View Album
                  </Link>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setStep('consent')}
                className="w-full py-4 rounded-2xl lr-btn-primary-gradient text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all cursor-pointer"
              >
                <Camera size={18} />
                <span>Find My Photographs with AI</span>
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="px-6 pb-6 text-center">
              <span className="text-[11px] text-slate-400">
                Studio Hosted by <strong className="text-slate-600">{event.organizerName}</strong>
              </span>
            </div>
          </div>
        )}

        {/* STEP 2: Biometric Consent Modal */}
        {step === 'consent' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
              <Shield size={24} />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Facial Recognition Consent</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                LensRecall uses encrypted AWS Rekognition vector embeddings solely to locate your photos from{' '}
                <strong className="text-slate-800">{event.name}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>Selfie vector is encrypted and auto-purged after 90 days.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>Only photos where your face is detected will be matched.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>Full GDPR &amp; DPDP compliance with instant 1-click delete rights.</span>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700 font-medium leading-tight">
                I consent to facial biometric analysis for matching my event photographs.
              </span>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('landing')}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!consentChecked}
                onClick={() => setStep('auth')}
                className="flex-1 py-3 rounded-xl lr-btn-primary-gradient text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                Agree &amp; Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Quick Guest Sign In */}
        {step === 'auth' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Where Should We Send Photos?</h2>
              <p className="text-xs text-slate-500">
                Enter your email so you can access your album link anytime later.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-3 transition-colors shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">or email</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="guest@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl lr-btn-primary-gradient text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>Proceed to Camera Selfie Capture</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="max-w-xl mx-auto w-full text-center py-4 text-xs text-slate-400 space-y-1">
        <div>Powered by <strong className="text-slate-600 font-bold">LensRecall AI</strong> &bull; Amazon Rekognition</div>
        <div className="text-[11px]">
          Credit to <strong className="text-slate-600">lookalivesolutions2026</strong> &bull; <a href="tel:+917661907426" className="hover:text-indigo-600 font-medium">📞 7661907426</a> &bull; <a href="mailto:lookalivesolutions@gmail.com" className="hover:text-indigo-600 font-medium">✉️ lookalivesolutions@gmail.com</a>
        </div>
      </footer>
    </div>
  );
}

export default function GuestEventLandingPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Event Portal...</div>}>
      <GuestLandingContent />
    </Suspense>
  );
}
