'use client';

import { useState, useEffect } from 'react';
import {
  Building,
  Users,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { getCurrentUser } from '../../../lib/events-storage';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'PHOTOGRAPHER' | 'MEMBER';
  status: 'ACTIVE' | 'INVITED';
}

const INITIAL_MEMBERS: Member[] = [];

export default function OrganizationSettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'billing'>('profile');
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [watermark, setWatermark] = useState('');
  const [saved, setSaved] = useState(false);

  // Team state
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'PHOTOGRAPHER' | 'MEMBER'>('PHOTOGRAPHER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Initialize from logged-in user
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      const studioName = user.organizationName || `${user.fullName} Studio`;
      setOrgName(studioName);
      setOrgSlug(studioName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
      setContactEmail(user.email);
      setWatermark(`© ${studioName} ${new Date().getFullYear()}`);
    }
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteLoading(true);

    setTimeout(() => {
      setMembers([
        ...members,
        {
          id: `mem_${Date.now()}`,
          name: inviteEmail.split('@')[0] || 'Team Member',
          email: inviteEmail,
          role: inviteRole,
          status: 'INVITED',
        },
      ]);
      setInviteEmail('');
      setInviteLoading(false);
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 3000);
    }, 600);
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Building size={28} className="text-indigo-600" />
          Studio & Organization Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your organization branding, photographer team access, and subscription plan
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        {[
          { id: 'profile', label: 'Studio Profile & Branding', icon: Building },
          { id: 'team', label: 'Team & Photographers', icon: Users },
          { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as 'profile' | 'team' | 'billing')}
            className={`flex items-center gap-2 pb-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Studio Profile ────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-base text-slate-900">General Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Organization / Studio Name</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Public URL Identifier (Slug)</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-xs font-mono text-slate-500">
                    lensrecall.com/o/
                  </span>
                  <input
                    type="text"
                    required
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-r-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact / Support Email</label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full sm:max-w-md bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900">Branding & Watermarking</h3>
            <p className="text-xs text-slate-500">
              Configure optional watermark text stamped on guest preview images before full download.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Preview Watermark Text</label>
              <input
                type="text"
                value={watermark}
                onChange={(e) => setWatermark(e.target.value)}
                className="w-full sm:max-w-md bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                placeholder="© Your Studio Name"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" className="lr-btn-primary-gradient px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              Save Changes
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold animate-fade-in bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <CheckCircle2 size={14} />
                Settings saved successfully
              </span>
            )}
          </div>
        </form>
      )}

      {/* ── Tab: Team Members ──────────────────────────────────────────────── */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Invite form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900">Invite Team Member</h3>
            <p className="text-xs text-slate-500">
              Invite photographers to upload event shoots directly, or admins to manage events and billing.
            </p>

            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="email"
                  required
                  placeholder="photographer@studio.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as 'ADMIN' | 'PHOTOGRAPHER' | 'MEMBER')
                }
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none sm:w-48"
              >
                <option value="PHOTOGRAPHER">Photographer</option>
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Viewer / Member</option>
              </select>

              <button
                type="submit"
                disabled={inviteLoading}
                className="lr-btn-primary-gradient px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {inviteLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    <Plus size={15} />
                    Send Invite
                  </>
                )}
              </button>
            </form>

            {inviteSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2 animate-fade-in">
                <CheckCircle2 size={14} />
                Invitation sent! They will receive a link to join your studio.
              </div>
            )}
          </div>

          {/* Members list */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            <div className="p-4 bg-slate-50/50">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Current Members ({members.length})
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {members.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No additional team members invited yet. Send an invitation above to add photographers or studio admins.
                </div>
              ) : (
                members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-sm text-indigo-700">
                      {member.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        {member.name}
                        {member.status === 'INVITED' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                            Invited
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{member.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                      {member.role}
                    </span>

                    {member.role !== 'OWNER' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove Member"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Plan & Billing ────────────────────────────────────────────── */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Current plan card */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] uppercase font-bold text-indigo-200 mb-2">
                  <Sparkles size={11} className="text-amber-300" /> Current Plan
                </span>
                <h3 className="text-2xl font-black">LensRecall Pro</h3>
                <p className="text-xs text-indigo-200/80 mt-1">
                  Unlimited events &bull; 50,000 photos/mo &bull; AWS Rekognition AI Discovery
                </p>
              </div>
              <div className="sm:text-right">
                <div className="text-3xl font-black">₹4,999</div>
                <div className="text-xs text-indigo-200">per month &bull; Billed annually</div>
              </div>
            </div>

            {/* Storage bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-indigo-200">
                <span>Storage used: 42.6 GB</span>
                <span>500 GB Included</span>
              </div>
              <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: '8.5%' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
