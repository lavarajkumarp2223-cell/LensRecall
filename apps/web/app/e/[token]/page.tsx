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

const MOCK_EVENTS: Record<string, EventData> = {
  'qr_rohan_priya_2026': {
    id: 'evt_wedding_01',
    name: 'Rohan & Priya Wedding Gala',
    date: 'August 24, 2026',
    venue: 'The Taj West End, Bangalore',
    coverUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80',
    photosCount: 5420,
    guestsScanned: 840,
    organizerName: 'Apex Events & Media',
  },
  'qr_techvision_2026': {
    id: 'evt_conf_02',
    name: 'TechVision Global Summit 2026',
    date: 'August 20, 2026',
    venue: 'BIEC Exhibition Centre, Bangalore',
    coverUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
    photosCount: 7890,
    guestsScanned: 950,
    organizerName: 'GlobalSummit Media Corp',
  },
  'qr_apex_awards_2026': {
    id: 'evt_corp_03',
    name: 'Apex Annual Awards Night',
    date: 'August 15, 2026',
    venue: 'Grand Ballroom, ITC Gardenia',
    coverUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
    photosCount: 1510,
    guestsScanned: 104,
    organizerName: 'Apex Events & Media',
  },
};

const DEFAULT_EVENT: EventData = {
  id: 'evt_demo',
  name: 'Demo Event',
  date: 'August 25, 2026',
  venue: 'Demo Venue',
  coverUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80',
  photosCount: 1000,
  guestsScanned: 200,
  organizerName: 'LensRecall Demo',
};

export default function GuestEventLandingPage() {
  const params = useParams();
  const router = useRouter();
  const token = params['token'] as string;
  const event = MOCK_EVENTS[token] ?? DEFAULT_EVENT;

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
    setLoading(true);
    setTimeout(() => saveSessionAndNavigate(email), 500);
  };

  const handleGoogleAuth = () => {
    setLoading(true);
    setTimeout(() => saveSessionAndNavigate('guest.user@gmail.com'), 500);
  };

  const handleDirectReturn = () => {
    const count = existingSession?.matchedCount || 18;
    router.push(`/gallery/${event.id}?token=${token}&count=${count}`);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col relative overflow-hidden selection:bg-amber-400 selection:text-black">
      {/* Background glow meshes */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cover banner */}
      <div className="relative w-full h-64 sm:h-80 overflow-hidden shrink-0 border-b border-white/10">
        <img
          src={event.coverUrl}
          alt={event.name}
          className="w-full h-full object-cover brightness-[0.65] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/40 to-transparent" />

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Camera size={16} className="text-amber-400" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-white text-sm tracking-wide">LensRecall</span>
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Live Event</span>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="flex-1 flex flex-col items-center px-4 pb-12 -mt-16 z-10">
        <div className="w-full max-w-md">
          <div className="bg-[#12131a] rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-7 backdrop-blur-xl mb-4">
            {/* Event info */}
            <div className="mb-5">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400 uppercase tracking-widest inline-block mb-2.5">
                {event.organizerName}
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
                {event.name}
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-2 font-medium">
                <Clock size={13} className="text-amber-400/80" />
                {event.date} &bull; {event.venue}
              </p>
            </div>

            {/* Event Photo & Guest Counts */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                <div className="text-xl font-black text-white">
                  {event.photosCount.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                  Photos Indexed
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                <div className="text-xl font-black text-amber-400">
                  {event.guestsScanned.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                  Guests Matched
                </div>
              </div>
            </div>

            {/* RETURNING GUEST INSTANT ACCESS CARD */}
            {existingSession ? (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <UserCheck size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      Welcome Back!
                    </div>
                    <div className="text-sm font-semibold text-white mt-0.5">
                      {existingSession.email || 'Verified Guest'}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      We already found your moments ({existingSession.matchedCount ?? 18} photos). You don&apos;t need to take another selfie!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDirectReturn}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 text-black font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Images size={18} />
                  Open My Discovered Photos
                  <ArrowRight size={16} />
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setExistingSession(null);
                      setStep('consent');
                    }}
                    className="text-xs text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer font-medium"
                  >
                    <RefreshCw size={12} />
                    Want to update your selfie or rescan? Click here
                  </button>
                </div>
              </div>
            ) : (
              /* FIRST-TIME GUEST DISCOVERY FLOW */
              <>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Sparkles size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">AWS AI Face Recognition</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Capture a quick selfie to discover all the moments you appeared in across {event.photosCount.toLocaleString()} high-res photos.
                    </div>
                  </div>
                </div>

                {step === 'landing' && (
                  <button
                    type="button"
                    onClick={() => setStep('consent')}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 text-black font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Sparkles size={17} />
                    Find My Photos
                    <ArrowRight size={16} />
                  </button>
                )}

                {step === 'consent' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <h2 className="text-base font-bold text-white">Biometric Consent</h2>
                      <p className="text-xs text-slate-400 mt-1">
                        To find your photos, AWS Rekognition will extract facial vectors from your selfie. Your vectors are isolated exclusively to this event.
                      </p>
                    </div>

                    <div className="space-y-2 text-xs text-slate-300 bg-white/[0.02] p-3.5 rounded-xl border border-white/5">
                      {[
                        'Vectors stored in event-isolated AWS collection',
                        'Strict GDPR & DPDP compliance & 90-day auto-purge',
                        'You can delete your biometric data anytime with 1 click',
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={consentChecked}
                        onChange={(e) => setConsentChecked(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-amber-400 rounded cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-300 leading-snug">
                        I consent to face biometric analysis for photo discovery per the{' '}
                        <Link href="/privacy" className="text-amber-400 font-semibold hover:underline">
                          Privacy Policy
                        </Link>.
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        if (consentChecked) setStep('auth');
                      }}
                      disabled={!consentChecked}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-black font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-md transition-all cursor-pointer"
                    >
                      Continue
                      <ArrowRight size={15} />
                    </button>
                  </div>
                )}

                {step === 'auth' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <h2 className="text-base font-bold text-white">Sign In to Save Your Matches</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Your account saves your photos so you can revisit them anytime without retaking a selfie.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-bold text-white flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                    >
                      {loading ? (
                        <Loader2 size={16} className="animate-spin text-amber-400" />
                      ) : (
                        <>
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path
                              fill="#EA4335"
                              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                            />
                            <path
                              fill="#4285F4"
                              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                            />
                          </svg>
                          Continue with Google
                        </>
                      )}
                    </button>

                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-[#12131a] px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          or sign in with email
                        </span>
                      </div>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-3">
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="guest@example.com"
                          className="w-full bg-white/[0.04] border border-white/15 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-400 transition-colors"
                        />
                        <Mail
                          size={15}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        {loading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            <Sparkles size={14} />
                            Proceed to Live Camera
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Privacy footer */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
            <Shield size={13} className="text-emerald-400/80" />
            <span>GDPR/DPDP Biometric Encrypted &bull; 90-Day Auto-Purge</span>
          </div>
        </div>
      </div>
    </div>
  );
}
