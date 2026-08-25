'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const TIERS = [
  {
    name: 'Free Starter',
    description: 'Perfect for small test shoots, hobbyists, or solo portrait sessions.',
    priceMonthlyINR: 0,
    priceAnnualINR: 0,
    features: [
      '1 Active Event at a time',
      'Up to 500 High-Res Photos',
      '30-Day Automated Face Retention',
      'Standard QR Code Standee generator',
      'Community Email Support',
    ],
    highlighted: false,
    cta: 'Start Free Trial',
    badge: 'FREE TIER',
  },
  {
    name: 'Pro Studio',
    description: 'Designed for wedding studios, event photographers, and agency hosts.',
    priceMonthlyINR: 4999,
    priceAnnualINR: 3999,
    features: [
      'Unlimited Active Events',
      '50,000 Photos per month included',
      '90-Day Biometric Face Retention',
      'Dual Presigned R2 Lossless Pipeline',
      'Custom Branding & Standee PDF Export',
      'Asynchronous Bulk ZIP Downloads',
      'Priority Rekognition Queue (<400ms)',
    ],
    highlighted: true,
    cta: 'Start 14-Day Free Trial',
    badge: 'MOST POPULAR',
  },
  {
    name: 'Enterprise Agency',
    description: 'For festivals, sports leagues, massive tech summits, and enterprise media houses.',
    priceMonthlyINR: 14999,
    priceAnnualINR: 11999,
    features: [
      'Unlimited Events & Unlimited Team Seats',
      '250,000 Photos per month included',
      '365-Day Biometric Retention Policy',
      'Custom White-Label Domain (photos.yourstudio.com)',
      'Dedicated AWS Rekognition Partition Cluster',
      '99.9% Uptime SLA Guarantee',
      '24/7 Dedicated Account Manager',
    ],
    highlighted: false,
    cta: 'Contact Enterprise Sales',
    badge: 'ENTERPRISE',
  },
];

const FAQS = [
  {
    q: 'How does the 14-day free trial work?',
    a: 'You get full access to the Pro Studio plan for 14 days without entering a credit card. You can upload photos, generate QR standees, and test live facial recognition matching instantly.',
  },
  {
    q: 'How does event partitioning protect guest privacy?',
    a: 'Each event has its own isolated AWS Rekognition collection. Biometric face searches are only performed within that single event and are automatically purged after the retention window.',
  },
  {
    q: 'Can attendees download their matched photos in original resolution?',
    a: 'Yes! Attendees can download individual full-resolution photos or generate an asynchronous bulk ZIP archive containing all their matched photos with one click.',
  },
  {
    q: 'Can I cancel or switch plans anytime?',
    a: 'Absolutely. You can upgrade, downgrade, or cancel your subscription at any time directly from your Studio Settings portal via Stripe.',
  },
];

export default function PricingLightPage() {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
            <span className="font-bold text-xs text-slate-900">LensRecall Pricing</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-16">
        {/* ── Hero Title ────────────────────────────────────────────────────── */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700">
            <Sparkles size={14} className="text-amber-500" />
            <span>Simple, Transparent Pricing</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
            Predictable Plans for <br />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
              Every Studio & Scale.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            No hidden per-face surcharges or bandwidth fees. 14-day free trial on all plans.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="inline-flex items-center gap-3 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm mt-4">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'MONTHLY'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('ANNUAL')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'ANNUAL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* ── Pricing Cards Grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TIERS.map((tier) => {
            const price = billingCycle === 'ANNUAL' ? tier.priceAnnualINR : tier.priceMonthlyINR;
            return (
              <div
                key={tier.name}
                className={`p-8 rounded-3xl bg-white border flex flex-col justify-between space-y-6 transition-all ${
                  tier.highlighted
                    ? 'border-2 border-indigo-500 shadow-xl shadow-indigo-500/10 relative scale-105 md:z-10'
                    : 'border-slate-200 shadow-sm'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        tier.highlighted
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {tier.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {tier.description}
                    </p>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900">
                        {price === 0 ? '₹0' : `₹${price.toLocaleString()}`}
                      </span>
                      {price > 0 && (
                        <span className="text-xs text-slate-500 font-semibold">
                          / month
                        </span>
                      )}
                    </div>
                    {billingCycle === 'ANNUAL' && price > 0 && (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                        Billed annually (₹{(price * 12).toLocaleString()}/year)
                      </p>
                    )}
                  </div>

                  {/* Features list */}
                  <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs">
                    {tier.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2 text-slate-700">
                        <Check size={15} className="text-indigo-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href="/register"
                  className={`w-full py-3 rounded-full text-center text-xs font-bold block transition-all ${
                    tier.highlighted
                      ? 'lr-btn-primary-gradient shadow-md'
                      : 'lr-btn-subtle-glass'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            );
          })}
        </div>

        {/* ── FAQ Section ───────────────────────────────────────────────────── */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-slate-900 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isOpen && (
                    <div className="p-4 text-xs text-slate-600 leading-relaxed bg-white border-t border-slate-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
