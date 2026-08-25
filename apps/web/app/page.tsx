'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  Sparkles,
  Shield,
  QrCode,
  CheckCircle2,
  ArrowRight,
  Play,
  Clock,
  UploadCloud,
  Check,
} from 'lucide-react';


interface SampleGuest {
  id: string;
  name: string;
  role: string;
  avatar: string;
  matchedCount: number;
  bestMatch: number;
  photos: { url: string; title: string; score: number }[];
}

const SAMPLE_GUESTS: SampleGuest[] = [
  {
    id: 'priya',
    name: 'Priya Sharma',
    role: 'The Bride',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    matchedCount: 24,
    bestMatch: 99.8,
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
        title: 'Varmala Exchange Moment',
        score: 99.8,
      },
      {
        url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
        title: 'Sangeet Solo Dance',
        score: 99.2,
      },
      {
        url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
        title: 'Reception Gala Dinner',
        score: 98.6,
      },
    ],
  },
  {
    id: 'rohan',
    name: 'Rohan Verma',
    role: 'The Groom',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    matchedCount: 19,
    bestMatch: 99.4,
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
        title: 'Baraat Grand Entrance',
        score: 99.4,
      },
      {
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
        title: 'Mandap Phere Ritual',
        score: 98.9,
      },
      {
        url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
        title: 'Stage Toast with Family',
        score: 97.8,
      },
    ],
  },
  {
    id: 'maya',
    name: 'Maya Patel',
    role: 'VIP Guest',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    matchedCount: 12,
    bestMatch: 98.5,
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
        title: 'Sangeet Group Performance',
        score: 98.5,
      },
      {
        url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
        title: 'Family Group Photo',
        score: 97.9,
      },
      {
        url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
        title: 'Cocktail Gala Candid',
        score: 96.4,
      },
    ],
  },
];

export default function NextGenLightHomepage() {
  const [selectedGuest, setSelectedGuest] = useState<SampleGuest>(SAMPLE_GUESTS[0]!);
  const [_isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState('Face Aligned');

  const handleSelectGuest = (guest: SampleGuest) => {
    setSelectedGuest(guest);
    setIsSimulating(true);
    setSimStep('Scanning AWS Rekognition collection...');

    setTimeout(() => {
      setSimStep('Matching 5,420 high-res photos...');
    }, 400);

    setTimeout(() => {
      setSimStep(`Discovered ${guest.matchedCount} moments with ${guest.bestMatch}% match!`);
      setIsSimulating(false);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-600 selection:text-white relative overflow-x-hidden">
      {/* ── Ambient Radial Mesh Glows ──────────────────────────────────────── */}
      <div className="lr-mesh-glow-1" aria-hidden="true" />
      <div className="lr-mesh-glow-2" aria-hidden="true" />

      {/* ── Top Floating Clean Navbar ─────────────────────────────────────── */}
      <header className="fixed top-5 inset-x-0 z-50 max-w-6xl mx-auto px-4 pointer-events-none">
        <nav className="pointer-events-auto rounded-full bg-white/90 backdrop-blur-2xl border border-slate-200/80 px-6 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.06)] flex items-center justify-between transition-all">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Camera size={16} strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
              LensRecall
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#simulator" className="hover:text-indigo-600 transition-colors">
              Live AI Playground
            </a>
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Features
            </a>
            <Link href="/privacy" className="hover:text-indigo-600 transition-colors">
              Biometric Privacy
            </Link>
            <Link href="/pricing" className="hover:text-indigo-600 transition-colors">
              Pricing Plans
            </Link>
            <Link href="/contact" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
              Contact Us
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="lr-btn-primary-gradient px-4 py-2 rounded-full text-xs font-bold shadow-md shadow-indigo-500/20"
            >
              Start Free Trial
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      <section className="relative pt-36 sm:pt-44 pb-20 px-4 sm:px-6 max-w-7xl mx-auto z-10">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-bold text-indigo-700 shadow-sm backdrop-blur-md">
            <Sparkles size={14} className="text-amber-500" />
            <span>AI-Powered Event Photo Discovery & Delivery</span>
          </div>

          {/* Main Title */}
          <h1 className="lr-hero-title tracking-tight">
            Find every photo you&apos;re in. <br />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
              In under three seconds.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Photographers upload entire camera cards in bulk. Guests simply scan the event QR, take a selfie, and instantly receive their private personal photo gallery.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="lr-btn-primary-gradient px-8 py-3.5 rounded-full text-sm font-bold flex items-center gap-2 w-full sm:w-auto justify-center shadow-lg shadow-indigo-500/25"
            >
              Host Your Event Free
              <ArrowRight size={16} />
            </Link>
            <a
              href="#simulator"
              className="lr-btn-subtle-glass px-6 py-3.5 rounded-full text-sm font-semibold flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Play size={15} className="text-indigo-600" />
              Try Live Face Discovery
            </a>
          </div>

          {/* Metrics bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
              <div className="text-2xl font-black text-slate-900">0.38s</div>
              <div className="text-xs text-indigo-600 font-semibold">Recall Latency</div>
              <p className="text-[11px] text-slate-500">Sub-second face matching</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
              <div className="text-2xl font-black text-slate-900">50k+</div>
              <div className="text-xs text-purple-600 font-semibold">Photos Per Event</div>
              <p className="text-[11px] text-slate-500">Direct R2 parallel upload</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
              <div className="text-2xl font-black text-slate-900">99.8%</div>
              <div className="text-xs text-emerald-600 font-semibold">Match Accuracy</div>
              <p className="text-[11px] text-slate-500">AWS Rekognition partitioned</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
              <div className="text-2xl font-black text-slate-900">100%</div>
              <div className="text-xs text-amber-600 font-semibold">Privacy Isolated</div>
              <p className="text-[11px] text-slate-500">Auto-purge retention rules</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Live Face Discovery Simulator (The Playground) ──────── */}
      <section id="simulator" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
        <div className="lr-glass-panel p-8 sm:p-12 rounded-3xl relative overflow-hidden space-y-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700">
                <Sparkles size={13} className="text-amber-500" />
                <span>Interactive AI Playground</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Test the Instant Recall Engine Live
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Select an attendee below to watch our AI engine search 5,420 wedding photos and isolate their moments in milliseconds.
              </p>
            </div>

            {/* Live Rekognition Health Tag */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 self-start md:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Rekognition ap-south-1 • 380ms</span>
            </div>
          </div>

          {/* Attendee Selector Pills */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {SAMPLE_GUESTS.map((guest) => (
              <button
                key={guest.id}
                type="button"
                onClick={() => handleSelectGuest(guest)}
                className={`flex items-center gap-3 p-2 pr-5 rounded-2xl border transition-all cursor-pointer ${
                  selectedGuest.id === guest.id
                    ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-slate-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <img
                  src={guest.avatar}
                  alt={guest.name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900">{guest.name}</div>
                  <div className="text-[11px] text-slate-500">{guest.role}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Live Simulator Viewport */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
            {/* Left: Attendee Face Scanner Frame */}
            <div className="lg:col-span-4 relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xl group">
              <img
                src={selectedGuest.avatar}
                alt={selectedGuest.name}
                className="w-full h-full object-cover brightness-95"
              />

              {/* Laser scan line */}
              <div className="lr-laser-sweep" />

              {/* Reticles */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-indigo-400" />

              {/* Live Status Overlay */}
              <div className="absolute bottom-4 inset-x-4 p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    {selectedGuest.name}
                  </span>
                  <span className="text-[10px] font-mono text-indigo-300 font-bold">
                    {selectedGuest.bestMatch}% MATCH
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  {simStep}
                </p>
              </div>
            </div>

            {/* Right: Discovered Matching Moments Grid */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  <span>Instant Matching Gallery for {selectedGuest.name}</span>
                </h3>
                <span className="text-xs font-semibold text-indigo-600">
                  {selectedGuest.matchedCount} Discovered Photos
                </span>
              </div>

              {/* Discovered Photos Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {selectedGuest.photos.map((photo, i) => (
                  <div
                    key={i}
                    className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-md hover:border-indigo-500 transition-all cursor-pointer"
                  >
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Score Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-950/75 backdrop-blur-md text-[10px] font-bold text-white shadow-sm">
                        {photo.score}% Match
                      </span>
                    </div>

                    {/* Title */}
                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent">
                      <div className="text-xs font-bold text-white truncate">
                        {photo.title}
                      </div>
                      <div className="text-[10px] text-slate-300">
                        Original Raw (4200 × 2800)
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Bar */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-700">
                  ⚡ <strong>{selectedGuest.matchedCount} high-resolution photographs</strong> are ready for 1-click bulk ZIP download.
                </div>
                <Link
                  href={`/gallery/evt_wedding_01`}
                  className="lr-btn-primary-gradient px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap"
                >
                  View Full Gallery &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Modern Bento Grid Features ────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
            Architecture & Innovation
          </span>
          <h2 className="lr-section-title">
            Built for Elite Studios & Large-Scale Events
          </h2>
          <p className="text-sm text-slate-600">
            Engineered with zero-compromise security, lightning speed, and beautiful attendee delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento 1: Cloudflare R2 Uploads */}
          <div className="lr-glass-card p-8 rounded-3xl space-y-4 md:col-span-2 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UploadCloud size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Direct Presigned R2 Storage Pipeline
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
              Upload 5,000+ RAW/JPEG photos simultaneously directly to Cloudflare R2 object storage. No API memory bottlenecks, automatic thumbnail generation, and real-time BullMQ background workers.
            </p>
            <div className="flex items-center gap-4 pt-2 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-indigo-600" />
                <span>Zero Server Egress Fees</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-indigo-600" />
                <span>Lossless Quality</span>
              </div>
            </div>
          </div>

          {/* Bento 2: QR Standee Designer */}
          <div className="lr-glass-card p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <QrCode size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Print-Ready Standee Designer
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generate custom branded high-resolution QR standees in SVG and PDF formats for table placement at venue entrances.
            </p>
          </div>

          {/* Bento 3: Event-Isolated Biometric Partitioning */}
          <div className="lr-glass-card p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Strict Event Partitioning
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Face searches occur exclusively within that single event&apos;s isolated collection partition. Zero cross-event data leakage guaranteed.
            </p>
          </div>

          {/* Bento 4: Automated Retention Purge Engine */}
          <div className="lr-glass-card p-8 rounded-3xl space-y-4 md:col-span-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Automated Retention & GDPR Article 17 Erasure
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every event features customizable biometric retention schedules (30, 90, 180, or 365 days). Background cron workers automatically purge AWS Rekognition collection embeddings once retention expires.
            </p>
          </div>
        </div>
      </section>

      {/* ── Pricing Matrix Section ────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
            SaaS Pricing
          </span>
          <h2 className="lr-section-title">
            Transparent Plans for Every Studio
          </h2>
          <p className="text-sm text-slate-600">
            Start with our 14-day free trial. No credit card required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter */}
          <div className="lr-glass-card p-8 rounded-3xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-900">Free Starter</h3>
              <div className="text-3xl font-extrabold text-slate-900">₹0</div>
              <p className="text-xs text-slate-500">Ideal for small shoots and testing</p>
              <div className="space-y-2.5 text-xs text-slate-600 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2"><Check size={14} className="text-indigo-600" /> 1 Active Event</div>
                <div className="flex items-center gap-2"><Check size={14} className="text-indigo-600" /> Up to 500 Photos</div>
                <div className="flex items-center gap-2"><Check size={14} className="text-indigo-600" /> 30-Day Face Retention</div>
              </div>
            </div>
            <Link href="/register" className="lr-btn-subtle-glass w-full py-3 rounded-full text-center text-xs font-bold block">
              Get Started Free
            </Link>
          </div>

          {/* Pro Studio (Highlighted) */}
          <div className="lr-glass-card p-8 rounded-3xl space-y-6 flex flex-col justify-between border-2 border-indigo-500 relative shadow-xl shadow-indigo-500/10">
            <div className="space-y-4">
              <div className="inline-block px-3 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                MOST POPULAR
              </div>
              <h3 className="font-bold text-lg text-slate-900">Pro Studio</h3>
              <div className="text-3xl font-extrabold text-indigo-600">₹4,999<span className="text-xs text-slate-500 font-normal"> / mo</span></div>
              <p className="text-xs text-slate-500">For wedding studios & active event hosts</p>
              <div className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 font-semibold"><Check size={14} className="text-indigo-600" /> Unlimited Events</div>
                <div className="flex items-center gap-2 font-semibold"><Check size={14} className="text-indigo-600" /> 50,000 Photos per month</div>
                <div className="flex items-center gap-2"><Check size={14} className="text-indigo-600" /> 90-Day Biometric Retention</div>
                <div className="flex items-center gap-2"><Check size={14} className="text-indigo-600" /> Custom Watermark & Branding</div>
                <div className="flex items-center gap-2"><Check size={14} className="text-indigo-600" /> Asynchronous Bulk ZIP Downloads</div>
              </div>
            </div>
            <Link href="/register" className="lr-btn-primary-gradient w-full py-3.5 rounded-full text-center text-xs font-bold block shadow-lg">
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Enterprise */}
          <div className="lr-glass-card p-8 rounded-3xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-900">Enterprise Agency</h3>
              <div className="text-3xl font-extrabold text-slate-900">₹14,999<span className="text-xs text-slate-500 font-normal"> / mo</span></div>
              <p className="text-xs text-slate-500">For festivals, summits, and agencies</p>
              <div className="space-y-2.5 text-xs text-slate-600 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2"><Check size={14} className="text-indigo-600" /> 250,000 Photos per month</div>
                <div className="flex items-center gap-2"><Check size={14} className="text-indigo-600" /> 365-Day Retention Policy</div>
                <div className="flex items-center gap-2"><Check size={14} className="text-indigo-600" /> White-Label Custom Domain</div>
                <div className="flex items-center gap-2"><Check size={14} className="text-indigo-600" /> Dedicated SLA & Priority Queue</div>
              </div>
            </div>
            <Link href="/register" className="lr-btn-subtle-glass w-full py-3 rounded-full text-center text-xs font-bold block">
              Contact Enterprise
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 py-12 bg-white text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                LR
              </div>
              <div>
                <span className="font-extrabold text-slate-900 block text-sm">LensRecall</span>
                <span className="text-[11px] text-slate-400">
                  AI-Powered Event Photography &amp; Biometric Recall
                </span>
              </div>
            </div>

            {/* Direct Contact Channels */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
              <a href="tel:+917661907426" className="flex items-center gap-1.5 text-slate-700 hover:text-indigo-600 transition-colors bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                📞 <span>+91 7661907426</span>
              </a>
              <a href="mailto:lookalivesolutions@gmail.com" className="flex items-center gap-1.5 text-slate-700 hover:text-indigo-600 transition-colors bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                ✉️ <span>lookalivesolutions@gmail.com</span>
              </a>
              <Link href="/contact" className="lr-btn-primary-gradient px-3.5 py-1.5 rounded-xl text-white font-bold shadow-sm">
                Contact Us
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100 text-center sm:text-left">
            <div className="text-slate-600 font-semibold">
              Credit to lookalivesolutions2026 &bull; All Rights Reserved
            </div>

            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-indigo-600 transition-colors">
                Privacy &amp; GDPR
              </Link>
              <Link href="/pricing" className="hover:text-indigo-600 transition-colors">
                Pricing Plans
              </Link>
              <Link href="/contact" className="hover:text-indigo-600 transition-colors">
                Contact Support
              </Link>
              <Link href="/login" className="hover:text-indigo-600 transition-colors">
                Studio Sign In
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
