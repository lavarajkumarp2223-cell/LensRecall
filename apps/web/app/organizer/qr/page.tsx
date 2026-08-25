'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import QRCode from 'qrcode';
import Link from 'next/link';
import {
  Copy,
  CheckCircle2,
  Printer,
  ExternalLink,
  Palette,
  FileText,
  Download,
  Sparkles,
  QrCode,
  Heart,
  Users,
  Check,
  Plus,
} from 'lucide-react';

type StandeeTheme = 'wedding_royal' | 'tech_summit' | 'vip_awards' | 'modern_minimal';

interface EventConfig {
  id: string;
  name: string;
  category: string;
  venue: string;
  date: string;
  token: string;
  scans: number;
  defaultTheme: StandeeTheme;
  leftPersonName: string;
  leftPersonRole: string;
  leftPersonPhoto: string;
  rightPersonName: string;
  rightPersonRole: string;
  rightPersonPhoto: string;
  headline: string;
  actionText: string;
  subtext: string;
  accentColor: string;
}

const THEMES_LIST: { id: StandeeTheme; name: string; icon: string; desc: string }[] = [
  { id: 'wedding_royal', name: 'Royal Wedding', icon: '👑', desc: 'Floral arches, golden flourishes & couple portraits' },
  { id: 'tech_summit', name: 'Tech Summit', icon: '🚀', desc: 'Cyber neon gradients, speaker badges & modern grid' },
  { id: 'vip_awards', name: 'VIP Gala & Awards', icon: '🏆', desc: 'Black tie luxury, gold laurels & red-carpet prestige' },
  { id: 'modern_minimal', name: 'Modern Minimal', icon: '✨', desc: 'Editorial typography, clean frames & studio aesthetics' },
];

function QrStudioContent() {
  const searchParams = useSearchParams();
  const queryEventId = searchParams.get('eventId');

  const [eventsMap, setEventsMap] = useState<Record<string, EventConfig>>({});
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Standee customization state
  const [theme, setTheme] = useState<StandeeTheme>('wedding_royal');
  const [showPortraits, setShowPortraits] = useState(false);
  const [headline, setHeadline] = useState('');
  const [actionText, setActionText] = useState('Receive Your Event Moments with AI');
  const [subtext, setSubtext] = useState('Scan with your smartphone camera to find all your photographs from our special day instantly via AI');
  const [_accentColor, setAccentColor] = useState('#d97706');
  const [leftName, setLeftName] = useState('Host / Groom');
  const [leftPhoto] = useState('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400');
  const [rightName, setRightName] = useState('Host / Bride');
  const [rightPhoto] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400');

  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [origin, setOrigin] = useState('http://localhost:3000');

  const standeeRef = useRef<HTMLDivElement>(null);

  // Load events from localStorage and select event
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }

    try {
      const raw = localStorage.getItem('lr_organizer_events');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map: Record<string, EventConfig> = {};
          parsed.forEach((evt: any) => {
            const token = evt.qrToken || `qr_${evt.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            map[evt.id] = {
              id: evt.id,
              name: evt.name,
              category: evt.category || 'Celebration',
              venue: evt.location || 'Venue TBA',
              date: evt.date || new Date().toLocaleDateString(),
              token,
              scans: evt.searchCount || 0,
              defaultTheme: evt.category === 'Corporate' ? 'tech_summit' : 'wedding_royal',
              leftPersonName: 'Host / Groom',
              leftPersonRole: 'Host',
              leftPersonPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
              rightPersonName: 'Host / Bride',
              rightPersonRole: 'Host',
              rightPersonPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
              headline: evt.name,
              actionText: 'Receive Your Event Moments with AI',
              subtext: 'Scan with your smartphone camera to find all your photographs from our event instantly via AI',
              accentColor: '#d97706',
            };
          });

          setEventsMap(map);

          // Select matching event or first event
          const targetId = queryEventId && map[queryEventId] ? queryEventId : parsed[0].id;
          setSelectedEventId(targetId);

          const active = map[targetId];
          if (active) {
            setTheme(active.defaultTheme);
            setHeadline(active.headline);
            setActionText(active.actionText);
            setSubtext(active.subtext);
            setAccentColor(active.accentColor);
            setLeftName(active.leftPersonName);
            setRightName(active.rightPersonName);
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingEvents(false);
    }
  }, [queryEventId]);

  // Sync state when selectedEventId changes
  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    const active = eventsMap[id];
    if (active) {
      setTheme(active.defaultTheme);
      setHeadline(active.headline);
      setActionText(active.actionText);
      setSubtext(active.subtext);
      setAccentColor(active.accentColor);
      setLeftName(active.leftPersonName);
      setRightName(active.rightPersonName);
    }
  };

  const currentEvent = eventsMap[selectedEventId] || {
    id: 'evt_new',
    name: 'My Live Event',
    category: 'Celebration',
    venue: 'Venue TBA',
    date: new Date().toLocaleDateString(),
    token: 'qr_live_event_2026',
    scans: 0,
    defaultTheme: 'wedding_royal' as StandeeTheme,
    leftPersonName: 'Host',
    leftPersonRole: 'Host',
    leftPersonPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    rightPersonName: 'Guest',
    rightPersonRole: 'VIP',
    rightPersonPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    headline: headline || 'My Live Event',
    actionText: actionText || 'Find Your Photographs with AI',
    subtext: subtext || 'Scan with your smartphone camera to find all your photographs from our event instantly via AI',
    accentColor: '#d97706',
  };

  const guestUrl = `${origin}/e/${currentEvent.token}`;

  // Generate scannable QR Code
  useEffect(() => {
    if (!guestUrl) return;
    QRCode.toDataURL(guestUrl, {
      width: 600,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0a0a0b',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [guestUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${currentEvent.token}_scannable_qr.png`;
    a.click();
  };

  const eventsList = Object.values(eventsMap);

  if (!loadingEvents && eventsList.length === 0) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto pb-16">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <QrCode size={28} className="text-indigo-600" />
            Standee Designer & QR Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Design decorated, event-themed physical QR standees for weddings, conferences, and celebrations
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
            <QrCode size={28} />
          </div>
          <h3 className="font-bold text-lg text-slate-900">No events found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create your first event collection to generate customized, print-ready physical standee QR codes.
          </p>
          <Link
            href="/organizer/events/new"
            className="inline-flex items-center gap-2 lr-btn-primary-gradient px-6 py-3 rounded-2xl text-xs font-bold shadow-md"
          >
            <Plus size={15} />
            Create Your First Event
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl pb-16">
      {/* Print Stylesheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-standee, #printable-standee * {
            visibility: visible;
          }
          #printable-standee {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 2cm;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <QrCode size={28} className="text-indigo-600" />
            Standee Designer & QR Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Design decorated, event-themed physical QR standees for weddings, conferences, and celebrations
          </p>
        </div>

        {/* Event Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600 hidden sm:inline">Event:</label>
          <select
            value={selectedEventId}
            onChange={(e) => handleSelectEvent(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all sm:w-64 cursor-pointer"
          >
            {eventsList.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left 5 Cols: Customizer Studio Controls ──────────────────────── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Metrics & Link Test */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Scans Recorded
                </span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">
                  {currentEvent.scans.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                  <CheckCircle2 size={11} />
                  Live active
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Token Status
                </span>
                <span className="text-xs font-mono font-bold text-indigo-600 mt-1 block truncate">
                  {currentEvent.token}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block mt-1">
                  AWS Rekognition bound
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={guestUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink size={13} />
                Test Guest Link
              </a>

              <button
                type="button"
                onClick={handleCopy}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Palette size={16} className="text-indigo-600" />
              Event Style Template
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {THEMES_LIST.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                    theme === t.id
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-600/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xl mb-1">{t.icon}</div>
                  <div className="text-xs font-bold text-slate-900">{t.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{t.desc}</div>
                  {theme === t.id && (
                    <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check size={10} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Portraits Toggle */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-indigo-600" />
                Featured Portraits (Left & Right)
              </h3>
              <button
                type="button"
                onClick={() => setShowPortraits(!showPortraits)}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                  showPortraits ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    showPortraits ? 'left-5' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {showPortraits && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Left Portrait Name</label>
                  <input
                    type="text"
                    value={leftName}
                    onChange={(e) => setLeftName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Right Portrait Name</label>
                  <input
                    type="text"
                    value={rightName}
                    onChange={(e) => setRightName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Typography & Copy */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileText size={16} className="text-indigo-600" />
              Standee Text & Copy
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Headline</label>
                <input
                  type="text"
                  value={headline || currentEvent.name}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Action Banner Text</label>
                <input
                  type="text"
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Instruction Subtitle</label>
                <textarea
                  rows={2}
                  value={subtext}
                  onChange={(e) => setSubtext(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Export & Print Action Buttons */}
          <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">Print & Export Physical Standee</h4>
                <p className="text-[11px] text-slate-400">High-resolution vector output for acrylic/foam boards</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handlePrint}
                className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Printer size={15} />
                Print Standee (PDF)
              </button>

              <button
                type="button"
                onClick={handleDownloadPng}
                className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/20 transition-all cursor-pointer"
              >
                <Download size={15} />
                Download Scannable QR
              </button>
            </div>
          </div>
        </div>

        {/* ── Right 7 Cols: Live Physical Standee Preview ──────────────────── */}
        <div className="lg:col-span-7 sticky top-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <Sparkles size={14} className="text-amber-500" />
              <span>Live Standee Preview (A4 Ratio)</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Event: {currentEvent.name}
            </span>
          </div>

          {/* ── Standee Card Frame ────────────────────────────────────────── */}
          <div
            id="printable-standee"
            ref={standeeRef}
            className={`relative rounded-[32px] overflow-hidden p-8 sm:p-10 shadow-2xl border transition-all text-center flex flex-col justify-between min-h-[640px] ${
              theme === 'wedding_royal'
                ? 'bg-gradient-to-b from-amber-50/90 via-orange-50/40 to-amber-100/60 border-amber-200/80 text-amber-950'
                : theme === 'tech_summit'
                ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 border-indigo-900/50 text-white shadow-indigo-950/50'
                : theme === 'vip_awards'
                ? 'bg-gradient-to-b from-stone-950 via-neutral-900 to-stone-950 border-amber-500/40 text-amber-100 shadow-amber-950/40'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Top Event Category Tag */}
            <div className="relative z-10 flex justify-center">
              <span
                className={`px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm border ${
                  theme === 'wedding_royal'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-800'
                    : theme === 'tech_summit'
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                    : theme === 'vip_awards'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {currentEvent.category || 'Celebration Event'}
              </span>
            </div>

            {/* Portraits (Optional) */}
            {showPortraits && (
              <div className="relative z-10 flex items-center justify-center gap-6 my-4">
                <div className="space-y-1">
                  <img
                    src={leftPhoto}
                    alt={leftName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-amber-400 shadow-md mx-auto"
                  />
                  <div className="text-[11px] font-bold truncate max-w-[90px]">{leftName}</div>
                </div>

                <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md">
                  <Heart size={14} fill="currentColor" />
                </div>

                <div className="space-y-1">
                  <img
                    src={rightPhoto}
                    alt={rightName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-amber-400 shadow-md mx-auto"
                  />
                  <div className="text-[11px] font-bold truncate max-w-[90px]">{rightName}</div>
                </div>
              </div>
            )}

            {/* Main Headline & Date Venue */}
            <div className="relative z-10 space-y-1.5 my-3">
              <h2
                className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  theme === 'tech_summit'
                    ? 'text-white'
                    : theme === 'vip_awards'
                    ? 'text-amber-200'
                    : 'text-amber-950 font-serif'
                }`}
              >
                {headline || currentEvent.name}
              </h2>
              <p
                className={`text-xs font-semibold ${
                  theme === 'tech_summit'
                    ? 'text-slate-300'
                    : theme === 'vip_awards'
                    ? 'text-amber-300/80'
                    : 'text-amber-800'
                }`}
              >
                {currentEvent.date} &bull; {currentEvent.venue}
              </p>
            </div>

            {/* Action Banner Pill */}
            <div className="relative z-10 my-2">
              <div
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black shadow-md ${
                  theme === 'tech_summit'
                    ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                    : theme === 'vip_awards'
                    ? 'bg-amber-500 text-slate-950 shadow-amber-500/30'
                    : 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                }`}
              >
                <Sparkles size={14} />
                <span>{actionText}</span>
              </div>
              <p
                className={`text-[11px] font-medium max-w-sm mx-auto mt-2 leading-relaxed ${
                  theme === 'tech_summit' || theme === 'vip_awards' ? 'text-slate-300' : 'text-amber-900/80'
                }`}
              >
                {subtext}
              </p>
            </div>

            {/* Scannable QR Code Frame */}
            <div className="relative z-10 my-4 flex justify-center">
              <div className="p-4 bg-white rounded-3xl shadow-xl border border-slate-200/80 inline-block">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Scannable Event QR"
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-48 h-48 sm:w-56 sm:h-56 bg-slate-100 flex items-center justify-center rounded-xl animate-pulse">
                    <QrCode size={36} className="text-slate-400" />
                  </div>
                )}
              </div>
            </div>

            {/* 3 Step Instruction Row */}
            <div className="relative z-10 grid grid-cols-3 gap-2 pt-2 max-w-sm mx-auto border-t border-slate-200/40">
              <div>
                <div
                  className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center mx-auto mb-1 ${
                    theme === 'tech_summit'
                      ? 'bg-indigo-900/60 text-indigo-300'
                      : theme === 'vip_awards'
                      ? 'bg-amber-950 text-amber-300'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  1
                </div>
                <div
                  className={`text-[11px] font-bold ${
                    theme === 'tech_summit' || theme === 'vip_awards' ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  Open Camera
                </div>
                <div className="text-[9px] text-slate-400">Any phone</div>
              </div>

              <div>
                <div
                  className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center mx-auto mb-1 ${
                    theme === 'tech_summit'
                      ? 'bg-indigo-900/60 text-indigo-300'
                      : theme === 'vip_awards'
                      ? 'bg-amber-950 text-amber-300'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  2
                </div>
                <div
                  className={`text-[11px] font-bold ${
                    theme === 'tech_summit' || theme === 'vip_awards' ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  Scan QR Code
                </div>
                <div className="text-[9px] text-slate-400">Tap link popup</div>
              </div>

              <div>
                <div
                  className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center mx-auto mb-1 ${
                    theme === 'tech_summit'
                      ? 'bg-indigo-900/60 text-indigo-300'
                      : theme === 'vip_awards'
                      ? 'bg-amber-950 text-amber-300'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  3
                </div>
                <div
                  className={`text-[11px] font-bold ${
                    theme === 'tech_summit' || theme === 'vip_awards' ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  Find Photos
                </div>
                <div className="text-[9px] text-slate-400">Instant AI recall</div>
              </div>
            </div>

            {/* Studio Footer */}
            <div
              className={`relative z-10 pt-3 text-[10px] font-bold tracking-widest uppercase ${
                theme === 'tech_summit'
                  ? 'text-indigo-400/80'
                  : theme === 'vip_awards'
                  ? 'text-amber-400/80'
                  : 'text-amber-800/60'
              }`}
            >
              Powered by LensRecall AI
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QrManagementPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Standee Studio...</div>}>
      <QrStudioContent />
    </Suspense>
  );
}
