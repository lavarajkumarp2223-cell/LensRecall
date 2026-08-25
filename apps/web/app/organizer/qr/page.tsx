'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
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
  Award,
  Layers,
  Check,
  RefreshCw,
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

const EVENTS_CONFIG: Record<string, EventConfig> = {
  evt_wedding_01: {
    id: 'evt_wedding_01',
    name: 'Rohan & Priya Wedding Gala',
    category: 'Wedding Ceremony',
    venue: 'The Taj West End, Bangalore',
    date: 'August 24, 2026',
    token: 'qr_rohan_priya_2026',
    scans: 1240,
    defaultTheme: 'wedding_royal',
    leftPersonName: 'Rohan (Groom)',
    leftPersonRole: 'Groom',
    leftPersonPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    rightPersonName: 'Priya (Bride)',
    rightPersonRole: 'Bride',
    rightPersonPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    headline: 'Rohan & Priya',
    actionText: 'Receive Your Magical Wedding Moments',
    subtext: 'Scan with your smartphone camera to find all your photographs from our special day instantly via AI',
    accentColor: '#d97706', // Royal Gold
  },
  evt_conf_02: {
    id: 'evt_conf_02',
    name: 'TechVision Global Summit 2026',
    category: 'Tech Conference',
    venue: 'BIEC Exhibition Centre, Bangalore',
    date: 'August 20, 2026',
    token: 'qr_techvision_2026',
    scans: 950,
    defaultTheme: 'tech_summit',
    leftPersonName: 'Dr. Elena Vance',
    leftPersonRole: 'AI Keynote',
    leftPersonPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    rightPersonName: 'Alex Chen',
    rightPersonRole: 'Head of Vision',
    rightPersonPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    headline: 'TechVision 2026',
    actionText: 'Instant AI Keynote & Hall Photo Recall',
    subtext: 'Scan to unlock your stage, panel, and networking moments in under 3 seconds',
    accentColor: '#4f46e5', // Cyber Indigo
  },
  evt_corp_03: {
    id: 'evt_corp_03',
    name: 'Apex Annual Awards Night',
    category: 'VIP Corporate Gala',
    venue: 'Grand Ballroom, ITC Gardenia',
    date: 'August 15, 2026',
    token: 'qr_apex_awards_2026',
    scans: 104,
    defaultTheme: 'vip_awards',
    leftPersonName: 'Sarah Jenkins',
    leftPersonRole: 'Managing Director',
    leftPersonPhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    rightPersonName: 'David Mercer',
    rightPersonRole: 'Chief Host',
    rightPersonPhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    headline: 'Apex Annual Awards',
    actionText: 'Your Red Carpet & Stage Honors',
    subtext: 'Scan with your camera to access your official awards ceremony photographs in high resolution',
    accentColor: '#b45309', // Deep Bronze Gold
  },
};

const THEMES_LIST: { id: StandeeTheme; name: string; icon: string; desc: string }[] = [
  { id: 'wedding_royal', name: 'Royal Wedding', icon: '👑', desc: 'Floral arches, golden flourishes & couple portraits' },
  { id: 'tech_summit', name: 'Tech Summit', icon: '🚀', desc: 'Cyber neon gradients, speaker badges & modern grid' },
  { id: 'vip_awards', name: 'VIP Gala & Awards', icon: '🏆', desc: 'Black tie luxury, gold laurels & red-carpet prestige' },
  { id: 'modern_minimal', name: 'Modern Minimal', icon: '✨', desc: 'Editorial typography, clean frames & studio aesthetics' },
];

export default function QrManagementPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>('evt_wedding_01');
  const eventConfig = EVENTS_CONFIG[selectedEventId] ?? EVENTS_CONFIG['evt_wedding_01']!;

  const [theme, setTheme] = useState<StandeeTheme>(eventConfig.defaultTheme);
  const [showPortraits, setShowPortraits] = useState(true);
  const [headline, setHeadline] = useState(eventConfig.headline);
  const [actionText, setActionText] = useState(eventConfig.actionText);
  const [subtext, setSubtext] = useState(eventConfig.subtext);
  const [accentColor, setAccentColor] = useState(eventConfig.accentColor);
  const [leftName, setLeftName] = useState(eventConfig.leftPersonName);
  const [leftPhoto, setLeftPhoto] = useState(eventConfig.leftPersonPhoto);
  const [rightName, setRightName] = useState(eventConfig.rightPersonName);
  const [rightPhoto, setRightPhoto] = useState(eventConfig.rightPersonPhoto);
  const [standeeSize, setStandeeSize] = useState<'A4_PORTRAIT' | 'A5_TENT' | 'A3_EASEL'>('A4_PORTRAIT');

  const [copied, setCopied] = useState(false);
  const [regenerated, setRegenerated] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [origin, setOrigin] = useState('http://localhost:3000');

  const standeeRef = useRef<HTMLDivElement>(null);

  // Sync state when selected event changes
  useEffect(() => {
    const cfg = EVENTS_CONFIG[selectedEventId] ?? EVENTS_CONFIG['evt_wedding_01']!;
    setTheme(cfg.defaultTheme);
    setHeadline(cfg.headline);
    setActionText(cfg.actionText);
    setSubtext(cfg.subtext);
    setAccentColor(cfg.accentColor);
    setLeftName(cfg.leftPersonName);
    setLeftPhoto(cfg.leftPersonPhoto);
    setRightName(cfg.rightPersonName);
    setRightPhoto(cfg.rightPersonPhoto);
  }, [selectedEventId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const guestUrl = `${origin}/e/${eventConfig.token}`;

  // Generate genuine high-res scannable QR Code
  useEffect(() => {
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

  const handleRegenerate = () => {
    if (confirm('Regenerating this QR code will revoke previous printed standees. Continue?')) {
      setRegenerated(true);
      setTimeout(() => setRegenerated(false), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${eventConfig.token}_scannable_qr.png`;
    a.click();
  };

  return (
    <div className="space-y-8 max-w-7xl pb-16">
      {/* ── Print Stylesheet (Injected so Print only prints the Standee Card) ── */}
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
            Design decorated, event-themed physical QR standees for weddings, conferences, and gala evenings
          </p>
        </div>

        {/* Event Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600 hidden sm:inline">Event:</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all sm:w-64 cursor-pointer"
          >
            <option value="evt_wedding_01">💍 Rohan & Priya Wedding Gala</option>
            <option value="evt_conf_02">🚀 TechVision Global Summit 2026</option>
            <option value="evt_corp_03">🏆 Apex Annual Awards Night</option>
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
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Scans Recorded</div>
                <div className="text-xl font-black text-indigo-600">{eventConfig.scans.toLocaleString()}</div>
                <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 size={11} /> 98.2% valid
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Token Status</div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" /> Active
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{eventConfig.token}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href={guestUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink size={13} /> Test Guest Link
              </a>
              <button
                type="button"
                onClick={handleCopy}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <Copy size={13} /> {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* 1. Theme & Style Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Layers size={16} className="text-indigo-600" />
              Event Style Template
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {THEMES_LIST.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    theme === t.id
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{t.icon}</span>
                    {theme === t.id && <Check size={14} className="text-indigo-600" />}
                  </div>
                  <div className="font-bold text-xs text-slate-900 mt-1">{t.name}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Side-by-Side Portraits Customizer */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-indigo-600" />
                Featured Portraits (Left & Right)
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPortraits}
                  onChange={(e) => setShowPortraits(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>

            {showPortraits && (
              <div className="space-y-4 pt-1 animate-fade-in">
                {/* Left Person (Groom / Speaker 1) */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <img src={leftPhoto} alt={leftName} className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Left Portrait ({theme === 'wedding_royal' ? 'Groom' : 'Host / Speaker 1'})
                      </label>
                      <input
                        type="text"
                        value={leftName}
                        onChange={(e) => setLeftName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                        placeholder="Name"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={leftPhoto}
                    onChange={(e) => setLeftPhoto(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-500 font-mono outline-none focus:border-indigo-500"
                    placeholder="Image URL"
                  />
                </div>

                {/* Right Person (Bride / Speaker 2) */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <img src={rightPhoto} alt={rightName} className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Right Portrait ({theme === 'wedding_royal' ? 'Bride' : 'Keynote / Speaker 2'})
                      </label>
                      <input
                        type="text"
                        value={rightName}
                        onChange={(e) => setRightName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                        placeholder="Name"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={rightPhoto}
                    onChange={(e) => setRightPhoto(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-500 font-mono outline-none focus:border-indigo-500"
                    placeholder="Image URL"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Text & Call-To-Action Copy */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3.5">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileText size={16} className="text-indigo-600" />
              Headline & Action Copy
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Big Main Title</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Action Banner Banner Text</label>
              <input
                type="text"
                value={actionText}
                onChange={(e) => setActionText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Instructions Subtext</label>
              <textarea
                rows={2}
                value={subtext}
                onChange={(e) => setSubtext(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:bg-white focus:border-indigo-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* 4. Accent Color */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Palette size={16} className="text-indigo-600" />
              Theme Accent Color
            </h3>

            <div className="flex items-center gap-3">
              {[
                { name: 'Royal Gold', hex: '#d97706' },
                { name: 'Velvet Rose', hex: '#e11d48' },
                { name: 'Cyber Indigo', hex: '#4f46e5' },
                { name: 'Emerald Green', hex: '#059669' },
                { name: 'Classic Black', hex: '#0a0a0b' },
              ].map(({ name, hex }) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setAccentColor(hex)}
                  className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer shadow-sm ${
                    accentColor === hex ? 'border-slate-900 scale-110 ring-2 ring-indigo-200' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: hex }}
                  title={name}
                >
                  {accentColor === hex && <Check size={14} className="text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Export Actions & Standee Dimensions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Printer size={16} className="text-indigo-600" />
              Print & Export Standee
            </h3>

            {/* Print Dimensions */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Print Format / Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'A4_PORTRAIT', label: 'A4 Table Standee' },
                  { id: 'A5_TENT', label: 'A5 Table Tent' },
                  { id: 'A3_EASEL', label: 'A3 Entrance Easel' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStandeeSize(s.id as 'A4_PORTRAIT' | 'A5_TENT' | 'A3_EASEL')}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      standeeSize === s.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handlePrint}
                className="lr-btn-primary-gradient px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Printer size={15} /> Print Standee (PDF)
              </button>
              <button
                type="button"
                onClick={handleDownloadPng}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <Download size={14} /> Download QR PNG
              </button>
            </div>

            <button
              type="button"
              onClick={handleRegenerate}
              className="w-full text-xs text-rose-600 hover:text-rose-700 hover:underline flex items-center justify-center gap-1.5 pt-2 cursor-pointer"
            >
              <RefreshCw size={12} />
              Regenerate QR Token (Revoke Old)
            </button>
            {regenerated && (
              <p className="text-[11px] text-emerald-600 text-center font-semibold animate-fade-in">
                ✓ New secure token generated and active
              </p>
            )}
          </div>
        </div>

        {/* ── Right 7 Cols: High-Res Themed Standee Live Preview ────────────── */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          {/* Standee Container (Prints Cleanly) */}
          <div
            id="printable-standee"
            ref={standeeRef}
            className={`w-full max-w-lg rounded-3xl p-7 sm:p-9 shadow-2xl relative overflow-hidden transition-all text-center ${
              theme === 'wedding_royal'
                ? 'bg-gradient-to-b from-[#fdfbf7] via-[#fffdf9] to-[#faf5ec] text-amber-950 border-[6px] border-[#e8d8b5]'
                : theme === 'tech_summit'
                ? 'bg-gradient-to-b from-[#0b0f19] via-[#0f172a] to-[#1e1b4b] text-white border-[6px] border-indigo-500/30'
                : theme === 'vip_awards'
                ? 'bg-gradient-to-b from-[#18181b] via-[#09090b] to-[#1c1917] text-amber-100 border-[6px] border-amber-500/40'
                : 'bg-white text-slate-900 border-4 border-slate-200'
            }`}
          >
            {/* ── Background SVG Graphical Ornaments ──────────────────────── */}
            {theme === 'wedding_royal' && (
              <>
                {/* Top Corner Floral Mandalas */}
                <div className="absolute -top-10 -left-10 w-36 h-36 opacity-30 pointer-events-none">
                  <svg viewBox="0 0 100 100" fill={accentColor}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke={accentColor} strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M50 0 C60 30, 70 40, 100 50 C70 60, 60 70, 50 100 C40 70, 30 60, 0 50 C30 40, 40 30, 50 0 Z" />
                  </svg>
                </div>
                <div className="absolute -top-10 -right-10 w-36 h-36 opacity-30 pointer-events-none">
                  <svg viewBox="0 0 100 100" fill={accentColor}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke={accentColor} strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M50 0 C60 30, 70 40, 100 50 C70 60, 60 70, 50 100 C40 70, 30 60, 0 50 C30 40, 40 30, 50 0 Z" />
                  </svg>
                </div>
                {/* Subtle Arch Border */}
                <div className="absolute inset-2 rounded-2xl border border-amber-300/40 pointer-events-none" />
              </>
            )}

            {theme === 'tech_summit' && (
              <>
                {/* Cyber Grid Background */}
                <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-40 bg-indigo-500/20 blur-3xl pointer-events-none" />
              </>
            )}

            {theme === 'vip_awards' && (
              <>
                {/* Gold Ray Ambient Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/15 blur-3xl pointer-events-none" />
                <div className="absolute inset-2 rounded-2xl border border-amber-500/20 pointer-events-none" />
              </>
            )}

            {/* ── Top Header Badge ────────────────────────────────────────── */}
            <div className="relative z-10 flex items-center justify-center gap-2 mb-4">
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm ${
                  theme === 'wedding_royal'
                    ? 'bg-amber-100/80 text-amber-900 border border-amber-300'
                    : theme === 'tech_summit'
                    ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/40'
                    : theme === 'vip_awards'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                }`}
              >
                {theme === 'wedding_royal' && <Heart size={12} className="fill-amber-600 text-amber-600" />}
                {theme === 'tech_summit' && <Sparkles size={12} className="text-indigo-400" />}
                {theme === 'vip_awards' && <Award size={12} className="text-amber-400" />}
                {eventConfig.category}
              </span>
            </div>

            {/* ── Dual Side-by-Side Portraits (Bride & Groom or Speakers) ─── */}
            {showPortraits && (
              <div className="relative z-10 flex items-center justify-center gap-4 sm:gap-6 my-4">
                {/* Left Portrait */}
                <div className="flex flex-col items-center group">
                  <div
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 shadow-lg transition-transform group-hover:scale-105 ${
                      theme === 'wedding_royal'
                        ? 'bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500'
                        : theme === 'tech_summit'
                        ? 'bg-gradient-to-tr from-indigo-500 via-cyan-400 to-violet-500'
                        : theme === 'vip_awards'
                        ? 'bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-700'
                        : 'bg-slate-200'
                    }`}
                  >
                    <img
                      src={leftPhoto}
                      alt={leftName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <span
                    className={`text-xs font-bold mt-2 truncate max-w-[100px] ${
                      theme === 'tech_summit' || theme === 'vip_awards' ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    {leftName}
                  </span>
                </div>

                {/* Central Emblem / Heart / Icon */}
                <div className="flex flex-col items-center justify-center -mt-4">
                  {theme === 'wedding_royal' && (
                    <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shadow-md">
                      <Heart size={18} className="fill-amber-600 text-amber-600 animate-pulse" />
                    </div>
                  )}
                  {theme === 'tech_summit' && (
                    <div className="w-9 h-9 rounded-full bg-indigo-950 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shadow-md">
                      <Sparkles size={16} />
                    </div>
                  )}
                  {theme === 'vip_awards' && (
                    <div className="w-9 h-9 rounded-full bg-amber-950 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md">
                      <Award size={18} />
                    </div>
                  )}
                  {theme === 'modern_minimal' && (
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-black">
                      &
                    </div>
                  )}
                </div>

                {/* Right Portrait */}
                <div className="flex flex-col items-center group">
                  <div
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 shadow-lg transition-transform group-hover:scale-105 ${
                      theme === 'wedding_royal'
                        ? 'bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500'
                        : theme === 'tech_summit'
                        ? 'bg-gradient-to-tr from-indigo-500 via-cyan-400 to-violet-500'
                        : theme === 'vip_awards'
                        ? 'bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-700'
                        : 'bg-slate-200'
                    }`}
                  >
                    <img
                      src={rightPhoto}
                      alt={rightName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <span
                    className={`text-xs font-bold mt-2 truncate max-w-[100px] ${
                      theme === 'tech_summit' || theme === 'vip_awards' ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    {rightName}
                  </span>
                </div>
              </div>
            )}

            {/* ── Big Central Headline & Venue ────────────────────────────── */}
            <div className="relative z-10 space-y-1.5 my-3">
              <h2
                className={`text-2xl sm:text-4xl font-black tracking-tight leading-tight ${
                  theme === 'wedding_royal'
                    ? 'font-serif text-amber-950'
                    : theme === 'tech_summit'
                    ? 'font-mono text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-cyan-300'
                    : theme === 'vip_awards'
                    ? 'font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400'
                    : 'text-slate-900'
                }`}
              >
                {headline}
              </h2>
              <p
                className={`text-xs font-medium ${
                  theme === 'tech_summit' || theme === 'vip_awards' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {eventConfig.date} • {eventConfig.venue}
              </p>
            </div>

            {/* ── Action Banner Bar ───────────────────────────────────────── */}
            <div className="relative z-10 my-4">
              <div
                className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm tracking-tight shadow-sm inline-flex items-center gap-2 ${
                  theme === 'wedding_royal'
                    ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-amber-600/20'
                    : theme === 'tech_summit'
                    ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 text-white shadow-indigo-500/30'
                    : theme === 'vip_awards'
                    ? 'bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-black font-extrabold shadow-amber-500/20'
                    : 'bg-slate-900 text-white'
                }`}
              >
                <Sparkles size={15} />
                <span>{actionText}</span>
              </div>
              <p
                className={`text-[11px] mt-1.5 max-w-sm mx-auto leading-relaxed ${
                  theme === 'tech_summit' || theme === 'vip_awards' ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {subtext}
              </p>
            </div>

            {/* ── Decorated Real Scannable QR Code ─────────────────────────── */}
            <div className="relative z-10 my-4 inline-block">
              <div
                className={`p-4 rounded-3xl bg-white shadow-2xl relative border-2 ${
                  theme === 'wedding_royal'
                    ? 'border-amber-300'
                    : theme === 'tech_summit'
                    ? 'border-indigo-500'
                    : theme === 'vip_awards'
                    ? 'border-amber-400'
                    : 'border-slate-300'
                }`}
              >
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Scannable QR Code for ${eventConfig.name}`}
                    className="w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-xl object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                    Generating QR...
                  </div>
                )}

                {/* Decorative corner brackets */}
                <div
                  className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 rounded-tl"
                  style={{ borderColor: accentColor }}
                />
                <div
                  className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 rounded-tr"
                  style={{ borderColor: accentColor }}
                />
                <div
                  className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 rounded-bl"
                  style={{ borderColor: accentColor }}
                />
                <div
                  className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 rounded-br"
                  style={{ borderColor: accentColor }}
                />
              </div>
            </div>

            {/* ── 3-Step Instruction Icons ─────────────────────────────────── */}
            <div
              className={`relative z-10 grid grid-cols-3 gap-2 pt-3 mt-2 border-t text-center ${
                theme === 'tech_summit' || theme === 'vip_awards' ? 'border-white/10' : 'border-amber-200/60'
              }`}
            >
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
                <div className="text-[9px] text-slate-400">Tap banner</div>
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
              Captured by Apex Events &bull; Powered by LensRecall AI
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
