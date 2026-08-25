'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Camera,
  Sparkles,
  Shield,
  CheckCircle2,
  ArrowRight,
  Clock,
  Mail,
  Loader2,
  Images,
  RefreshCw,
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

export default function GuestEventLandingPage() {
  const params = useParams();
  const router = useRouter();
  const token = (params?.['token'] as string) || '';

  const [event, setEvent] = useState<EventData>({
    id: 'evt_live',
    name: 'Event Shoot',
    date: new Date().toLocaleDateString(),
    venue: 'Venue TBA',
    coverUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80',
    photosCount: 0,
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

  // Load real event from localStorage matching this QR token
  useEffect(() => {
    try {
      const raw = localStorage.getItem('lr_organizer_events');
      if (raw) {
        const events = JSON.parse(raw);
        if (Array.isArray(events)) {
          const found = events.find((e: any) => e.qrToken === token || e.id === token) || events[0];
          if (found) {
            setEvent({
              id: found.id,
              name: found.name,
              date: found.date || new Date().toLocaleDateString(),
              venue: found.location || 'Venue TBA',
              coverUrl: found.coverUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200',
              photosCount: found.photoCount || 0,
              guestsScanned: found.searchCount || 0,
              organizerName: 'LensRecall Studio',
            });
          }
        }
      }
    } catch {
      // ignore
    }
  }, [token]);

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
    router.push(`/gallery/search?token=${token}&eventId=${event.id}`);
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
      saveSessionAndNavigate('guest.google@gmail.com');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="max-w-xl mx-auto w-full flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            LR
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-sm">
            LensRecall
          </span>
        </Link>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live AI Facial Search</span>
        </div>
      </header>

      {/* ── Main Step Flow ──────────────────────────────────────────────────── */}
      <main className="max-w-xl mx-auto w-full my-auto py-6">
        {/* RETURNING GUEST INSTANT GALLERIES SHORTCUT CARD */}
        {existingSession && step === 'landing' && (
          <div className="mb-6 p-5 rounded-3xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-xl border border-indigo-500/30 animate-fade-in space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold">
                <UserCheck size={16} className="text-amber-400" />
                <span>Welcome Back!</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-mono border border-indigo-400/30">
                {existingSession.email}
              </span>
            </div>

            <div>
              <h3 className="font-black text-lg text-white">Your Face ID is already verified</h3>
              <p className="text-xs text-slate-300">
                You discovered your photos in this event earlier. Jump directly to your photo album without re-capturing a selfie.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Link
                href={`/gallery/${event.id}?token=${token}`}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Images size={15} />
                <span>Open My Discovered Photos ({existingSession.matchedCount || 'All'})</span>
                <ArrowRight size={14} />
              </Link>

              <button
                type="button"
                onClick={() => setExistingSession(null)}
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Scan New Selfie</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Event Hero Landing */}
        {step === 'landing' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl animate-fade-in">
            {/* Event Cover Photo */}
            <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-900">
              <img
                src={event.coverUrl}
                alt={event.name}
                className="w-full h-full object-cover brightness-90 hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

              {/* Event Badge */}
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold border border-white/20">
                  {event.organizerName}
                </span>
              </div>

              {/* Event Title on Backdrop */}
              <div className="absolute bottom-5 inset-x-6">
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
                  {event.name}
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-indigo-200 mt-1 drop-shadow">
                  {event.date} &bull; {event.venue}
                </p>
              </div>
            </div>

            {/* Event Metrics & CTA */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <div>
                  <div className="text-xl font-black text-slate-900">{event.photosCount}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Photographs Indexed
                  </div>
                </div>
                <div className="border-l border-slate-200 pl-2">
                  <div className="text-xl font-black text-indigo-600">{event.guestsScanned}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Guests Found Photos
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setStep('consent')}
                  className="w-full py-4 px-6 rounded-2xl lr-btn-primary-gradient font-black text-sm text-white flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] transition-all cursor-pointer"
                >
                  <Camera size={18} />
                  <span>Find My Photographs with Selfie</span>
                  <ArrowRight size={16} />
                </button>

                <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                  <Shield size={13} className="text-indigo-600" />
                  <span>Private &bull; AI searches only photographs containing your face</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Biometric Consent (GDPR / DPDP) */}
        {step === 'consent' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
                <Shield size={28} />
              </div>
              <h2 className="text-xl font-black text-slate-900">Biometric Privacy Notice</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                LensRecall uses privacy-first Amazon Rekognition to match your selfie against photographs from <strong>{event.name}</strong>.
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Your selfie is converted into a temporary 128-dimensional mathematical vector and is never published or sold.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>You can only view photographs that include your face. Other guests cannot view your private gallery.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <span>All biometric data is automatically purged according to the event's privacy policy.</span>
              </div>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700 font-semibold leading-normal">
                I give explicit consent for LensRecall to process my selfie vector to deliver my event photographs under GDPR Art. 9 & DPDP Act 2023.
              </span>
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('landing')}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!consentChecked}
                onClick={() => setStep('auth')}
                className="flex-2 py-3 px-6 rounded-xl lr-btn-primary-gradient text-white text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-md transition-all cursor-pointer"
              >
                <span>Agree & Continue</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Guest Authentication */}
        {step === 'auth' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
                <Sparkles size={28} className="text-amber-500" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Where should we deliver your photos?</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Sign in with Google or enter your email so you can access and download your high-resolution photographs anytime.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-3 shadow-sm transition-all cursor-pointer"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl lr-btn-primary-gradient text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
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
      <footer className="max-w-xl mx-auto w-full text-center py-4 text-xs text-slate-400">
        Powered by <strong className="text-slate-600 font-bold">LensRecall AI</strong> &bull; Amazon Rekognition Face Indexing
      </footer>
    </div>
  );
}
