'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  HardDrive,
  CreditCard,
  Activity,
  CheckCircle2,
  Search,
} from 'lucide-react';


interface StudioOrg {
  id: string;
  name: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  owner: string;
  eventsCount: number;
  photosCount: number;
  storageMB: number;
  mrrINR: number;
  status: 'ACTIVE' | 'SUSPENDED';
  joinedDate: string;
}

const INITIAL_ORGS: StudioOrg[] = [];

export default function SuperAdminLightPage() {
  const [orgs, setOrgs] = useState<StudioOrg[]>(INITIAL_ORGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');

  const filteredOrgs = orgs.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.owner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === 'ALL' || org.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  const toggleStatus = (id: string) => {
    setOrgs(
      orgs.map((org) =>
        org.id === id
          ? {
              ...org,
              status: org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
            }
          : org,
      ),
    );
  };

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 font-bold text-[10px] uppercase tracking-wider border border-red-200">
              Control Plane
            </span>
            <span className="text-xs text-slate-500 font-mono">v1.0.0-PROD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Super Admin Platform Cockpit
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Global multi-tenant governance, AWS Rekognition collection telemetry, and studio administration
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/organizer"
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-800 shadow-sm transition-all"
          >
            Switch to Studio View &rarr;
          </Link>
        </div>
      </div>

      {/* ── Global Key Performance Metrics ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Studios</span>
            <Building2 size={18} className="text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{orgs.length} Active</div>
          <p className="text-[11px] text-slate-500">48 Studios Registered</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Events</span>
            <Calendar size={18} className="text-purple-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">245</div>
          <p className="text-[11px] text-slate-500">312 Total Hosted Events</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Photos in Storage</span>
            <HardDrive size={18} className="text-cyan-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">184.5k</div>
          <p className="text-[11px] text-slate-500">284.5 GB in Cloudflare R2</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Platform MRR</span>
            <CreditCard size={18} className="text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">₹3,84,000</div>
          <p className="text-[11px] text-emerald-700 font-semibold">+18.4% this month</p>
        </div>
      </div>

      {/* ── Infrastructure & AI Telemetry (Light Mode) ─────────────────────── */}
      <div id="infrastructure" className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Live Cloud Infrastructure Telemetry
              </h3>
              <p className="text-xs text-slate-500">
                PostgreSQL pgvector, Cloudflare R2, and AWS Rekognition collection health
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 size={13} />
            All Clusters Operational
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
              AWS Rekognition Collections
            </span>
            <div className="text-base font-mono font-bold text-indigo-600">
              245 Partitions • 380ms Avg Latency
            </div>
            <p className="text-[10px] text-slate-500">Region: ap-south-1 (Mumbai)</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
              Cloudflare R2 Object Storage
            </span>
            <div className="text-base font-mono font-bold text-cyan-600">
              42ms Edge Latency • 0 Egress Cost
            </div>
            <p className="text-[10px] text-slate-500">Dual presigned PUT pipeline</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
              BullMQ Worker Queues
            </span>
            <div className="text-base font-mono font-bold text-emerald-600">
              0 Backlog Tasks • 4 Queues Active
            </div>
            <p className="text-[10px] text-slate-500">Image / Detection / Embedding / Zip</p>
          </div>
        </div>
      </div>

      {/* ── Studio & Organization Management Table ─────────────────────────── */}
      <div id="studios" className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Studio & Organization Directory
            </h3>
            <p className="text-xs text-slate-500">
              Manage accounts, enforce quotas, review storage, and suspend/activate tenants
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative w-48 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search studio or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Plans</option>
              <option value="FREE">Free Starter</option>
              <option value="PRO">Pro Studio</option>
              <option value="ENTERPRISE">Enterprise Agency</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">Studio Name</th>
                <th className="p-4">Plan Tier</th>
                <th className="p-4">Events</th>
                <th className="p-4">Photos</th>
                <th className="p-4">MRR</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    No studios or tenant organizations registered yet.
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-900">
                    {org.name}
                    <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                      {org.owner} • Joined {org.joinedDate}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        org.plan === 'ENTERPRISE'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : org.plan === 'PRO'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {org.plan === 'ENTERPRISE' ? 'ENTERPRISE AGENCY' : org.plan === 'PRO' ? 'PRO STUDIO' : 'FREE STARTER'}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-800">
                    {org.eventsCount}
                  </td>
                  <td className="p-4 font-semibold text-slate-800">
                    {org.photosCount.toLocaleString()} photos
                    <span className="block text-[10px] text-slate-500 font-normal">
                      {(org.storageMB / 1024).toFixed(1)} GB stored
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-emerald-600">
                    {org.mrrINR > 0 ? `₹${org.mrrINR.toLocaleString()}/mo` : '₹0'}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        org.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {org.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => toggleStatus(org.id)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        org.status === 'ACTIVE'
                          ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {org.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>

                    <Link
                      href="/organizer"
                      className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold inline-block"
                    >
                      Enter Studio
                    </Link>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
