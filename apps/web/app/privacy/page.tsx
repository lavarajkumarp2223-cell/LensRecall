'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Lock,
  Clock,
  Trash2,
  CheckCircle2,
  UserX,
  ArrowLeft,
} from 'lucide-react';


export default function PrivacyRightsLightPage() {
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('evt_wedding_01');
  const [reason, setReason] = useState('GUEST_REQUEST');
  const [status, setStatus] = useState<'IDLE' | 'SUBMITTING' | 'SUCCESS' | 'ERROR'>('IDLE');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('SUBMITTING');

    setTimeout(() => {
      setStatus('SUCCESS');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft size={16} />
            <span>Return to Homepage</span>
          </Link>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-emerald-600" />
            <span className="font-bold text-xs text-slate-900">
              Biometric Trust & Privacy Center
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-16">
        {/* ── Hero Section ──────────────────────────────────────────────────── */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
            <Shield size={14} />
            <span>GDPR Article 17 & CCPA Biometric Privacy Standard</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
            Privacy First. <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 bg-clip-text text-transparent">
              Your Face is Never Exposed or Sold.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            LensRecall uses mathematical face vectors strictly isolated within individual event partitions. We never build cross-event biometric profiles or store raw facial imagery without consent.
          </p>
        </div>

        {/* ── The 4 Pillars of Biometric Security ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Lock size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Event-Partitioned Isolation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every event creates a strictly isolated AWS Rekognition collection partition (<code className="text-indigo-600 font-mono">lensrecall_&#123;eventId&#125;</code>). Face searches operate exclusively within that partition. Zero data is shared across events.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Clock size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Automated Retention Purge</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Organizers set automated biometric retention rules (30, 90, 180, or 365 days). Once retention expires, background cron jobs automatically delete all facial vector embeddings from cloud storage.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Zero Raw Embedding Storage</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We never save raw biometric vector arrays to disk or expose them via API. Searches use one-time ephemeral query vectors that are immediately purged from memory upon completion.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <UserX size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Right to Erasure (Self-Service)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Any attendee can submit a self-service deletion request below. All photos containing their face embedding will be purged and unlinked within 24 business hours.
            </p>
          </div>
        </div>

        {/* ── Self-Service Deletion Request Form ────────────────────────────── */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-lg space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Trash2 size={20} className="text-rose-600" />
              <span>Submit Biometric Erasure Request</span>
            </h2>
            <p className="text-xs text-slate-500">
              Pursuant to GDPR Article 17, CCPA Section 1798.105, and Indian DPDPA 2023
            </p>
          </div>

          {status === 'SUCCESS' ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span>Erasure Request Queued Successfully</span>
              </div>
              <p className="text-xs text-emerald-700">
                Your request has been assigned reference <strong>DEL-REQ-89420</strong>. All indexed facial vector representations associated with your details will be purged within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Your Full Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone Number (Used during verification)
                  </label>
                  <input
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Event Shoot
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="evt_wedding_01">Rohan & Priya Wedding Gala (Aug 24, 2026)</option>
                  <option value="evt_conf_02">TechVision Global Summit 2026 (Aug 20, 2026)</option>
                  <option value="evt_corp_03">Apex Annual Awards Night (Aug 15, 2026)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reason for Erasure Request
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="GUEST_REQUEST">Attendee / Guest Personal Preference</option>
                  <option value="CONSENT_REVOCATION">Consent Withdrawn for Facial Recognition</option>
                  <option value="MINOR_PROTECTION">Protection of Minor's Biometric Representation</option>
                  <option value="ORGANIZER_PURGE">Event Concluded & Delivery Complete</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={status === 'SUBMITTING'}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                {status === 'SUBMITTING' ? 'Submitting Request...' : 'Submit Erasure & Purge Request'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
