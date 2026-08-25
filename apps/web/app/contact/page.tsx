'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Phone,
  Mail,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Send,
  Clock,
  MapPin,
  Shield,
  HelpCircle,
} from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('STUDIO_INQUIRY');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Open mailto with form data as a real fallback since there's no backend API
    const subjectMap: Record<string, string> = {
      STUDIO_INQUIRY: 'Studio Inquiry',
      TECHNICAL_SUPPORT: 'Technical Support',
      BILLING: 'Billing Question',
      PARTNERSHIP: 'Partnership Proposal',
      OTHER: 'General Question',
    };
    const mailSubject = encodeURIComponent(`[LensRecall] ${subjectMap[subject] || subject}`);
    const mailBody = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\n\n${message}`
    );
    window.open(`mailto:lookalivesolutions@gmail.com?subject=${mailSubject}&body=${mailBody}`, '_blank');

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans">
      {/* ── Top Header Navbar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              LR
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              LensRecall
            </span>
          </Link>

          <div className="flex items-center gap-4 text-xs font-bold">
            <Link href="/" className="text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1">
              <ArrowLeft size={14} />
              Back to Home
            </Link>
            <Link
              href="/organizer"
              className="lr-btn-primary-gradient px-4 py-2 rounded-xl text-white shadow-sm"
            >
              Studio Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Contact Container ─────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-12">
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs">
            <Sparkles size={13} className="text-amber-500" />
            <span>We are here to assist you 24/7</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Get in Touch with LookAliveSolutions
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Have questions about AI face recall, photography studio onboarding, custom enterprise deployments, or event setup? Reach out to our dedicated support team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Left 5 Cols: Direct Contact Channels ───────────────────────── */}
          <div className="lg:col-span-5 space-y-4">
            {/* Phone Card */}
            <a
              href="tel:+917661907426"
              className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex items-start gap-4 group block"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Phone size={22} />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Direct Phone / WhatsApp</span>
                <div className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  +91 7661907426
                </div>
                <p className="text-xs text-slate-500">Available Mon - Sat &bull; 9:00 AM - 9:00 PM IST</p>
              </div>
            </a>

            {/* Email Card */}
            <a
              href="mailto:lookalivesolutions@gmail.com"
              className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex items-start gap-4 group block"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Mail size={22} />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Email Support</span>
                <div className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors break-all">
                  lookalivesolutions@gmail.com
                </div>
                <p className="text-xs text-slate-500">Responses guaranteed within 2 hours</p>
              </div>
            </a>

            {/* LookAliveSolutions Info Box */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-xl space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-amber-400">
                  <Shield size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">LookAliveSolutions 2026</h3>
                  <p className="text-[11px] text-slate-400">AI Vision & Digital Platform Engineering</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-amber-400 shrink-0" />
                  <span>24/7 Dedicated Server & Rekognition Monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-amber-400 shrink-0" />
                  <span>Serving Photographers & Studios Pan-India</span>
                </div>
                <div className="flex items-center gap-2">
                  <HelpCircle size={14} className="text-amber-400 shrink-0" />
                  <span>Fast Onboarding & Hardware Standee Customization</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right 7 Cols: Interactive Contact Form ─────────────────────── */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              {submitted ? (
                <div className="py-12 text-center space-y-4 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Message Received!</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Thank you for reaching out to <strong>LookAliveSolutions</strong>. Our lead representative will call or email you at <strong>{email || phone}</strong> shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setName('');
                      setEmail('');
                      setPhone('');
                      setMessage('');
                    }}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <MessageSquare size={18} className="text-indigo-600" />
                    <h2 className="font-bold text-base text-slate-900">Send an Online Inquiry</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Lava Kumar"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. lookalivesolutions@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / WhatsApp Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 7661907426"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Inquiry Purpose</label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none cursor-pointer"
                      >
                        <option value="STUDIO_INQUIRY">Photography Studio Onboarding</option>
                        <option value="EVENT_ASSISTANCE">Live Event Support & Standees</option>
                        <option value="ENTERPRISE_PLAN">Custom Pricing / Enterprise SLA</option>
                        <option value="TECHNICAL_HELP">Technical & Rekognition Inquiries</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Message or Requirements</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Tell us how we can help you with your photography business or upcoming event shoot..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl lr-btn-primary-gradient text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <Send size={15} />
                    <span>{loading ? 'Submitting Message...' : 'Send Message to LookAliveSolutions'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 py-8 bg-white text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">LensRecall</span>
            <span>&bull;</span>
            <span className="font-semibold text-slate-700">Credit to lookalivesolutions2026</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="tel:+917661907426" className="hover:text-indigo-600 transition-colors font-medium">
              📞 7661907426
            </a>
            <a href="mailto:lookalivesolutions@gmail.com" className="hover:text-indigo-600 transition-colors font-medium">
              ✉️ lookalivesolutions@gmail.com
            </a>
            <Link href="/privacy" className="hover:text-indigo-600 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
